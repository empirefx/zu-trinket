// Named builds saved in localStorage. Pure storage: no React. Storage is only
// touched inside functions so SSR (no localStorage) never breaks on import.

import type { EquipEntry } from "./items";
import type { ClassId, PetBuild } from "../components/gear/BuildContext";

export const MAX_BUILDS = 10;
export const MAX_NAME = 40;

const KEY = "zu-builds";
const SELECTED_KEY = "zu-builds-selected";

export type BuildSnapshot = {
  classId: ClassId;
  level: number;
  title: string;
  gear: Record<string, EquipEntry>;
  talentRanks: Record<number, number>;
  pet: PetBuild | null;
};

export type SavedBuild = { id: string; name: string; savedAt: number; state: BuildSnapshot };

function validState(s: unknown): s is BuildSnapshot {
  if (typeof s !== "object" || s === null) return false;
  const r = s as Record<string, unknown>;
  if (
    typeof r.classId !== "string" ||
    typeof r.level !== "number" ||
    typeof r.title !== "string" ||
    typeof r.gear !== "object" ||
    r.gear === null ||
    typeof r.talentRanks !== "object" ||
    r.talentRanks === null
  )
    return false;
  if (r.pet === null) return true;
  if (typeof r.pet !== "object") return false;
  const p = r.pet as Record<string, unknown>;
  if (typeof p.speciesId !== "number" || typeof p.level !== "number") return false;
  p.gear ??= {};
  p.spells ??= {};
  return true;
}

export function listBuilds(): SavedBuild[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (b): b is SavedBuild =>
        typeof b?.id === "string" && typeof b?.name === "string" && validState(b?.state),
    );
  } catch {
    return [];
  }
}

function writeBuilds(list: SavedBuild[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function saveBuild(name: string, state: BuildSnapshot, id?: string): SavedBuild | null {
  const list = listBuilds();
  const build: SavedBuild = {
    id: id ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now())),
    name: [...name.trim()].slice(0, MAX_NAME).join("") || "Build",
    savedAt: Date.now(),
    state,
  };
  const at = list.findIndex((b) => b.id === build.id);
  // overwrite (rename) keeps the count; only a new build can hit the cap
  if (at >= 0) list[at] = build;
  else if (list.length >= MAX_BUILDS) return null;
  else list.push(build);
  return writeBuilds(list) ? build : null;
}

export function deleteBuild(id: string): boolean {
  return writeBuilds(listBuilds().filter((b) => b.id !== id));
}

export function getSelectedId(): string | null {
  try {
    const v = localStorage.getItem(SELECTED_KEY);
    return typeof v === "string" ? v : null;
  } catch {
    return null;
  }
}

export function setSelectedId(id: string | null): void {
  try {
    if (id === null) localStorage.removeItem(SELECTED_KEY);
    else localStorage.setItem(SELECTED_KEY, id);
  } catch {
    // storage full or blocked: selection is a convenience, drop it silently
  }
}

export type AutosaveAction = "skip" | "overwrite" | "create";

// a fresh build: the default class, nothing equipped
export function emptyBuild(): BuildSnapshot {
  return { classId: "swordsman", level: 0, title: "None", gear: {}, talentRanks: {}, pet: null };
}

export function autosaveDecision(prev: string | null, snap: string, selectedId: string | null): AutosaveAction {
  if (prev === null) return "skip";
  if (selectedId !== null) return "overwrite";
  if (snap !== prev) return "create";
  return "skip";
}

export function selftest(): void {
  const store = new Map<string, string>();
  const fake = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
  const desc = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { value: fake, configurable: true });
  try {
    const snapshot: BuildSnapshot = {
      classId: "swordsman",
      level: 42,
      title: "None",
      gear: { Weapon: { item: { name: "X" } as EquipEntry["item"], enhance: 3, rank: 2 } },
      talentRanks: { 7: 2 },
      pet: {
        speciesId: 5,
        level: 20,
        gear: { 0: { id: 1, name: "Eye", slot: 0 } as PetBuild["gear"][number] },
        spells: { 0: { kind: 0, rank: 3 } },
      },
    };
    const assert = (ok: boolean, msg: string) => {
      if (!ok) throw new Error(`builds selftest: ${msg}`);
    };

    assert(listBuilds().length === 0, "empty read should be []");
    store.set(KEY, "{not json");
    assert(listBuilds().length === 0, "corrupt JSON should be []");
    store.set(
      KEY,
      JSON.stringify([{ id: "bad", name: "Bad", savedAt: 1, state: { ...snapshot, pet: {} } }]),
    );
    assert(listBuilds().length === 0, "malformed pet (missing speciesId) should be filtered out");
    store.clear();

    const first = saveBuild("A", snapshot);
    assert(first !== null, "save should succeed");
    const got = listBuilds();
    assert(
      got.length === 1 && JSON.stringify(got[0].state) === JSON.stringify(snapshot),
      "round-trip should keep full snapshot",
    );

    store.clear();
    for (let i = 0; i < MAX_BUILDS; i++) saveBuild(`b${i}`, snapshot);
    assert(listBuilds().length === MAX_BUILDS, "should hold MAX_BUILDS");
    assert(saveBuild("over", snapshot) === null, "cap should return null");

    const renamed = saveBuild("renamed", snapshot, listBuilds()[0].id);
    assert(renamed !== null && listBuilds().length === MAX_BUILDS, "overwrite-by-id keeps count");

    store.clear();
    const long = saveBuild("x".repeat(MAX_NAME + 10), snapshot);
    assert(long !== null && long.name.length === MAX_NAME, "name should truncate to MAX_NAME");

    const a = saveBuild("A", snapshot)!;
    saveBuild("B", snapshot);
    assert(deleteBuild(a.id) === true, "delete returns true");
    assert(listBuilds().length === 2 && !listBuilds().some((b) => b.id === a.id), "delete removes one");

    // selected id round-trip
    assert(getSelectedId() === null, "no stored selection");
    setSelectedId("x1");
    assert(getSelectedId() === "x1", "selection round-trips");
    setSelectedId(null);
    assert(getSelectedId() === null, "null clears selection");

    // the empty starter build round-trips through storage
    const empty = emptyBuild();
    const savedEmpty = saveBuild("empty", empty)!;
    assert(
      JSON.stringify(listBuilds().find((b) => b.id === savedEmpty.id)!.state) ===
        JSON.stringify(empty),
      "empty build round-trips",
    );

    // autosave decision
    assert(autosaveDecision(null, "s", null) === "skip", "first observation skips");
    assert(autosaveDecision("{}", "s", "id1") === "overwrite", "selected overwrites");
    assert(autosaveDecision("s", "s", null) === "skip", "unchanged snapshot skips");
    assert(autosaveDecision("{}", "t", null) === "create", "changed snapshot creates");
  } finally {
    if (desc) Object.defineProperty(globalThis, "localStorage", desc);
    else delete (globalThis as { localStorage?: unknown }).localStorage;
  }
}
