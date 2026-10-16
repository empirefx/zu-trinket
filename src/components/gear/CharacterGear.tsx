import { useState } from "react";
import { Box } from "./Box";
import { GearColumn } from "./GearColumn";
import { GearViewer } from "./GearViewer";
import { GearSlot } from "./GearSlot";
import { GearPicker } from "./GearPicker";
import { GearDrawer } from "./GearDrawer";
import { CLASS_NAMES, SLOT_ITEMS } from "./gearSlots";
import { useBuild } from "./BuildContext";
import { TITLES } from "./titles";
import type { Item } from "../../lib/items";

const LEFT_SLOTS = [
  "Precious",
  "Weapon",
  "SpiritWeapon",
  "SpiritArmor",
  "FortuneGear",
  "Trinket",
];

const RIGHT_SLOTS = [
  "Headband",
  "Clothes",
  "WaistbandDecorator",
  "Armguards",
  "Boots",
];

const BOTTOM_SLOTS = [
  "FashionHead",
  "FashionBody",
  "FashionWeapon",
  "FashionWings",
];

const TITLES_OPTIONS = [{ name: "None", effect: "" }, ...TITLES];

export function CharacterGear() {
  const { classId, level, title, hasPet, gear, setClassId, setLevel, setTitle, togglePet, setGear } = useBuild();
  const [picking, setPicking] = useState<string | null>(null);
  const [pending, setPending] = useState<{ slot: string; item: Item } | null>(null);

  const values = Object.fromEntries(Object.entries(gear).map(([s, e]) => [s, e.item.name]));
  const openSlot = (slot: string) => {
    if (SLOT_ITEMS[slot]) setPicking(slot);
  };

  return (
    <Box title="Character Gear" maxWidth="360px" className="gears">
      <div className="head">
        <label>
          Level
          <input
            type="number"
            min="0"
            max="200"
            value={level}
            onChange={(e) => setLevel(Math.max(0, Math.min(200, parseInt(e.target.value) || 0)))}
          />
        </label>
        <label>
          Title
          <select value={title} onChange={(e) => setTitle(e.target.value)}>
            {TITLES_OPTIONS.map((t) => (
              <option key={t.name} value={t.name} title={t.effect}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <br />
        <label>
          Class
          <select value={classId} onChange={(e) => setClassId(e.target.value as any)}>
            {Object.entries(CLASS_NAMES).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="gear">
        <GearColumn slots={LEFT_SLOTS} values={values} onSlotClick={openSlot} />
        <GearViewer label="3D character" minHeight={340} />
        <GearColumn slots={RIGHT_SLOTS} values={values} onSlotClick={openSlot}>
          <GearSlot label="Pet" active={hasPet} onClick={togglePet} />
        </GearColumn>
      </div>

      <div className="bottom">
        {BOTTOM_SLOTS.map((s) => (
          <GearSlot key={s} label={s} />
        ))}
      </div>

      {picking && (
        <GearPicker
          appSlot={picking}
          onClose={() => setPicking(null)}
          onPick={(item) => {
            setPending({ slot: picking, item });
            setPicking(null);
          }}
        />
      )}
      {pending && (
        <GearDrawer
          item={pending.item}
          appSlot={pending.slot}
          onCancel={() => setPending(null)}
          onAdd={(entry) => {
            setGear(pending.slot, entry);
            setPending(null);
          }}
        />
      )}
    </Box>
  );
}