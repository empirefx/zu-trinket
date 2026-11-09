import { createContext, useContext, useState, type ReactNode } from "react";
import type { EquipEntry } from "../../lib/items";
import type { PetGearItem } from "../../lib/pets";
import type { BuildSnapshot } from "../../lib/builds";

export type ClassId = "swordsman" | "sunwarrior" | "beadfairy" | "moonmaiden" | "summoner";

// One pet spell slot: the spell kind + the displayed rank (0..9)
export interface PetSpellAsg {
  kind: number;
  rank: number;
}

// The pet build: species + pet level + the 4 pet-gear slots (0 eyes, 1 inner
// bolus, 2 feet accelerator, 3 saddle) + the 8 spell slots. (The panel
// factor set is derived from the egg kind in pets.ts: panelSetOf, and the
// user no longer enters Pet Bolus rolls.)
export interface PetBuild {
  speciesId: number;
  level: number;
  gear: Record<number, PetGearItem>;
  spells: Record<number, PetSpellAsg>;
}

interface BuildState {
  classId: ClassId;
  level: number;
  title: string;
  gear: Record<string, EquipEntry>;
  // the learned talent ranks: a talent node's id -> its learned rank
  talentRanks: Record<number, number>;
  // the pet build; hasPet stays as the derived flag the boxes dim with
  pet: PetBuild | null;
  hasPet: boolean;
  setClassId: (id: ClassId) => void;
  setLevel: (level: number) => void;
  setTitle: (title: string) => void;
  setPet: (speciesId: number, level: number) => void;
  clearPet: () => void;
  setPetGear: (slot: number, item: PetGearItem | null) => void;
  setPetSpell: (slot: number, asg: PetSpellAsg | null) => void;
  setPetLevel: (level: number) => void;
  setGear: (slot: string, entry: EquipEntry | null) => void;
  // change a talent's learned rank by one point (d = -1 lowers it)
  learnTalent: (id: number, d?: 1 | -1) => void;
  // the whole build as one value (save) and its reverse (load)
  snapshot: () => BuildSnapshot;
  applyBuild: (s: BuildSnapshot) => void;
  // the currently selected saved build (null = no build is loaded); the gear
  // header owns the storage, this only shares the flag so the page can
  // disable its panels while nothing is loaded
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

const BuildContext = createContext<BuildState | null>(null);

// set/delete one key of a record without mutating (the setGear pattern)
function upd<T>(rec: Record<number, T>, k: number, v: T | null) {
  const next = { ...rec };
  if (v) next[k] = v;
  else delete next[k];
  return next;
}

export function BuildProvider({ children }: { children: ReactNode }) {
  const [classId, setClassId] = useState<ClassId>("swordsman");
  const [level, setLevel] = useState(0);
  const [title, setTitle] = useState("None");
  const [pet, setPetState] = useState<PetBuild | null>(null);
  const [gear, setGearState] = useState<Record<string, EquipEntry>>({});
  const [talentRanks, setTalentRanks] = useState<Record<number, number>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <BuildContext.Provider
      value={{
        classId,
        level,
        title,
        gear,
        talentRanks,
        pet,
        hasPet: pet !== null,
        setClassId,
        setLevel,
        setTitle,
        setPet: (speciesId, level) => setPetState({
          speciesId, level, gear: {},
          spells: Object.fromEntries(Array.from({ length: 8 }, (_, i) => [i, { kind: i, rank: 0 }])),
        }),
        clearPet: () => setPetState(null),
        setPetGear: (slot, item) =>
          setPetState((p) => p && { ...p, gear: upd(p.gear, slot, item) }),
        setPetSpell: (slot, asg) =>
          setPetState((p) => p && { ...p, spells: upd(p.spells, slot, asg) }),
        setPetLevel: (level) =>
          setPetState((p) => p && { ...p, level: Math.max(0, Math.min(300, level)) }),
        setGear: (slot, entry) =>
          setGearState((g) => {
            const next = { ...g };
            if (entry) next[slot] = entry;
            else delete next[slot];
            return next;
          }),
        learnTalent: (id, d = 1) =>
          setTalentRanks((r) => ({ ...r, [id]: Math.max(0, (r[id] ?? 0) + d) })),
        snapshot: () => ({ classId, level, title, gear, talentRanks, pet }),
        applyBuild: (s) => {
          setClassId(s.classId);
          setLevel(s.level);
          setTitle(s.title);
          setGearState(s.gear ?? {});
          setTalentRanks(s.talentRanks ?? {});
          setPetState(s.pet ?? null);
        },
        selectedId,
        setSelectedId,
      }}
    >
      {children}
    </BuildContext.Provider>
  );
}

export function useBuild() {
  const ctx = useContext(BuildContext);
  if (!ctx) throw new Error("useBuild must be used within BuildProvider");
  return ctx;
}
