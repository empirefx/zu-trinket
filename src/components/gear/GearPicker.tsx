import { useMemo } from "react";
import { useBuild } from "./BuildContext";
import { useItems } from "../../hooks/useItems";
import { pretty, CLASS_NAMES, SLOT_ITEMS, uniqueItems } from "./gearSlots";
import type { Item } from "../../lib/items";

// The three gear grades the game has, as the item description spells them out
// ("<Class>'s level <N> <Grade> <Slot>"):
//   common    - no grade word: the plain gear, "immortal" in the Chinese game
//   superior  - "Superior"  = the suits (suit pieces come in sets)
//   legendary - "Legendary" = the epics
// Amber is a fourth word that only shows on stones, not on wearable gear.
//
// The live client table (ITEMS) has NO superior gear for waistband, spirit
// armour and spirit breath - only common and legendary - so the picker says so
// instead of silently showing an empty group.
const GRADES = ["common", "superior", "legendary"] as const;
const GRADE_LABEL: Record<string, string> = {
  common: "Common (Immortal)",
  superior: "Suits (Superior)",
  legendary: "Epics (Legendary)",
};

interface GearPickerProps {
  appSlot: string;
  onClose: () => void;
  onPick: (item: Item) => void;
}

export function GearPicker({ appSlot, onClose, onPick }: GearPickerProps) {
  const { classId } = useBuild();
  const items = useItems();

  const groups = useMemo(() => {
    if (!items) return { missing: [] as string[], rows: [] as { grade: string; rows: Item[] }[] };
    const wanted = new Set(SLOT_ITEMS[appSlot] ?? []);
    const mine = uniqueItems(items).filter((i) => i.class === classId && wanted.has(i.slot));
    const present = new Set(mine.map((i) => i.grade));
    return {
      missing: GRADES.filter((g) => !present.has(g)).map((g) => GRADE_LABEL[g]),
      rows: GRADES.map((g) => ({
        grade: g,
        rows: mine
          .filter((i) => i.grade === g)
          .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name)),
      })).filter((g) => g.rows.length > 0),
    };
  }, [items, classId, appSlot]);

  const rows = items ? groups.rows : [];

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          Choose {pretty(appSlot)}
          <span className="modal-sub"> — {CLASS_NAMES[classId]}</span>
        </div>
        <div className="modal-list">
          {!items && <div className="picker-note">Loading items…</div>}
          {items && groups.missing.length > 0 && (
            <div className="picker-note">
              No {groups.missing.join(" / ")} gear for this slot.
            </div>
          )}
          {rows.map((g) => (
            <div key={g.grade}>
              <div className="group">
                {GRADE_LABEL[g.grade]} · {g.rows.length}
              </div>
              {g.rows.map((i) => (
                <div key={i.id} className="item-row" onClick={() => onPick(i)}>
                  <span>
                    {i.name}
                    {i.reqLevel ? <span className="lv"> req {i.reqLevel}</span> : null}
                    {i.src !== "ITEMS" ? <span className="lv"> · {i.src}</span> : null}
                  </span>
                  <span className="lv">Lv {i.tier}</span>
                </div>
              ))}
            </div>
          ))}
          {items && rows.length === 0 && (
            <div className="picker-note">No items for this class.</div>
          )}
        </div>
      </div>
    </div>
  );
}
