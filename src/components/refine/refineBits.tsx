// Shared small pieces of the refine page: types, helpers and the two slot
// widgets every panel reuses.
import type { ReactNode } from "react";
import { iconClass, refineIconClass } from "../../lib/icons";
import type { FavAttempt } from "../../lib/refineFavs";
import type { RefineMat } from "../gear/generated/refineTable";

export type Mode = "rank" | "enchant";

export const AUTO_CAP = 500; // one auto run never rolls more attempts than this

export const num = (n: number) => n.toLocaleString("en-US");

// loading a favorite: select the slot + jump the sim to its saved state
// (n counts requests so re-loading the same favorite re-applies)
export type LoadReq = {
  slot: string;
  itemId: number;
  rank: number;
  enh: number;
  attempts: FavAttempt[];
  n: number;
} | null;

// the attack spars fit weapons and Spirit Breath (the SpiritWeapon slot);
// everything else takes the defensive ones
export const sparKindOf = (slot: string): "attack" | "defense" =>
  slot === "Weapon" || slot === "SpiritWeapon" ? "attack" : "defense";

// green at 100 %, red at 55 % and below, interpolating in between
export const probColor = (pct: number) => {
  if (pct >= 100) return "#33dd33";
  if (pct <= 55) return "#ff4444";
  return `hsl(${Math.round(((pct - 55) / 45) * 120)}, 80%, 55%)`;
};

// the safe/lock levels (in-game: a failed attempt drops the gear back to the
// last lock below it; below the first lock it drops to 0). Ranks lock at
// 6/12/18/24, enchants at 5/10/15/20 (the user-confirmed rule).
export const RANK_LOCKS = [6, 12, 18, 24];
export const ENH_LOCKS = [1, 5, 10, 15, 20];
export const lockFloor = (v: number, locks: number[]) =>
  locks.filter((l) => l <= v).pop() ?? 0;

// one material in the slots row's centre: icon + the required count as a
// md-size badge; hover opens the name + description tooltip
export function MatSlot({ mat }: { mat: RefineMat }) {
  const cls = mat.icon ? refineIconClass(mat.icon) : undefined;
  return (
    <div className="r-slot r-mat-slot" tabIndex={0}>
      <span className="r-icon-badge-wrap">
        <span className={`r-gicon zs r-slot-icon ${cls ?? ""}`}>{cls ? "" : "◆"}</span>
        <span className="r-mat-badge">{mat.count}</span>
      </span>
      <span className="r-muted">{mat.name}</span>
      <div className="r-tip">
        <b>{mat.name}</b>
        <span className="r-tip-body">{mat.desc ?? "Refining material"}</span>
      </div>
    </div>
  );
}

// one of the two/three workbench slots: the current gear (left), the spar
// (enchant's middle) and the preview (right); hover opens the gear tooltip.
// badge = the small green "locked"/"safe" tag over the icon
export function GearSlotBox({
  icon,
  label,
  tip,
  badge,
}: {
  icon?: string;
  label: string;
  tip?: ReactNode;
  badge?: string;
}) {
  const cls = icon ? iconClass(icon) : undefined;
  return (
    <div className="r-slot" tabIndex={0}>
      <span className="r-icon-badge-wrap">
        <span className={`r-gicon zs r-slot-icon ${cls ?? ""}`}>{cls ? "" : "◆"}</span>
        {badge && <span className="r-lock-badge">{badge}</span>}
      </span>
      <span className="r-muted">{label}</span>
      {tip && <div className="r-tip r-gear-tip">{tip}</div>}
    </div>
  );
}
