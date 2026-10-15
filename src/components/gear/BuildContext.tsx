import { createContext, useContext, useState, type ReactNode } from "react";

type ClassId = "swordsman" | "sunwarrior" | "beadfairy" | "moonmaiden" | "summoner";

interface BuildState {
  classId: ClassId;
  level: number;
  title: string;
  hasPet: boolean;
  setClassId: (id: ClassId) => void;
  setLevel: (level: number) => void;
  setTitle: (title: string) => void;
  togglePet: () => void;
}

const BuildContext = createContext<BuildState | null>(null);

export function BuildProvider({ children }: { children: ReactNode }) {
  const [classId, setClassId] = useState<ClassId>("swordsman");
  const [level, setLevel] = useState(0);
  const [title, setTitle] = useState("None");
  const [hasPet, setHasPet] = useState(false);

  return (
    <BuildContext.Provider
      value={{
        classId,
        level,
        title,
        hasPet,
        setClassId,
        setLevel,
        setTitle,
        togglePet: () => setHasPet((v) => !v),
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