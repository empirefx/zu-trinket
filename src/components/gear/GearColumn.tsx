import type { ReactNode } from "react";
import { GearSlot } from "./GearSlot";

interface GearColumnProps {
  slots: string[];
  values?: Record<string, string>;
  // slot -> the css classes of the equipped item's icon
  icons?: Record<string, string>;
  // slot -> a hover tooltip node (shared .hover-tip style); no entry = the
  // slot's native title fallback
  tips?: Record<string, ReactNode>;
  onSlotClick?: (slot: string) => void;
  onSlotClear?: (slot: string) => void;
  className?: string;
  size?: "normal" | "small";
  children?: ReactNode;
}

export function GearColumn({ slots, values, icons, tips, onSlotClick, onSlotClear, className = "", size = "normal", children }: GearColumnProps) {
  return (
    <div className={`col ${className}`}>
      {slots.map((slot) => (
        <GearSlot
          key={slot}
          label={slot}
          size={size}
          value={values?.[slot]}
          icon={icons?.[slot]}
          tip={tips?.[slot]}
          onClick={onSlotClick ? () => onSlotClick(slot) : undefined}
          onContextMenu={onSlotClear ? () => onSlotClear(slot) : undefined}
        />
      ))}
      {children}
    </div>
  );
}