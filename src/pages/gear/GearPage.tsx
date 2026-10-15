import "./gear.css";
import { CharacterGear } from "../../components/gear/CharacterGear";
import { PlayerStats } from "../../components/gear/PlayerStats";
import { PetGear } from "../../components/gear/PetGear";
import { PetStats } from "../../components/gear/PetStats";
import { BuildProvider } from "../../components/gear/BuildContext";

export function GearPage() {
  return (
    <BuildProvider>
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
    </BuildProvider>
  );
}