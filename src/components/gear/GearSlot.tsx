interface GearSlotProps {
  label: string;
  className?: string;
  onClick?: () => void;
  size?: "normal" | "small";
  active?: boolean;
  value?: string;
  // the css classes that draw the equipped item's icon (the class sprite sheet)
  icon?: string;
}

export function GearSlot({ label, className = "", onClick, size = "normal", active, value, icon }: GearSlotProps) {
  return (
    <div
      className={`slot i-${label} ${size === "small" ? "small" : ""} ${active ? "active" : ""} ${value ? "filled" : ""} ${className}`}
      onClick={onClick}
      title={value ? `${label}: ${value}` : label}
    >
      {icon ? <span className={"gear-icon zs " + icon} /> : value ?? label}
    </div>
  );
}
