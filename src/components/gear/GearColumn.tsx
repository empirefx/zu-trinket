import { GearSlot } from "./GearSlot";

interface GearColumnProps {
  slots: string[];
  className?: string;
  size?: "normal" | "small";
}

export function GearColumn({ slots, className = "", size = "normal" }: GearColumnProps) {
  return (
    <div className={`col ${className}`}>
      {slots.map((slot, i) => (
        <GearSlot key={i} label={slot} size={size} />
      ))}
    </div>
  );
}