import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  catColor,
  fromPixel,
  toPixel,
  type MapMeta,
  type Point,
  type Transform,
  type TransformMap,
} from "../lib/data";

type Props = {
  meta: MapMeta;
  transform: TransformMap;
  points: Point[];
  visible: Set<string>;
  onCursor: (xy: [number, number] | null) => void;
  focus?: { id: number } | null;
};

export default function MapView({ meta, transform, points, visible, onCursor, focus }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const overlay = useRef<L.ImageOverlay | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
  const tRef = useRef<Transform | null>(null);

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
    L.control.zoom({ position: "bottomright" }).addTo(m);
    markers.current = L.layerGroup().addTo(m);
    m.on("mousemove", (e: L.LeafletMouseEvent) => {
      const t = tRef.current;
      onCursor(t ? fromPixel(t, e.latlng.lng, e.latlng.lat) : null);
    });
    m.on("mouseout", () => onCursor(null));
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
    tRef.current = t;
    // overlay covers the game map's pixel box (image is stretched to fit)
    const w = t ? t.w : meta.width;
    const h = t ? t.h : meta.height;
    const bounds = L.latLngBounds([0, 0], [h, w]);
    overlay.current = L.imageOverlay(meta.image, bounds, { interactive: false }).addTo(m);
    overlay.current.bringToBack();
    m.fitBounds(bounds);
  }, [meta, transform]);

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
      L.circleMarker([py, px], {
        radius: 5,
        color: "#0f172a",
        weight: 1.5,
        fillColor: c,
        fillOpacity: 0.95,
      })
        .bindTooltip(
          `<b>${escapeHtml(p.name)}</b><br/>${p.gx.toFixed(0)}, ${p.gy.toFixed(0)}, ${p.gz.toFixed(0)}`,
          { direction: "top", offset: [0, -4] },
        )
        .addTo(g);
    }
  }, [meta.slug, transform, points, visible]);

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

  return <div ref={el} className="map" />;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
  );
}
