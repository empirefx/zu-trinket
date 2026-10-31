interface GearSlotProps {
  label: string;
  className?: string;
  onClick?: () => void;
  onContextMenu?: () => void;
  size?: "normal" | "small";
  active?: boolean;
  value?: string;
  // a small corner badge (e.g. the spell rank 0..9)
  badge?: string;
  // a hover tooltip in the shared .hover-tip style; replaces the native title
  tip?: React.ReactNode;
  // the tooltip text; default = the slot label (or "label: value")
  title?: string;
  // the css classes that draw the equipped item's icon (the class sprite sheet)
  icon?: string;
}

export function GearSlot({ label, className = "", onClick, onContextMenu, size = "normal", active, value, badge, tip, title, icon }: GearSlotProps) {
  return (
    <div
      className={`slot i-${label} ${size === "small" ? "small" : ""} ${active ? "active" : ""} ${value || icon ? "filled" : ""} ${className}`}
      onClick={onClick}
      onContextMenu={onContextMenu ? (e) => { e.preventDefault(); onContextMenu(); } : undefined}
      title={tip ? undefined : title ?? (value ? `${label}: ${value}` : label)}
    >
      {icon ? <span className={"gear-icon zs " + icon} /> : value ?? label}
      {badge ? <span className="rank-badge">{badge}</span> : null}
      {tip ? <div className="hover-tip" role="tooltip">{tip}</div> : null}
    </div>
  );
}
