import type { ReactNode } from "react";
import { GearSlot } from "./GearSlot";

interface GearColumnProps {
  slots: string[];
  values?: Record<string, string>;
  // slot -> the css classes of the equipped item's icon
  icons?: Record<string, string>;
  onSlotClick?: (slot: string) => void;
  className?: string;
  size?: "normal" | "small";
  children?: ReactNode;
}

export function GearColumn({ slots, values, icons, onSlotClick, className = "", size = "normal", children }: GearColumnProps) {
  return (
    <div className={`col ${className}`}>
      {slots.map((slot) => (
        <GearSlot
          key={slot}
          label={slot}
          size={size}
          value={values?.[slot]}
          icon={icons?.[slot]}
          onClick={onSlotClick ? () => onSlotClick(slot) : undefined}
        />
      ))}
      {children}
    </div>
  );
}