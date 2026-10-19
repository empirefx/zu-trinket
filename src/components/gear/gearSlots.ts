import type { EquipEntry, Item, StarCurves } from "../../lib/items";
import { enhancePct } from "../../lib/items";
import { ELEMENT_BIT, ELEMENT_SETS, ELEMENT_WHEEL } from "./elementWheel";

const normName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// The shipped name field is cut at a fixed byte and a few hundred records have a
// same-length chunk overwritten with a garbage token whose tail merges into the
// next word ("Heav-TaSoldier" for "Heaven Soldier", "KestmBoots", "BooWushan").
// Every such name leaves a lowercase letter jammed against an uppercase one and
// no intact name does, so that pattern is the mangled marker.
const MANGLED = /[a-z][A-Z]/;

export const looksMangled = (name: string): boolean => MANGLED.test(name);

// items.json stores every upgrade stage of an item as its own record (same
// class/slot/tier/grade/name, rising stats, chained via +580) and the shipped
// names are cut at a fixed byte, so a raw list is full of repeats. Keep one per
// item: collapse identical names to the base record (lowest id - verified to be
// the first stage), then drop a name that is a prefix of exactly one longer
// name in the same class/slot/grade/tier (the truncated copy of it). Anything
// else - including corrupt rows whose names share no prefix - is left alone
// rather than guessed at. ponytail: a stricter merge hides real items (two
// suits share base stats and near names), so this stops at the unambiguous case.
export function uniqueItems(items: Item[]): Item[] {
  const best = new Map<string, Item>();
  for (const i of items) {
    if (MANGLED.test(i.name)) continue; // drop the mangled copy of a name
    const k = `${i.class}|${i.slot}|${i.grade}|${i.tier}|${i.name}`;
    const prev = best.get(k);
    if (!prev || i.id < prev.id) best.set(k, i);
  }
  const groups = new Map<string, Item[]>();
  for (const i of best.values()) {
    const k = `${i.class}|${i.slot}|${i.grade}|${i.tier}`;
    const a = groups.get(k);
    if (a) a.push(i);
    else groups.set(k, [i]);
  }
  const out: Item[] = [];
  for (const arr of groups.values()) {
    const names = arr.map((i) => normName(i.name));
    arr.forEach((i, idx) => {
      const ni = names[idx];
      if (ni.length < 8) return out.push(i);
      const prefixed = names.filter((n) => n.startsWith(ni));
      const longer = prefixed.filter((n) => n.length > ni.length);
      if (prefixed.length !== 2 || longer.length !== 1) out.push(i);
    });
  }
  return out;
}

// Display names for the 5 classes; key order drives the Class select order.
export const CLASS_NAMES: Record<string, string> = {
  swordsman: "Swordsman",
  sunwarrior: "Sun Warrior",
  beadfairy: "Bead Fairy",
  moonmaiden: "Moonmaiden",
  summoner: "Summoner",
};

// App gear slot label -> `slot` keys found in items.json that fit it.
// Slots missing from this map (FortuneGear, Pet, Fashion*) take no items.
// ponytail: spiritbreath -> SpiritWeapon and destinyartifact -> Precious are the
// only fits - items.json has no "spirit weapon" wording. One map, tweak it here.
export const SLOT_ITEMS: Record<string, string[]> = {
  Precious: ["destinyartifact"],
  Weapon: ["weapon"],
  SpiritWeapon: ["spiritbreath"],
  SpiritArmor: ["spiritarmor"],
  Trinket: ["pendant"],
  Headband: ["helmet"],
  Clothes: ["clothes", "vestment"],
  WaistbandDecorator: ["waistband"],
  Armguards: ["bracers"],
  Boots: ["boots"],
};

// App slot -> REFINE.ZU1 slot id (ITEMS +340). Only these slots roll potential
// attributes; slots not listed here (and Precious/FortuneGear/Fashion*) do not.
export const SLOT_REFINE: Record<string, number> = {
  Weapon: 5,
  Headband: 2,
  Clothes: 3,
  Armguards: 4,
  Boots: 6,
  SpiritArmor: 19,
  SpiritWeapon: 21,
  WaistbandDecorator: 20,
  Trinket: 20,
};

// Set name shown in the "Attributes (...)" heading, keyed by REFINE slot id.
// From the 2008 guide's set list, matched to REFINE_ATTRS' per-slot members.
export const REFINE_SET: Record<number, string> = {
  2: "Head Gear set",
  3: "Vest Armour set",
  4: "Bracers/Bracelet set",
  5: "Weapon set",
  6: "Boots set",
  19: "Spirit Armour set",
  20: "Waistband set",
  21: "Spirit Breath set",
};

// What each potential attribute does comes from the game itself: ITEMATT.ZU1
// holds the tooltip text (attrs.json, loaded by useAttrs). The REFINE table
// uses the old guide wording ("Rip", "Stun", "Slice", "Protection") while
// ITEMATT carries the in-game wording ("Accuracy", "Incapacitate",
// "Attack Speed Increased", "Defensive Spirit Breath").

// The numbers the game prints for one element, for a given active element set
// (a bitmask), the item's enhance factor and the element's own value (from the
// item record, ITEMS +376).
//
//   value = base * multiplier(active set) * enhance factor
//   swing = base / 2                            (the +-50 % the tooltip shows)
//
// The multiplier is the game's own table (ITEMFIVEATTRIBUTE.ZU1); the base is
// the item's authored element value.
export function elementNumbers(
  name: string,
  base: number | undefined,
  activeMask: number,
  enhance: number = 1,
): { mult: number | undefined; value: number | undefined; swings: string[] } {
  const mult = ELEMENT_SETS[String(activeMask)]?.[name];
  const value =
    base !== undefined && mult !== undefined
      ? Math.floor(base * mult * enhance)
      : undefined;
  const swings: string[] = [];
  const w = ELEMENT_WHEEL[name];
  if (base !== undefined && w) {
    const half = Math.floor(base / 2);
    if (activeMask & ELEMENT_BIT[w.pos]) swings.push(`<${w.pos}+${half}>`);
    if (activeMask & ELEMENT_BIT[w.neg]) swings.push(`<${w.neg}-${half}>`);
  }
  return { mult, value, swings };
}

// Sum of what every equipped item contributes to the player's sheet.
// star = the STAR.bin curves; without them enhance is ignored (multiplier 1).
export function gearTotals(gear: Record<string, EquipEntry>, star: StarCurves = {}) {
  const t = { atkMin: 0, atkMax: 0, phys: 0, mag: 0 };
  for (const e of Object.values(gear)) {
    const m = 1 + enhancePct(star, e.item.starGroup, e.enhance) / 100;
    const rk = e.item.ranks[Math.min(e.rank, e.item.ranks.length - 1)];
    const [a, b, p, g] = rk ?? [e.item.atkMin, e.item.atkMax, e.item.phys, e.item.mag];
    t.atkMin += (a ?? 0) * m;
    t.atkMax += (b ?? 0) * m;
    t.phys += (p ?? 0) * m;
    t.mag += (g ?? 0) * m;
  }
  return t;
}

export function pretty(slot: string): string {
  return slot
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .split(/[ _-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
