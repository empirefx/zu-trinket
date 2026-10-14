interface GearSlotProps {
  label: string;
  className?: string;
  onClick?: () => void;
  size?: "normal" | "small";
}

export function GearSlot({ label, className = "", onClick, size = "normal" }: GearSlotProps) {
  return (
    <div
      className={`slot ${size === "small" ? "small" : ""} ${className}`}
      onClick={onClick}
      title={label}
    >
      {label}
    </div>
  );
}