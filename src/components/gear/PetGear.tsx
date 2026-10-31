import { useState, type ReactNode } from "react";
import { Box } from "./Box";
import { GearColumn } from "./GearColumn";
import { GearViewer } from "./GearViewer";
import { GearSlot } from "./GearSlot";
import { PetGearPicker } from "./PetGearPicker";
import { useBuild, type PetSpellAsg } from "./BuildContext";
import { usePets } from "../../hooks/usePets";
import { petIconClass } from "../../lib/icons";

// pet gear slots 0..3 = eyes, inner bolus, feet accelerator, saddle
const PET_LEFT_SLOTS = ["PetGearEyes", "PetGearInnerBolus"];
const PET_RIGHT_SLOTS = ["PetGearFeetDecoration", "PetGearSaddle"];
const SLOT_INDEX: Record<string, number> = {
  PetGearEyes: 0,
  PetGearInnerBolus: 1,
  PetGearFeetDecoration: 2,
  PetGearSaddle: 3,
};
const SPELL_SLOTS = [0, 1, 2, 3, 4, 5, 6, 7];

export function PetGear() {
  const { level, pet, hasPet, setPetLevel, setPetGear, setPetSpell } = useBuild();
  const pets = usePets();
  const [picking, setPicking] = useState<number | null>(null);

  const species = pets && pet ? pets.species.find((s) => s.id === pet.speciesId) : null;
  const values: Record<string, string> = {};
  const icons: Record<string, string> = {};
  const tips: Record<string, ReactNode> = {};
  if (pet) {
    for (const [name, slot] of Object.entries(SLOT_INDEX)) {
      const g = pet.gear[slot];
      if (!g) continue;
      values[name] = g.name;
      const cls = petIconClass(g.icon);
      if (cls) icons[name] = cls;
      // the shipped tooltip text (the stats are inside it); the quotes wrap
      // the whole sentence in the source, so they are display noise here
      tips[name] = (
        <>
          <b>{g.name}</b>
          <div className="tip-body">{g.desc.replace(/^"|"$/g, "")}</div>
          {g.req > 0 && <div className="tip-meta">Requires Pet Lv {g.req}</div>}
        </>
      );
    }
  }
  const openSlot = (name: string) => {
    if (SLOT_INDEX[name] !== undefined) setPicking(SLOT_INDEX[name]);
  };
  const clearSlot = (name: string) => {
    if (pet) setPetGear(SLOT_INDEX[name], null);
  };

  // left click = +1 rank, right click = -1 rank (clamped 0..9)
  const clickSpell = (slot: number, asg: PetSpellAsg | undefined) => () => {
    if (!asg || asg.rank >= 9) return;
    setPetSpell(slot, { kind: asg.kind, rank: asg.rank + 1 });
  };
  const lowerSpell = (slot: number, asg: PetSpellAsg | undefined) => () => {
    if (!asg || asg.rank <= 0) return;
    setPetSpell(slot, { kind: asg.kind, rank: asg.rank - 1 });
  };
  const spellTip = (asg: PetSpellAsg | undefined) => {
    if (!pets || !asg) return undefined;
    const kind = pets.spells[asg.kind];
    const rank = kind.ranks[asg.rank];
    // the shipped desc hides its number behind a placeholder: $$_a takes the
    // effect as a percent, $d_a Store Up's item-slot count (not a percent)
    const num = kind.desc.includes("$$")
      ? `${+(rank.effect * 100).toFixed(1)}%`
      : `${+rank.effect.toFixed(1)}`;
    const body = kind.desc.replace(/\s*\$\$_a|\s*\$d_a/, ` ${num}`);
    return (
      <>
        <b>{kind.name}</b>
        <div className="tip-body">{body}</div>
        <div className="tip-meta">rank {asg.rank}</div>
      </>
    );
  };

  return (
    <Box title="Pet Gear" maxWidth="360px" className="gears" dimmed={!hasPet}>
      <div className="head">
        <label>
          {species?.name ?? "Pet"}
          <input
            type="number"
            min="0"
            max="300"
            value={pet?.level ?? level}
            disabled={!hasPet}
            onChange={(e) => setPetLevel(parseInt(e.target.value) || 0)}
          />
        </label>
      </div>

      <div className="gear">
        <GearColumn slots={PET_LEFT_SLOTS} values={values} icons={icons} tips={tips} onSlotClick={openSlot} onSlotClear={clearSlot} />
        <GearViewer label="3D pet" minHeight={200} isPet />
        <GearColumn slots={PET_RIGHT_SLOTS} values={values} icons={icons} tips={tips} onSlotClick={openSlot} onSlotClear={clearSlot} />
      </div>

      <div className="sub">Pet Spells</div>
      <div className="spells">
        {SPELL_SLOTS.map((slot) => {
          const asg = pet?.spells[slot];
          const kind = pets && asg ? pets.spells[asg.kind] : null;
          const cls = petIconClass(kind?.icon);
          return (
            <GearSlot
              key={slot}
              label={`S${slot + 1}`}
              size="small"
              icon={cls}
              active={!!asg && asg.rank > 0}
              badge={asg ? String(asg.rank) : undefined}
              className={asg && asg.rank === 0 ? "dim" : ""}
              onClick={clickSpell(slot, asg)}
              onContextMenu={lowerSpell(slot, asg)}
              tip={spellTip(asg)}
            />
          );
        })}
      </div>

      {picking !== null && (
        <PetGearPicker
          slot={picking}
          onClose={() => setPicking(null)}
          onPick={(g) => {
            setPetGear(picking, g);
            setPicking(null);
          }}
        />
      )}
    </Box>
  );
}
