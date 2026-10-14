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
};

// affine world (x,z) -> game-map pixel: px = a*x + c, py = e*z + f.
// w/h are the game map's pixel dimensions (the overlay is stretched to fit).
export type Transform = {
  a: number;
  c: number;
  e: number;
  f: number;
  w: number;
  h: number;
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

export const CATEGORIES: { key: string; label: string; color: string }[] = [
  { key: "npc", label: "NPC", color: "#38bdf8" },
  { key: "mob", label: "Monster", color: "#f87171" },
  { key: "object", label: "Object", color: "#94a3b8" },
];

export function catColor(cat: string): string {
  return CATEGORIES.find((c) => c.key === cat)?.color ?? "#94a3b8";
}
