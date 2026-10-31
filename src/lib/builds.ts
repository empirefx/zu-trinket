// Named builds saved in localStorage. Pure storage: no React. Storage is only
// touched inside functions so SSR (no localStorage) never breaks on import.

import type { EquipEntry } from "./items";
import type { ClassId, PetBuild } from "../components/gear/BuildContext";

export const MAX_BUILDS = 10;
export const MAX_NAME = 40;

const KEY = "zu-builds";

export type BuildSnapshot = {
  classId: ClassId;
  level: number;
  title: string;
  gear: Record<string, EquipEntry>;
  talentRanks: Record<number, number>;
  pet: PetBuild | null;
};

export type SavedBuild = { id: string; name: string; savedAt: number; state: BuildSnapshot };

export function listBuilds(): SavedBuild[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (b): b is SavedBuild =>
        typeof b?.id === "string" && typeof b?.name === "string" && typeof b?.state === "object" && b.state !== null,
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

export function deleteBuild(id: string): void {
  writeBuilds(listBuilds().filter((b) => b.id !== id));
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
    const state: BuildSnapshot = {
      classId: "swordsman",
      level: 10,
      title: "None",
      gear: {},
      talentRanks: {},
      pet: null,
    };
    const assert = (ok: boolean, msg: string) => {
      if (!ok) throw new Error(`builds selftest: ${msg}`);
    };

    assert(listBuilds().length === 0, "empty read should be []");
    store.set(KEY, "{not json");
    assert(listBuilds().length === 0, "corrupt JSON should be []");
    store.clear();

    const first = saveBuild("A", state);
    assert(first !== null, "save should succeed");
    const got = listBuilds();
    assert(got.length === 1 && got[0].state.level === 10, "round-trip should keep state");

    store.clear();
    for (let i = 0; i < MAX_BUILDS; i++) saveBuild(`b${i}`, state);
    assert(listBuilds().length === MAX_BUILDS, "should hold MAX_BUILDS");
    assert(saveBuild("over", state) === null, "cap should return null");

    const renamed = saveBuild("renamed", state, listBuilds()[0].id);
    assert(renamed !== null && listBuilds().length === MAX_BUILDS, "overwrite-by-id keeps count");

    store.clear();
    const long = saveBuild("x".repeat(MAX_NAME + 10), state);
    assert(long !== null && long.name.length === MAX_NAME, "name should truncate to MAX_NAME");

    const a = saveBuild("A", state)!;
    saveBuild("B", state);
    deleteBuild(a.id);
    assert(listBuilds().length === 2 && !listBuilds().some((b) => b.id === a.id), "delete removes one");
  } finally {
    if (desc) Object.defineProperty(globalThis, "localStorage", desc);
    else delete (globalThis as { localStorage?: unknown }).localStorage;
  }
}
