"""Build map-tool data from the extracted Zu Online client.

Reads:
    <extracted>/DATA/MAPS.ZU1        (map table: world path + world rect)
    <extracted>/DATA/KEYWORDDATA.ZU1 (named spawn/POI points)
    <extracted>/MAPS/<WORLD>_MINIMAP.jpg | _GRAYMAP.jpg

Writes into the web project's public/:
    public/data/maps.json     [{id, world, slug, name, image, width, height, rect, group}]
    public/data/points.json   [{id, name, gx, gy, gz, group, cat, map, extra}]
    public/maps/<slug>.jpg    map image
    public/data/transform.json  per-map world->pixel transform (editable)

Nothing here needs the world->pixel transform to be *correct*; the transform is
emitted as a config the app consumes, so the mapping can be corrected without
re-running this script. Point->map assignment uses the smallest map rect that
contains the point (a heuristic; overridable in data/overrides.json).
"""
import json
import os
import struct
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.dirname(HERE)
EXTRACTED = os.environ.get("ZU_EXTRACTED", r"E:\ZUtest\extracted")
DATA = os.path.join(EXTRACTED, "DATA")
MAPSIMG = os.path.join(EXTRACTED, "MAPS")
PUB = os.path.join(PROJECT, "public")
sys.path.insert(0, r"E:\ZUtest\zutools")
import zudata  # noqa: E402


def cstr(b):
    e = b.find(b"\x00")
    return (b[:e] if e >= 0 else b).decode("latin1")


def jpeg_size(path):
    with open(path, "rb") as f:
        if f.read(2) != b"\xff\xd8":
            return None
        while True:
            b = f.read(1)
            if not b:
                return None
            if b != b"\xff":
                continue
            while b == b"\xff":
                b = f.read(1)
            m = b[0]
            if m in (0xd8, 0xd9) or 0xd0 <= m <= 0xd7:
                continue
            ln = int.from_bytes(f.read(2), "big")
            if 0xc0 <= m <= 0xcf and m not in (0xc4, 0xc8, 0xcc):
                f.read(1)
                h = int.from_bytes(f.read(2), "big")
                w = int.from_bytes(f.read(2), "big")
                return (w, h)
            f.seek(ln - 2, 1)


def read_maps():
    blob = zudata.read_zu1(os.path.join(DATA, "MAPS.ZU1"))
    REC = 1316
    out = []
    for i in range((len(blob) - 4) // REC):
        r = blob[4 + i * REC:4 + (i + 1) * REC]
        idv = int.from_bytes(r[0:4], "little")
        world = cstr(r[4:0x54]).split("/")[-1].lower()
        if not world:
            continue
        x0, y0, z0, sx, sz = struct.unpack_from("<5f", r, 0x54)
        fw, fh = struct.unpack_from("<2i", r, 0x108)
        # display name: MAPS record title @0x37 (e.g. "Tai.Holy City"); may carry
        # non-ASCII region glyphs before the ASCII part, so keep printable only.
        title = "".join(ch for ch in cstr(r[0x37:0x54]) if 32 <= ord(ch) < 127).strip()
        out.append({"id": idv, "world": world, "title": title,
                    "rect": [x0, z0, sx, sz],
                    "box": [fw, fh] if fw > 0 and fh > 0 else None})
    return out


def read_points():
    blob = zudata.read_zu1(os.path.join(DATA, "KEYWORDDATA.ZU1"))
    REC = 24 + 11 * 255
    pts = []
    for i in range((len(blob) - 4) // REC):
        r = blob[4 + i * REC:4 + (i + 1) * REC]
        grp = struct.unpack_from("<I", r, 4)[0]
        mid = struct.unpack_from("<I", r, 8)[0]   # = MAPS.ZU1 map id
        c = cstr(r[24:24 + 255]).split(",")
        name = cstr(r[24 + 10 * 255:24 + 11 * 255])
        if "click here to track" in name.lower():
            continue  # quest-log helper duplicates, not map markers
        try:
            x, y, z = float(c[0]), float(c[1]), float(c[2])
        except (ValueError, IndexError):
            continue
        extra = []
        for k in range(1, 10):
            v = cstr(r[24 + k * 255:24 + (k + 1) * 255])
            p = v.split(",")
            if len(p) == 3:
                try:
                    extra.append([float(p[0]), float(p[1]), float(p[2])])
                except ValueError:
                    pass
        pts.append({"id": i, "name": name, "gx": x, "gy": y, "gz": z,
                    "group": grp, "mid": mid, "extra": extra})
    return pts


def load_categories():
    with open(os.path.join(HERE, "categories.json"), encoding="utf-8") as f:
        return json.load(f)


def classify(group, name, rules):
    """group comes from the record header: 1=npc, 2=mob, 3=object (the game's
    own search tabs). Object names matching a special rule become that category."""
    base = {1: "npc", 2: "mob", 3: "object"}.get(group, "object")
    if group == 3:
        low = name.lower()
        for cat, pats in rules.items():
            if cat.startswith("_"):
                continue
            for p in pats:
                if p in low:
                    return cat
    return base


def enumerate_image_maps():
    """world -> image path, preferring MINIMAP over GRAYMAP."""
    out = {}
    for fn in os.listdir(MAPSIMG):
        if not fn.lower().endswith(".jpg"):
            continue
        up = fn[:-4].upper()
        for suf, rank in (("_MINIMAP", 0), ("_GRAYMAP", 1)):
            if up.endswith(suf):
                world = fn[: -len(suf) - 4].lower()
                if world not in out or rank < out[world][0]:
                    out[world] = (rank, os.path.join(MAPSIMG, fn))
    return {w: p for w, (_, p) in out.items()}


def join_rects(rect_src, world):
    """Match a MAPS.ZU1 world name (sometimes truncated on disk) to an image world."""
    if world in rect_src:
        return rect_src[world]
    best = None
    for w, r in rect_src.items():
        if len(w) >= 13 and world.startswith(w):
            if best is None or len(w) > len(best[0]):
                best = (w, r)
    return best[1] if best else None


def world_to_slug(world, images):
    """Map a MAPS.ZU1 world field to an image slug, tolerating truncation."""
    if not world:
        return None
    if world in images:
        return world
    longer = [w for w in images if w.startswith(world) and len(world) >= 6]
    if longer:
        return min(longer, key=len)
    shorter = [w for w in images if world.startswith(w) and len(w) >= 6]
    if shorter:
        return max(shorter, key=len)
    return None


def map_title(titles, slug):
    """Resolve an image slug to its MAPS.ZU1 display title (exact, then prefix)."""
    if slug in titles:
        return titles[slug]
    for w, t in titles.items():
        if len(w) >= 10 and (slug.startswith(w) or w.startswith(slug)):
            return t
    return None


def main():
    cats = load_categories()
    all_maps = read_maps()
    title_src = {}
    for m in all_maps:
        if m["title"] and m["id"] > 0 and len(m["world"]) >= 10 and not m["world"].endswith("_"):
            title_src.setdefault(m["world"], m["title"])
    rect_src = {}
    for m in all_maps:
        if m["rect"][2] > 0 and m["world"] and m["world"] not in rect_src:
            rect_src[m["world"]] = {"id": m["id"], "rect": m["rect"], "box": m["box"]}
    images = enumerate_image_maps()
    points = read_points()

    os.makedirs(os.path.join(PUB, "data"), exist_ok=True)
    os.makedirs(os.path.join(PUB, "maps"), exist_ok=True)

    out_maps = []
    box_by_slug = {}
    for world in sorted(images):
        src = images[world]
        w, h = jpeg_size(src) or (0, 0)
        with open(src, "rb") as a, open(os.path.join(PUB, "maps", world + ".jpg"), "wb") as b:
            b.write(a.read())
        info = join_rects(rect_src, world)
        if info and info.get("box"):
            box_by_slug[world] = info["box"]
        title = map_title(title_src, world)
        out_maps.append({
            "id": info["id"] if info else None,
            "world": world, "slug": world,
            "name": title.split(".", 1)[-1] if title else world.upper(),
            "image": f"/maps/{world}.jpg",
            "width": w, "height": h,
            "rect": info["rect"] if info else None,
        })

    # each point carries its MAPS.ZU1 map id (hdr[2]); that is the authoritative
    # point->map link. Fall back to smallest-containing-rect only when the id has
    # no image (region/test records).
    id2slug = {m["id"]: world_to_slug(m["world"], images) for m in all_maps}
    rects = [(m["slug"], m["rect"]) for m in out_maps if m["rect"]]
    by_id = by_rect = 0
    for p in points:
        p["cat"] = classify(p["group"], p["name"], cats)
        slug = id2slug.get(p["mid"])
        if slug:
            p["map"] = slug
            by_id += 1
            continue
        best, bestarea = None, None
        for slug2, (x0, z0, sx, sz) in rects:
            if x0 <= p["gx"] <= x0 + sx and z0 <= p["gz"] <= z0 + sz:
                a = sx * sz
                if bestarea is None or a < bestarea:
                    bestarea, best = a, slug2
        p["map"] = best
        if best:
            by_rect += 1
    print(f"assigned by map-id: {by_id}  fallback by rect: {by_rect}  "
          f"unassigned: {len(points) - by_id - by_rect}")

    # world (x,z) -> in-game map pixel.  Each map's pixel box is its own MAPS.ZU1
    # size field (0x108/0x10C = width,height in game pixels) -- NOT the image size;
    # the minimap image is stretched to fill this box.  So the scale differs per map:
    #   px = (x-rect.minX) * boxW/rect.sizeX ,  py = (z-rect.minZ) * boxH/rect.sizeZ .
    # A single global scale misplaces the maps whose rect/box ratio differs from Holy
    # City's (see the 8-map list the user reported).  Falls back to rect_size/47.5 for
    # records that carry no size field.
    FALLBACK_UPPX = 47.5
    transform = {}
    for m in out_maps:
        if not m["rect"]:
            continue
        x0, z0, sx, sz = m["rect"]
        box = box_by_slug.get(m["slug"])
        if box:
            bw, bh = box
            a, e = bw / sx, bh / sz
        else:
            a = e = 1.0 / FALLBACK_UPPX
            bw, bh = sx / FALLBACK_UPPX, sz / FALLBACK_UPPX
        transform[m["slug"]] = {"a": a, "c": -x0 * a, "e": e, "f": -z0 * e, "w": bw, "h": bh}

    # show maps with a real name first; stable sort keeps slug order within each group
    out_maps.sort(key=lambda m: m["name"] == m["slug"].upper())

    write_json(os.path.join(PUB, "data", "maps.json"), out_maps)
    write_json(os.path.join(PUB, "data", "points.json"), points)
    write_json(os.path.join(PUB, "data", "transform.json"), transform)

    cats_count = {}
    for p in points:
        cats_count[p["cat"]] = cats_count.get(p["cat"], 0) + 1
    assigned = sum(1 for p in points if p["map"])
    with_img = sum(1 for m in out_maps if m["width"])
    with_rect = sum(1 for m in out_maps if m["rect"])
    print(f"maps: {len(out_maps)} (image: {with_img}, rect: {with_rect})")
    print(f"points: {len(points)}  assigned to a map: {assigned}")
    print("categories:", dict(sorted(cats_count.items(), key=lambda kv: -kv[1])))


def write_json(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))


if __name__ == "__main__":
    main()
