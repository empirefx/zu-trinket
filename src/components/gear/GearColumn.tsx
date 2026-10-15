import type { ReactNode } from "react";
import { GearSlot } from "./GearSlot";

interface GearColumnProps {
  slots: string[];
  className?: string;
  size?: "normal" | "small";
  children?: ReactNode;
}

export function GearColumn({ slots, className = "", size = "normal", children }: GearColumnProps) {
  return (
    <div className={`col ${className}`}>
      {slots.map((slot, i) => (
        <GearSlot key={i} label={slot} size={size} />
      ))}
      {children}
    </div>
  );
}