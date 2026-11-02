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

export async function loadData(): Promise<Data> {
  const [maps, points, transform] = await Promise.all([
    fetch("/data/maps.json").then((r) => r.json()),
    fetch("/data/points.json").then((r) => r.json()),
    fetch("/data/transform.json").then((r) => r.json()),
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
