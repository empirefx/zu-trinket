import { useState } from "react";
import { Tabs } from "@heroui/react";
import "./gear.css";
import "./slots-sprite.css";
import { CharacterGear } from "../../components/gear/CharacterGear";
import { PlayerStats } from "../../components/gear/PlayerStats";
import { PetGear } from "../../components/gear/PetGear";
import { PetStats } from "../../components/gear/PetStats";
import { TalentTrees } from "../../components/gear/TalentTrees";
import { BuildProvider } from "../../components/gear/BuildContext";

export function GearPage() {
  const [tab, setTab] = useState("pet");

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

          {/* the pet and the talent trees share one tabbed column */}
          <div className="tabs-col">
            <Tabs
              className="gear-tabs"
              selectedKey={tab}
              onSelectionChange={(k) => setTab(String(k))}
            >
              <Tabs.ListContainer>
                <Tabs.List>
                  <Tabs.Tab id="pet">
                    Pet
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="talent">
                    Talent
                    <Tabs.Indicator />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>

              <Tabs.Panel id="pet">
                <div className="row tight">
                  <PetGear />
                  <PetStats />
                </div>
              </Tabs.Panel>

              <Tabs.Panel id="talent">
                <div className="row tight">
                  <TalentTrees />
                </div>
              </Tabs.Panel>
            </Tabs>
          </div>
        </div>
      </div>
    </BuildProvider>
  );
}
