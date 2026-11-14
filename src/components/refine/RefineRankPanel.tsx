// The rank panel: gear | materials | preview slots, the rank/goal fields,
// the colored probability, cost, Auto Rank + Full party and the roll button.
import { useState } from "react";
import { Button, Chip, Input } from "@heroui/react";
import { GearTooltip } from "../gear/GearTooltip";
import { GearSlotBox, MatSlot, num, probColor } from "./refineBits";
import { useRefineSim } from "./RefineSim";

export function RefineRankPanel() {
  const sim = useRefineSim();
  const { entry, rank, rankGoal, maxRank, gradeCost, gradeMats, rankRate } = sim;

  // the goal field keeps the keystrokes locally and commits on blur/Enter,
  // so typing "12" is not clamped to current+1 after the first digit
  const [goalDraft, setGoalDraft] = useState<string | null>(null);
  const commitGoal = () => {
    sim.setRankGoal(parseInt(goalDraft ?? "", 10) || rankGoal);
    setGoalDraft(null);
  };

  return (
    <div className="r-panel" data-testid="rank-panel">
      <div className="r-slots">
        <GearSlotBox icon={entry.item.icon} label={`Rank ${rank}`} tip={<GearTooltip entry={entry} />} />
        <div className="r-mat-slots" aria-label="Materials per attempt">
          {gradeMats.map((m, i) => <MatSlot key={i} mat={m} />)}
        </div>
        <GearSlotBox
          icon={entry.item.icon}
          label={`Rank ${rankGoal}`}
          tip={<GearTooltip entry={{ ...entry, rank: rankGoal }} />}
        />
      </div>
      <div className="r-two">
        <label className="r-numfield">
          <span>Rank</span>
          <Input type="number" aria-label="Rank" variant="secondary" value={rank}
            onChange={(e) => sim.setRank(parseInt(e.target.value) || 0)} />
        </label>
        <label className="r-numfield">
          <span>Goal</span>
          <Input
            type="number"
            aria-label="Goal"
            variant="secondary"
            value={goalDraft ?? rankGoal}
            disabled={rank >= maxRank}
            onChange={(e) => setGoalDraft(e.target.value)}
            onBlur={commitGoal}
            onKeyDown={(e) => { if (e.key === "Enter") commitGoal(); }}
          />
        </label>
      </div>
      {rank >= maxRank ? (
        <p className="r-maxed">Gear is maxed out</p>
      ) : (
        <>
          <p className="r-prob" style={{ color: probColor(rankRate) }}>
            Probability {rankRate}%
          </p>
          <div className="r-costrow">
            <span className="r-muted">Cost per attempt</span>
            <Chip size="lg" variant="soft">{num(gradeCost)} Bones</Chip>
          </div>
        </>
      )}
      <div className="r-checks">
        <label className="r-check">
          <input type="checkbox" checked={sim.auto} disabled={sim.rank >= maxRank} onChange={(e) => sim.setAuto(e.target.checked)} />
          Auto Rank
        </label>
        <label className="r-check">
          <input type="checkbox" checked={sim.party} disabled={sim.rank >= maxRank} onChange={(e) => sim.setParty(e.target.checked)} />
          Full party
        </label>
      </div>
      <div className="r-actions">
        <Button variant="primary" size="lg" isDisabled={sim.rankDone} onPress={() => sim.run("rank")}>
          {rank >= maxRank ? "Max rank" : "Refine"}
        </Button>
      </div>
    </div>
  );
}
