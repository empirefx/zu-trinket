import "./gear.css";
import { CharacterGear } from "../../components/gear/CharacterGear";
import { PlayerStats } from "../../components/gear/PlayerStats";
import { PetGear } from "../../components/gear/PetGear";
import { PetStats } from "../../components/gear/PetStats";

export function GearPage() {
  return (
    <div
      id="gear-page"
      className="gear-page h-full w-full overflow-auto"
      data-testid="gear-page"
    >
      <div className="row">
        <CharacterGear />
        <PlayerStats />
        <PetGear />
        <PetStats />
      </div>
    </div>
  );
}