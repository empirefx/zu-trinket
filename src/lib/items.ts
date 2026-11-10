export type ItemGrade = "common" | "superior" | "legendary" | "amber";

// One row per rank (upgrade stage) of an item: [atkMin, atkMax, phys, mag].
// rank 0 is the base record; the picker collapses all stages into one Item and
// keeps this table so the drawer can show/apply the chosen rank's stats.
export type RankStats = [number | null, number | null, number | null, number | null];

export type Item = {
  id: number;
  name: string;
  names?: string[];
  class: string;
  tier: number;
  slot: string;
  grade: ItemGrade;
  atkMin: number | null;
  atkMax: number | null;
  phys: number | null;
  mag: number | null;
  icon: string;
  setId: number;
  starGroup: number;
  ranks: RankStats[];
  // The five element values (Metal, Wood, Water, Fire, Earth) per rank stage -
  // from the item record (ITEMS +376). null = the slot was overwritten by a
  // stray word in the shipped data.
  elems: (number | null)[][];
  // Character level the gear needs - the item record's own "YearsNeed"
  // (ITEMS +332).  0 means the game does not write one down for that item.
  reqLevel: number;
  // The same, per upgrade rank: the requirement grows a little with the
  // rank (a tier-7 weapon needs 192 at rank 0 and 203 at rank 9).
  reqLevels: number[];
  // Character level the *crafting recipe* needs - SPELLSEX "Creates ...
  // (Requires Level N)".  Only the craftable grades have one, and it is a
  // different number from reqLevel (it is the recipe's level, not the
  // item's).
  craftLevel: number;
  // Which item table the record came from - always "ITEMS", the one table
  // the shipped client loads (the other generations are never read).
  src: string;
};

// A potential attribute, joined from REFINE.ZU1 (the guide wording, e.g.
// "Rip") and ITEMATT.ZU1 (the in-game wording + tooltip, e.g. "Accuracy").
// The generated table lives in src/components/gear/generated/attrData.ts.
export type { AttrInfo } from "../components/gear/generated/attrData";

// A set definition (suits: 2 per level; epics: 1 per level). bonuses maps piece
// count ("2".."8") -> the in-game bonus text for wearing that many pieces.
export type GearSet = {
  name: string;
  class: string;
  tier: number;
  series: string;
  kind: string;
  bonuses: Record<string, string>;
};

// Darksteel quality tiers, as the game composes them server-side (lowercase
// ids; TIER_LABEL in gearSlots.ts holds the display words).
export type DarksteelTier = "fine" | "well" | "perfect";
// Which stat a darksteel tier sits on: damage, physical defence, magic defence.
export type DarksteelKey = "dmg" | "pd" | "md";

// One config per equipped item. enhance/rank are the 0-30 strips in the drawer.
// attrs/elements are the toggled-on potential attributes / five elements;
// usePlayerStats folds them into the rows (elements: the record's own value x
// the active set multiplier; attributes: the game's percentages in attrData).
export type EquipEntry = {
  item: Item;
  enhance: number;
  rank: number;
  attrs?: string[];
  elements?: string[];
  // Darksteel Stone quality per stat (server-rolled in game; here the tool's
  // percentage estimate — zu-re/docs/darksteel.md). absent = no darksteel.
  darksteel?: Partial<Record<DarksteelKey, DarksteelTier>>;
};

// Enhance curve per STAR group: cumulative bonus fraction for level 0..N (from STAR.bin).
export type StarCurves = Record<string, number[]>;

// items.json is 4.9 MB and only the picker needs it, so fetch it once on
// demand and keep the promise - repeated opens cost nothing.
let cache: Promise<Item[]> | null = null;

export function loadItems(): Promise<Item[]> {
  if (!cache) cache = fetch("/data/items.json").then((r) => r.json() as Promise<Item[]>);
  return cache;
}

let starCache: Promise<StarCurves> | null = null;

export function loadStar(): Promise<StarCurves> {
  if (!starCache) starCache = fetch("/data/star.json").then((r) => r.json() as Promise<StarCurves>);
  return starCache;
}

let setCache: Promise<Record<string, GearSet>> | null = null;

export function loadSets(): Promise<Record<string, GearSet>> {
  if (!setCache) setCache = fetch("/data/sets.json").then((r) => r.json() as Promise<Record<string, GearSet>>);
  return setCache;
}

// Cumulative enhance **fraction** for a group at a level (0.112 = +11.2 %; extra levels clamp to max).
export function enhancePct(star: StarCurves, group: number, level: number): number {
  const curve = star[String(group)];
  if (!curve || level <= 0) return 0;
  return curve[Math.min(level, curve.length - 1)] ?? 0;
}
