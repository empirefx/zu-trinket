import { useEffect, useRef } from "react";
import L from "leaflet";
import { catColor, toPixel, type MapMeta, type Point, type Transform, type TransformMap, type Viewport } from "../../lib/data";

type Props = {
  meta: MapMeta;
  transform: TransformMap;
  points: Point[];
  visible: Set<string>;
  onCursor: (xy: [number, number] | null) => void;
  focus?: { id: number } | null;
  saved: Set<number>;
  onToggleSaved: (id: number) => void;
  onViewport?: (v: Viewport | null) => void;
};

export default function MapView({
  meta,
  transform,
  points,
  visible,
  onCursor,
  focus,
  saved,
  onToggleSaved,
  onViewport,
}: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const overlay = useRef<L.ImageOverlay | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
  // The game reports the cursor in *map units*: the longer axis of the world
  // rect is 1000 units, so cursor = (world - rect.min) * 1000 / max(size).
  // The map pixel is px = a * (gx - rect.minX), hence the factor below.
  const kRef = useRef<{ kx: number; kz: number; ox: number; oz: number } | null>(null);
  // current transform, for the viewport report below
  const tRef = useRef<Transform | null>(null);
  const onViewportRef = useRef(onViewport);

  // the viewport as fractions of the map's pixel box (the minimap's rectangle);
  // fired on move end only — nothing runs per frame
  const emitViewport = () => {
    const m = map.current;
    const onV = onViewportRef.current;
    if (!m || !onV) return;
    const t = tRef.current;
    if (!t) {
      onV(null);
      return;
    }
    const b = m.getBounds();
    const x1 = Math.min(Math.max(b.getWest(), 0), t.w);
    const x2 = Math.min(Math.max(b.getEast(), 0), t.w);
    const y1 = Math.min(Math.max(b.getSouth(), 0), t.h);
    const y2 = Math.min(Math.max(b.getNorth(), 0), t.h);
    onV({ x: x1 / t.w, y: y1 / t.h, w: (x2 - x1) / t.w, h: (y2 - y1) / t.h });
  };

  // create map once
  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, {
      crs: L.CRS.Simple,
      minZoom: -4,
      maxZoom: 4,
      zoomSnap: 0.25,
      attributionControl: false,
      zoomControl: false,
    });
    // zoom control removed
    markers.current = L.layerGroup().addTo(m);
    // latlng = [py, px] in CRS.Simple, so lng/lat are the in-game map coords.
    m.on("mousemove", (e: L.LeafletMouseEvent) => {
      const k = kRef.current;
      onCursor(k ? [e.latlng.lng * k.kx + k.ox, e.latlng.lat * k.kz + k.oz] : null);
    });
    m.on("mouseout", () => onCursor(null));
    m.on("moveend", emitViewport);
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, [onCursor]);

  // swap base image + transform when map changes
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (overlay.current) overlay.current.remove();
    const t = transform[meta.slug] ?? null;
    const r = meta.rect;
    const s = r ? Math.max(r[2], r[3]) / 1000 : 0;
    kRef.current =
      t && s > 0
        ? { kx: 1 / (t.a * s), kz: 1 / (t.e * s), ox: t.ou ?? 0, oz: t.ov ?? 0 }
        : null;
    tRef.current = t;
    // overlay covers the game map's pixel box (image is stretched to fit)
    const w = t ? t.w : meta.width;
    const h = t ? t.h : meta.height;
    const bounds = L.latLngBounds([0, 0], [h, w]);
    overlay.current = L.imageOverlay(meta.image, bounds, { interactive: false }).addTo(m);
    overlay.current.bringToBack();
    m.fitBounds(bounds);
    // fitBounds may not land on a moveend event; report the viewport now too
    emitViewport();
  }, [meta, transform]);

  // keep the emit function's view of the callback fresh (it runs per map event)
  useEffect(() => {
    onViewportRef.current = onViewport;
  });

  // rebuild markers when map / points / filter changes
  useEffect(() => {
    const g = markers.current;
    if (!g) return;
    g.clearLayers();
    const t = transform[meta.slug];
    if (!t) return;
    for (const p of points) {
      if (!visible.has(p.cat)) continue;
      const [px, py] = toPixel(t, p.gx, p.gz);
      // box is the map's own pixel extent (rect_size/UPPX); a point outside it is
      // off this map's image. tiny epsilon for float edge cases.
      if (px < -1 || py < -1 || px > t.w + 1 || py > t.h + 1) continue;
      const c = catColor(p.cat);
      L.marker([py, px], {
        icon: L.divIcon({
          // the CatPanel mask icons, in the category color; className "" drops
          // Leaflet's default white box around div icons; a pinned marker
          // gets the .marker-saved ring
          html: `<span class="cat-icon cat-${p.cat} marker-icon${
            saved.has(p.id) ? " marker-saved" : ""
          }" style="color:${c}"></span>`,
          className: "",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
      })
        .bindTooltip(
          `<b>${escapeHtml(p.name)}</b><br/>${p.gx.toFixed(0)}, ${p.gy.toFixed(0)}, ${p.gz.toFixed(0)}`,
          { direction: "top", offset: [0, -10] },
        )
        // click pins/unpins the point in the saved list
        .on("click", () => onToggleSaved(p.id))
        .addTo(g);
    }
  }, [meta.slug, transform, points, visible, saved, onToggleSaved]);

  // pan to a search result (runs after the image/bounds effect on map change)
  useEffect(() => {
    const m = map.current;
    if (!m || !focus) return;
    const t = transform[meta.slug];
    const p = points.find((x) => x.id === focus.id);
    if (!t || !p) return;
    const [px, py] = toPixel(t, p.gx, p.gz);
    m.setView([py, px], Math.max(m.getZoom(), 1));
  }, [focus, points, transform, meta.slug]);

  return <div ref={el} className="absolute inset-0 bg-[#020617]" />;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
  );
}
