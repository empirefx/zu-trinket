import { useRef } from "react";

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
  const slotRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  // The item card sits beside its slot and flips side/edge so the browser
  // window never clips it. Only .item-tip cards are placed this way — pet and
  // spell tips keep the default centred-above CSS (the query guards that).
  // Measuring on mouseenter works while the tip is visibility:hidden (it is
  // still laid out); the CSS :hover rules handle the reveal itself.
  const placeTip = () => {
    const slot = slotRef.current;
    const tip = tipRef.current;
    if (!slot || !tip || !tip.querySelector(".item-tip")) return;
    const s = slot.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const gap = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // prefer the right side; flip left when it would clip, then clamp so the
    // card is always fully on screen (width and height both)
    let left = s.right + gap;
    if (left + t.width > vw - gap) left = s.left - t.width - gap;
    if (left < gap) left = Math.min(Math.max(s.left, gap), Math.max(gap, vw - t.width - gap));
    let top = s.top;
    if (top + t.height > vh - gap) top = vh - t.height - gap;
    tip.style.position = "fixed";
    // clear the stylesheet's bottom offset — left in place it fights the inline
    // top on the next hover (over-constrained fixed box) and the re-measured
    // height jumps the card to a different spot
    tip.style.bottom = "auto";
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.max(gap, Math.round(top))}px`;
    tip.style.transform = "none";
  };

  return (
    <div
      ref={slotRef}
      className={`slot i-${label} ${size === "small" ? "small" : ""} ${active ? "active" : ""} ${value || icon ? "filled" : ""} ${className}`}
      onClick={onClick}
      onContextMenu={onContextMenu ? (e) => { e.preventDefault(); onContextMenu(); } : undefined}
      onMouseEnter={placeTip}
      title={tip ? undefined : title ?? (value ? `${label}: ${value}` : label)}
    >
      {icon ? <span className={"gear-icon zs " + icon} /> : value ?? label}
      {badge ? <span className="rank-badge">{badge}</span> : null}
      {tip ? <div ref={tipRef} className="hover-tip" role="tooltip">{tip}</div> : null}
    </div>
  );
}
