import { Box } from "./Box";
import { GearColumn } from "./GearColumn";
import { GearViewer } from "./GearViewer";
import { GearSlot } from "./GearSlot";

const PET_LEFT_SLOTS = ["PetGearEyes", "PetGearInnerBolus"];
const PET_RIGHT_SLOTS = ["PetGearFeetDecoration", "PetGearSaddle"];
const PET_SPELLS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];

export function PetGear() {
  return (
    <Box title="Pet Gear" maxWidth="360px" className="gears">
      <div className="info">Level: 138</div>

      <div className="gear">
        <GearColumn slots={PET_LEFT_SLOTS} />
        <GearViewer label="3D pet" minHeight={200} isPet />
        <GearColumn slots={PET_RIGHT_SLOTS} />
      </div>

      <div className="sub">Pet Spells</div>
      <div className="spells">
        {PET_SPELLS.map((s, i) => (
          <GearSlot key={i} label={s} size="small" />
        ))}
      </div>
    </Box>
  );
}