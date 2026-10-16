import { createContext, useContext, useState, type ReactNode } from "react";
import type { EquipEntry } from "../../lib/items";

type ClassId = "swordsman" | "sunwarrior" | "beadfairy" | "moonmaiden" | "summoner";

interface BuildState {
  classId: ClassId;
  level: number;
  title: string;
  hasPet: boolean;
  gear: Record<string, EquipEntry>;
  setClassId: (id: ClassId) => void;
  setLevel: (level: number) => void;
  setTitle: (title: string) => void;
  togglePet: () => void;
  setGear: (slot: string, entry: EquipEntry | null) => void;
}

const BuildContext = createContext<BuildState | null>(null);

export function BuildProvider({ children }: { children: ReactNode }) {
  const [classId, setClassId] = useState<ClassId>("swordsman");
  const [level, setLevel] = useState(0);
  const [title, setTitle] = useState("None");
  const [hasPet, setHasPet] = useState(false);
  const [gear, setGearState] = useState<Record<string, EquipEntry>>({});

  return (
    <BuildContext.Provider
      value={{
        classId,
        level,
        title,
        hasPet,
        gear,
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