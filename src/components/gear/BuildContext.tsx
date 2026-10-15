import { createContext, useContext, useState, type ReactNode } from "react";

type ClassId = "swordsman" | "sunwarrior" | "beadfairy" | "moonmaiden" | "summoner";

interface BuildState {
  classId: ClassId;
  level: number;
  title: string;
  setClassId: (id: ClassId) => void;
  setLevel: (level: number) => void;
  setTitle: (title: string) => void;
}

const BuildContext = createContext<BuildState | null>(null);

export function BuildProvider({ children }: { children: ReactNode }) {
  const [classId, setClassId] = useState<ClassId>("swordsman");
  const [level, setLevel] = useState(139);
  const [title, setTitle] = useState("Swift Killer");

  return (
    <BuildContext.Provider value={{ classId, level, title, setClassId, setLevel, setTitle }}>
      {children}
    </BuildContext.Provider>
  );
}

export function useBuild() {
  const ctx = useContext(BuildContext);
  if (!ctx) throw new Error("useBuild must be used within BuildProvider");
  return ctx;
}