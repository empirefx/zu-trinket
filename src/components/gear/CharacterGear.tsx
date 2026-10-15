import { Box } from "./Box";
import { GearColumn } from "./GearColumn";
import { GearViewer } from "./GearViewer";
import { GearSlot } from "./GearSlot";
import { useBuild } from "./BuildContext";

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
  "Pet",
];

const BOTTOM_SLOTS = [
  "FashionHead",
  "FashionBody",
  "FashionWeapon",
  "FashionWings",
];

const CLASSES = [
  { id: "swordsman", name: "Swordsman" },
  { id: "sunwarrior", name: "Sun Warrior" },
  { id: "beadfairy", name: "Bead Fairy" },
  { id: "moonmaiden", name: "Moonmaiden" },
  { id: "summoner", name: "Summoner" },
];

const TITLES = ["Swift Killer", "Title 2", "Title 3"];

export function CharacterGear() {
  const { classId, level, title, setClassId, setLevel, setTitle } = useBuild();

  return (
    <Box title="Character Gear" maxWidth="360px" className="gears">
      <div className="head">
        <label>
          Level
          <input
            type="number"
            min="1"
            max="200"
            value={level}
            onChange={(e) => setLevel(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))}
          />
        </label>
        <label>
          Title
          <select value={title} onChange={(e) => setTitle(e.target.value)}>
            {TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <br />
        <label>
          Class
          <select value={classId} onChange={(e) => setClassId(e.target.value as any)}>
            {CLASSES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>

      <div className="gear">
        <GearColumn slots={LEFT_SLOTS} />
        <GearViewer label="3D character" minHeight={340} />
        <GearColumn slots={RIGHT_SLOTS} />
      </div>

      <div className="bottom">
        {BOTTOM_SLOTS.map((s, i) => (
          <GearSlot key={i} label={s} />
        ))}
      </div>
    </Box>
  );
}