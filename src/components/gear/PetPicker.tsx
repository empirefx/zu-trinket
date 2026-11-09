import { useMemo } from "react";
import { usePets } from "../../hooks/usePets";
import { sortSpecies } from "../../lib/pets";
import { petIconClass } from "../../lib/icons";

// The egg windows in the game's own wording (live observation, 2026-11-09).
// Each egg tooltip lists which pets it can hatch — cumulative, so pets repeat
// across groups (the Junior egg also hatches three Primary pets, the Senior
// egg one Junior pet). The shipped data's eggKind only marks the pet's own
// tier, so these hatch lists are hand-kept here.
const EGG_GROUPS: [string, string[]][] = [
  ["Primary Pet", ["Ursus", "Nar Whale", "Aquamarine Hydralion", "Fiery Howler", "Flying Pig"]],
  ["Junior Pet", ["Aquamarine Hydralion", "Fiery Howler", "Flying Pig", "Talbuk", "Taiji Beast"]],
  ["Senior Pet", ["Taiji Beast", "Fiery Dancer", "Ink Kylin", "Shadow Foal"]],
];
// the Other group's exclusions (live data): an egg-only record with no pet,
// and egg-only pet records that repeat a listed or other pet's name
const EXCLUDED = new Set(["Dark Phoenix Egg"]);

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
    // the same name keeps its first record (the shipped Other group repeats
   // some names)
    const byName = new Map<string, (typeof pets.species)[number]>();
    for (const s of pets.species) if (!byName.has(s.name)) byName.set(s.name, s);

    const listed = new Set(EGG_GROUPS.flatMap(([, names]) => names));
    const other = sortSpecies(
      pets.species.filter(
        (s) => !EXCLUDED.has(s.name) && !listed.has(s.name) && byName.get(s.name) === s,
      ),
    );
    return [
      ...EGG_GROUPS.map(([label, names]) => ({
        label,
        rows: names.map((n) => byName.get(n)).filter((s) => s !== undefined),
      })),
      { label: "Other", rows: other },
    ];
  }, [pets]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          Choose Pet
        </div>
        <div className="modal-list">
          {!pets && <div className="picker-note">Loading pets…</div>}
          {onClear && (
            <div className="item-row" onClick={onClear}>
              <span className="item-name">Dismiss pet</span>
            </div>
          )}
          {groups.map((g) => (
            <div key={g.label}>
              <div className="group">{g.label} · {g.rows.length}</div>
              {g.rows.map((s) => {
                const icon = petIconClass(s.icon);
                // the egg tooltip promises 2300 for the pets it has no range
                // for (the real roll is server-side, hence "(est.)")
                const apt = s.apt ?? [2300, 2300];
                return (
                  <div key={s.id} className="item-row" onClick={() => onPick(s.id)}>
                    {icon ? <span className={"gear-icon zs " + icon} /> : null}
                    <span className="item-name">{s.name}</span>
                    <span className="lv">
                      {`apt ${apt[0]}${apt[1] !== apt[0] ? `–${apt[1]}` : ""}`}
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
