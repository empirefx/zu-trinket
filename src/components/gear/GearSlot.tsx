interface GearSlotProps {
  label: string;
  className?: string;
  onClick?: () => void;
  size?: "normal" | "small";
  active?: boolean;
  value?: string;
}

export function GearSlot({ label, className = "", onClick, size = "normal", active, value }: GearSlotProps) {
  return (
    <div
      className={`slot i-${label} ${size === "small" ? "small" : ""} ${active ? "active" : ""} ${value ? "filled" : ""} ${className}`}
      onClick={onClick}
      title={value ? `${label}: ${value}` : label}
    >
      {value ?? label}
    </div>
  );
}