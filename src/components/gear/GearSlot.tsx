interface GearSlotProps {
  label: string;
  className?: string;
  onClick?: () => void;
  size?: "normal" | "small";
  active?: boolean;
}

export function GearSlot({ label, className = "", onClick, size = "normal", active }: GearSlotProps) {
  return (
    <div
      className={`slot ${size === "small" ? "small" : ""} ${active ? "active" : ""} ${className}`}
      onClick={onClick}
      title={label}
    >
      {label}
    </div>
  );
}