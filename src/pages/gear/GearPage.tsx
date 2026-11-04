import { useState, type ReactNode } from "react";
import { Card, Tabs } from "@heroui/react";
import "./gear.css";
import "./slots-sprite.css";
import { CharacterGear } from "../../components/gear/CharacterGear";
import { PlayerStats } from "../../components/gear/PlayerStats";
import { PetGear } from "../../components/gear/PetGear";
import { PetStats } from "../../components/gear/PetStats";
import { TalentTrees } from "../../components/gear/TalentTrees";
import { BuildProvider, useBuild } from "../../components/gear/BuildContext";
import { BuildsHeader } from "../../components/gear/BuildsHeader";

const SECTIONS =
  [["character", "Character"], ["talent", "Talent"], ["pet", "Pet"], ["skills", "Skills"]] as const;

import { ClassSkills } from "../../components/gear/ClassSkills";

// One gear panel: two columns on desktop, stacked on mobile (skeleton's Split).
function Split({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <Card className="rounded-[28px] p-0 gap-0">
      <Card.Content className="grid grid-cols-1 md:grid-cols-2 p-0">
        <div className="p-4 sm:p-6">{left}</div>
        <div className="p-4 sm:p-6 border-t md:border-t-0 md:border-l border-separator">{right}</div>
      </Card.Content>
    </Card>
  );
}

// Panels are inert + dimmed while no build is selected (useBuild from the
// BuildProvider in scope; overlays render as portals and are unaffected).
function Panel({ children }: { children: ReactNode }) {
  const { selectedId } = useBuild();
  return (
    <div
      className={selectedId === null ? "opacity-40 pointer-events-none" : ""}
      inert={selectedId === null || undefined}
      data-testid="gear-panel-gate"
    >
      {children}
    </div>
  );
}

export function GearPage() {
  const [tab, setTab] = useState("character");

  return (
    <BuildProvider>
      <div
        id="gear-page"
        className="gear-page h-full w-full overflow-auto"
        data-testid="gear-page"
      >
        {/* pt-16 clears the floating Map/Gear tab bar (TopTabs, absolute top-3) */}
        <main className="mx-auto max-w-6xl p-3 pt-16 sm:p-6 sm:pt-30">
          <Tabs
            selectedKey={tab}
            onSelectionChange={(k) => setTab(String(k))}
            variant="secondary"
            className="flex flex-col gap-4"
          >
            {/* the builds header carries the section tabs in its middle slot;
                it inerts + dims the tabs until a build is selected */}
            <BuildsHeader>
              <Tabs.List aria-label="Sections" className="w-full md:w-[420px]">
                {SECTIONS.map(([id, label]) => (
                  <Tabs.Tab key={id} id={id} className="flex-1 h-9 text-sm cursor-pointer">
                    {label}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </BuildsHeader>

            {/* one panel per tab, full width under the header */}
            <Tabs.Panel id="character">
              <Panel>
                <Split left={<CharacterGear />} right={<PlayerStats />} />
              </Panel>
            </Tabs.Panel>
            <Tabs.Panel id="talent">
              <Panel>
                <TalentTrees />
              </Panel>
            </Tabs.Panel>
            <Tabs.Panel id="pet">
              <Panel>
                <Split left={<PetGear />} right={<PetStats />} />
              </Panel>
            </Tabs.Panel>
            <Tabs.Panel id="skills">
              <Panel>
                <ClassSkills />
              </Panel>
            </Tabs.Panel>
          </Tabs>
        </main>
      </div>
    </BuildProvider>
  );
}
