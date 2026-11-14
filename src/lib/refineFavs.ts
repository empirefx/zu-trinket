// Saved refine sessions ("favorites"): one entry per save — the gear state
// AND the whole session's attempt log ride along, so the same gear can be
// saved twice with different sessions. Pure storage, no React — the same
// pattern as lib/builds.ts. MAX_FAVS cap drops the oldest entry.
import type { Item } from "./items";

export const MAX_FAVS = 10;

const KEY = "zu-refine-favs";

export type FavAttempt = {
  kind: "rank" | "enchant";
  ok: boolean;
  from: number;
  to: number;
  gold: number;
  mats: { name: string; count: number; icon?: string }[];
};

export type RefineFav = {
  id: string;
  slot: string;
  itemId: number;
  name: string;
  icon: string;
  tier: number;
  rank: number;
  enh: number;
  attempts: FavAttempt[];
  savedAt: number;
};

function read(): RefineFav[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (f): f is RefineFav =>
        typeof f?.id === "string" &&
        typeof f?.slot === "string" &&
        typeof f?.itemId === "number" &&
        typeof f?.name === "string" &&
        typeof f?.rank === "number" &&
        typeof f?.enh === "number",
    ).map((f) => ({ ...f, attempts: Array.isArray(f.attempts) ? f.attempts : [] }));
  } catch {
    return [];
  }
}

function write(list: RefineFav[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function listFavs(): RefineFav[] {
  return read();
}

let seq = 0;

// every save is its own entry (the same gear can carry different sessions);
// the goals are not stored - they are always current + 1
export function saveFav(
  slot: string,
  item: Item,
  state: Pick<RefineFav, "rank" | "enh" | "attempts">,
): RefineFav[] {
  const list = read();
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${++seq}`;
  const fav: RefineFav = {
    id,
    slot,
    itemId: item.id,
    name: item.name,
    icon: item.icon,
    tier: item.tier,
    ...state,
    savedAt: Date.now(),
  };
  if (list.length >= MAX_FAVS) list.shift();
  list.push(fav);
  write(list);
  return list;
}

export function removeFav(id: string): RefineFav[] {
  const list = read().filter((f) => f.id !== id);
  write(list);
  return list;
}

export function selftest(): void {
  const store = new Map<string, string>();
  const desc = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
    },
    configurable: true,
  });
  try {
    const item = { id: 5265, name: "Sword", icon: "ICON_JX_WEAPON005", tier: 4 } as Item;
    const assert = (ok: boolean, msg: string) => {
      if (!ok) throw new Error(`refineFavs selftest: ${msg}`);
    };
    assert(listFavs().length === 0, "empty read");
    const sessionA = [{ kind: "rank", ok: true, from: 0, to: 1, gold: 80, mats: [] }] as FavAttempt[];
    const l1 = saveFav("Weapon", item, { rank: 8, enh: 3, attempts: sessionA });
    assert(l1.length === 1 && l1[0].name === "Sword", "save round-trips");
    assert(l1[0].attempts.length === 1, "the session log rides along");
    const sessionB = [sessionA[0], { kind: "enchant", ok: false, from: 5, to: 4, gold: 0, mats: [] } as FavAttempt];
    const l2 = saveFav("Weapon", item, { rank: 9, enh: 4, attempts: sessionB });
    assert(l2.length === 2, "the same gear saves again as its own entry");
    assert(l2[1].attempts.length === 2 && l2[1].rank === 9, "the newer entry holds its own session");
    const other = { ...item, id: 5266 } as Item;
    saveFav("Weapon", other, { rank: 0, enh: 0, attempts: [] });
    assert(listFavs().length === 3, "a different item is its own favorite");
    for (let i = 0; i < MAX_FAVS + 2; i++) {
      saveFav("Weapon", { ...item, id: 100 + i } as Item, { rank: 0, enh: 0, attempts: [] });
    }
    assert(listFavs().length <= MAX_FAVS, "cap holds");
    const first = listFavs()[0];
    assert(removeFav(first.id).every((f) => f.id !== first.id), "remove works");
  } finally {
    if (desc) Object.defineProperty(globalThis, "localStorage", desc);
    else delete (globalThis as { localStorage?: unknown }).localStorage;
  }
}
