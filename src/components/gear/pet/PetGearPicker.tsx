import { useMemo } from "react";
import { usePets } from "../../../hooks/usePets";
import { petIconClass } from "../../../lib/icons";
import type { PetGearItem } from "../../../lib/pets";

// The pet-gear picker for one pet slot (0 eyes, 1 inner bolus, 2 feet
// accelerator, 3 saddle): the slot's pieces sorted by level requirement,
// lower first.
const SLOT_NAMES = ["Eyes", "Inner Bolus", "Feet Accelerator", "Saddle"];

interface PetGearPickerProps {
  slot: number;
  onClose: () => void;
  onPick: (item: PetGearItem) => void;
}

export function PetGearPicker({ slot, onClose, onPick }: PetGearPickerProps) {
  const pets = usePets();

  const rows = useMemo(
    () =>
      pets
        ? pets.gear
            .filter((g) => g.slot === slot)
            .filter((g) => {
              const n = g.name.toLowerCase();
              // drop the lower/intermediate/higher grade variants the user
              // does not want to see in any slot
              if (n.includes("low-tier") || n.includes("low-level") ||
                  n.includes("low-grade") || n.includes("intermediate") ||
                  n.includes("high-end") || n.includes("high-level")) return false;
              // eyes: drop the "(N years)" levelled variants
              if (slot === 0 && /\(\d+\s*years?\)/.test(n)) return false;
              // inner bolus: only the two Bolus-to-Origin pieces
              if (slot === 1 && !n.includes("bolus to origin")) return false;
              // feet: drop Senior Feng Jing pieces
              if (slot === 2 && n.includes("senior feng jing")) return false;
              // saddle: only saddle pieces, drop test-data entries
              if (slot === 3 && n.includes("test data")) return false;
              if (slot === 3 && !n.includes("saddle")) return false;
              return true;
            })
            .sort((a, b) => a.req - b.req || a.name.localeCompare(b.name))
        : [],
    [pets, slot],
  );

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          Choose {SLOT_NAMES[slot] ?? "Pet Gear"}
          <span className="modal-sub"> — {rows.length} pieces</span>
        </div>
        <div className="modal-list">
          {!pets && <div className="picker-note">Loading pets…</div>}
          {rows.map((g) => {
            const icon = petIconClass(g.icon);
            const stats = [
              g.atk != null ? `atk +${g.atk}` : null,
              g.pd != null ? `pd +${g.pd}` : null,
              g.md != null ? `md +${g.md}` : null,
              g.speed != null ? `speed +${g.speed}%` : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <div key={g.id} className="item-row" onClick={() => onPick(g)} title={g.desc}>
                {icon ? <span className={"gear-icon zs " + icon} /> : null}
                <span className="item-name">
                  {g.name}
                  {stats ? <span className="lv"> {stats}</span> : null}
                </span>
                <span className="lv">{g.req ? `Lv ${g.req}` : ""}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
