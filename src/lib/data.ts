export type MapMeta = {
  id: number | null;
  world: string;
  slug: string;
  name: string;
  image: string;
  width: number;
  height: number;
  rect: [number, number, number, number] | null;
};

export type Point = {
  id: number;
  name: string;
  gx: number;
  gy: number;
  gz: number;
  group: number;
  cat: string;
  map: string | null;
  extra: [number, number, number][];
  // OBJS.ZU1: the NPC's function (its "title") and its level; 0 = unknown
  func: string;
  level: number;
};

// affine world (x,z) -> game-map pixel: px = a*x + c, py = e*z + f.
// w/h are the game map's pixel dimensions (the overlay is stretched to fit).
// ou/ov (optional) = the game-unit coordinate of the image's left/bottom edge
// (in-game corner calibration); the cursor readout adds them back on top of
// px/(a*s) -- without them a calibrated transform would read u+34.
export type Transform = {
  a: number;
  c: number;
  e: number;
  f: number;
  w: number;
  h: number;
  ou?: number;
  ov?: number;
};

export type TransformMap = Record<string, Transform>;

export type Data = {
  maps: MapMeta[];
  points: Point[];
  transform: TransformMap;
};

// fetch + parse with a plain error; an empty body (the dev server restarting
// mid-refresh returns 200 with no content) used to surface as a raw
// "JSON.parse: unexpected end of data" — retry once before giving up
async function loadJson<T>(url: string, attempt = 0): Promise<T> {
  const res = await fetch(url);
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    if (attempt >= 1) throw new Error(`${url}: HTTP ${res.status}, ${text ? "unparseable" : "empty"} body`);
    await new Promise((r) => setTimeout(r, 400));
    return loadJson<T>(url, attempt + 1);
  }
}

export async function loadData(): Promise<Data> {
  const [maps, points, transform] = await Promise.all([
    loadJson<MapMeta[]>("/data/maps.json"),
    loadJson<Point[]>("/data/points.json"),
    loadJson<TransformMap>("/data/transform.json"),
  ]);
  return { maps, points, transform };
}

// game world (x,z) -> game map pixel (px,py)
export function toPixel(t: Transform, gx: number, gz: number): [number, number] {
  return [t.a * gx + t.c, t.e * gz + t.f];
}

export function fromPixel(t: Transform, px: number, py: number): [number, number] {
  return [(px - t.c) / t.a, (py - t.f) / t.e];
}

export type Category = { key: string; label: string; color: string };

// the main map's viewport as fractions of the map's pixel box (minimap rect)
export type Viewport = { x: number; y: number; w: number; h: number };

export const CATEGORIES: Category[] = [
  { key: "npc", label: "NPC", color: "#4aa3ff" },
  { key: "mob", label: "Monster", color: "#e5484d" },
  { key: "object", label: "Object", color: "#f5a524" },
  { key: "stone", label: "Stone", color: "#9ca3af" },
  { key: "herb", label: "Herb", color: "#30a46c" },
];

export function catColor(cat: string): string {
  return CATEGORIES.find((c) => c.key === cat)?.color ?? "#94a3b8";
}

// world (x,z) -> the game's map units (the longer axis of the world rect is
// 1000 units) — the same numbers the in-game cursor readout shows
export function mapUnits(meta: MapMeta, gx: number, gz: number): [number, number] | null {
  if (!meta.rect) return null;
  const [x0, z0, sx, sz] = meta.rect;
  const s = Math.max(sx, sz) / 1000;
  return [(gx - x0) / s, (gz - z0) / s];
}
