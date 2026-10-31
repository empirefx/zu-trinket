import { useMemo } from "react";
import { usePets } from "../../hooks/usePets";
import { sortSpecies } from "../../lib/pets";
import { petIconClass } from "../../lib/icons";

// The pet picker: species grouped by the egg that hatches them
// (Primary / Junior / Senior, then the rest), each group sorted by aptitude
// (lower first, the no-egg species last).  The aptitude shown is the egg
// tooltip's range - the real roll is server-side, hence "(est.)".
const GROUP_ORDER = ["Primary", "Junior", "Senior", "Other"];

interface PetPickerProps {
  onClose: () => void;
  onPick: (speciesId: number) => void;
  // present only while a pet is held: the dismiss row
  onClear?: () => void;
}

export function PetPicker({ onClose, onPick, onClear }: PetPickerProps) {
  const pets = usePets();

  const groups = useMemo(() => {
    if (!pets) return [];
    const byKind = new Map<string, typeof pets.species>();
    for (const s of pets.species) {
      const k = s.eggKind || "Other";
      if (!byKind.has(k)) byKind.set(k, []);
      byKind.get(k)!.push(s);
    }
    const ordered = [...byKind.keys()].sort(
      (a, b) => GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b) || a.localeCompare(b),
    );
    return ordered.map((k) => ({ kind: k, rows: sortSpecies(byKind.get(k)!) }));
  }, [pets]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          Choose Pet
          <span className="modal-sub"> — aptitude (est.)</span>
        </div>
        <div className="modal-list">
          {!pets && <div className="picker-note">Loading pets…</div>}
          {onClear && (
            <div className="item-row" onClick={onClear}>
              <span className="item-name">Dismiss pet</span>
            </div>
          )}
          {groups.map((g) => (
            <div key={g.kind}>
              <div className="group">{g.kind} · {g.rows.length}</div>
              {g.rows.map((s) => {
                const icon = petIconClass(s.icon);
                return (
                  <div key={s.id} className="item-row" onClick={() => onPick(s.id)}>
                    {icon ? <span className={"gear-icon zs " + icon} /> : null}
                    <span className="item-name">{s.name}</span>
                    <span className="lv">
                      {s.apt
                        ? `apt ${s.apt[0]}${s.apt[1] !== s.apt[0] ? `–${s.apt[1]}` : ""}`
                        : "apt —"}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
