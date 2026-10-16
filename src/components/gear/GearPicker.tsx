import { useMemo } from "react";
import { useBuild } from "./BuildContext";
import { useItems } from "../../hooks/useItems";
import { pretty, CLASS_NAMES, SLOT_ITEMS, uniqueItems } from "./gearSlots";
import type { Item } from "../../lib/items";

// common items are the +1..+9 upgrade-stage spam (same name repeated per level),
// so the list only offers the set grades: superior = the 2 suits per level,
// legendary = the 1 epic per level. ponytail: common hidden for now, re-add if
// the base rolls are wanted.
const GRADES = ["amber", "legendary", "superior"] as const;
const GRADE_LABEL: Record<string, string> = {
  amber: "Amber",
  legendary: "Epics · 1 set per level",
  superior: "Suits · 2 sets per level",
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
    if (!items) return [];
    const wanted = new Set(SLOT_ITEMS[appSlot] ?? []);
    const mine = uniqueItems(items).filter((i) => i.class === classId && wanted.has(i.slot));
    return GRADES.map((g) => ({
      grade: g,
      rows: mine
        .filter((i) => i.grade === g)
        .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name)),
    })).filter((g) => g.rows.length > 0);
  }, [items, classId, appSlot]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          Choose {pretty(appSlot)}
          <span className="modal-sub"> — {CLASS_NAMES[classId]}</span>
        </div>
        <div className="modal-list">
          {!items && <div className="picker-note">Loading items…</div>}
          {groups.map((g) => (
            <div key={g.grade}>
              <div className="group">
                {GRADE_LABEL[g.grade]} · {g.rows.length}
              </div>
              {g.rows.map((i) => (
                <div key={i.id} className="item-row" onClick={() => onPick(i)}>
                  <span>{i.name}</span>
                  <span className="lv">Lv {i.tier}</span>
                </div>
              ))}
            </div>
          ))}
          {items && groups.length === 0 && (
            <div className="picker-note">No items for this class.</div>
          )}
        </div>
      </div>
    </div>
  );
}
