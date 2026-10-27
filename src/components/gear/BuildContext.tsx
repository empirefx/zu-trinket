import { createContext, useContext, useState, type ReactNode } from "react";
import type { EquipEntry } from "../../lib/items";

type ClassId = "swordsman" | "sunwarrior" | "beadfairy" | "moonmaiden" | "summoner";

interface BuildState {
  classId: ClassId;
  level: number;
  title: string;
  hasPet: boolean;
  gear: Record<string, EquipEntry>;
  // the learned talent ranks: a talent node's id -> its learned rank
  talentRanks: Record<number, number>;
  setClassId: (id: ClassId) => void;
  setLevel: (level: number) => void;
  setTitle: (title: string) => void;
  togglePet: () => void;
  setGear: (slot: string, entry: EquipEntry | null) => void;
  // learn the next rank of a talent (one point)
  learnTalent: (id: number) => void;
}

const BuildContext = createContext<BuildState | null>(null);

export function BuildProvider({ children }: { children: ReactNode }) {
  const [classId, setClassId] = useState<ClassId>("swordsman");
  const [level, setLevel] = useState(0);
  const [title, setTitle] = useState("None");
  const [hasPet, setHasPet] = useState(false);
  const [gear, setGearState] = useState<Record<string, EquipEntry>>({});
  const [talentRanks, setTalentRanks] = useState<Record<number, number>>({});

  return (
    <BuildContext.Provider
      value={{
        classId,
        level,
        title,
        hasPet,
        gear,
        talentRanks,
        setClassId,
        setLevel,
        setTitle,
        togglePet: () => setHasPet((v) => !v),
        setGear: (slot, entry) =>
          setGearState((g) => {
            const next = { ...g };
            if (entry) next[slot] = entry;
            else delete next[slot];
            return next;
          }),
        learnTalent: (id) =>
          setTalentRanks((r) => ({ ...r, [id]: (r[id] ?? 0) + 1 })),
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