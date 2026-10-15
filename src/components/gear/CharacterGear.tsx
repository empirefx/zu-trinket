import { Box } from "./Box";
import { GearColumn } from "./GearColumn";
import { GearViewer } from "./GearViewer";
import { GearSlot } from "./GearSlot";

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

export function CharacterGear() {
  return (
    <Box title="Character Gear" maxWidth="360px" className="gears">
      <div className="head">
        <label>
          Level
          <input type="number" min="1" max="200" defaultValue={200} />
        </label>
        <label>
          Title
          <select>
            <option>Swift Killer</option>
            <option>Title 2</option>
            <option>Title 3</option>
          </select>
        </label>
        <br />
        <label>
          Class
          <select>
            <option>Swordsman</option>
            <option>Sun Warrior</option>
            <option>Bead Fairy</option>
            <option>Moonmaiden</option>
            <option>Summoner</option>
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