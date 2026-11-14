// The enchant panel: gear | spar | preview slots, the enchant/goal fields,
// the colored probability and the roll button.
import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { GearTooltip } from "../gear/GearTooltip";
import { refineIconClass } from "../../lib/icons";
import { ENH_LOCKS, GearSlotBox, probColor } from "./refineBits";
import { useRefineSim } from "./RefineSim";

export function RefineEnchantPanel() {
  const sim = useRefineSim();
  const { entry, rank, enh, enhGoal, spar, sparKind, stones, enhRate, hasEnchant, enhMax } = sim;

  // the goal field keeps the keystrokes locally and commits on blur/Enter
  const [goalDraft, setGoalDraft] = useState<string | null>(null);
  const commitGoal = () => {
    sim.setEnhGoal(parseInt(goalDraft ?? "", 10) || enhGoal);
    setGoalDraft(null);
  };

  return (
    <div className="r-panel" data-testid="enchant-panel">
      <div className="r-slots">
        <GearSlotBox
          icon={entry.item.icon}
          label={`Enchant ${enh}`}
          tip={<GearTooltip entry={{ ...entry, rank, enhance: enh }} />}
          badge={ENH_LOCKS.includes(enh) ? "locked" : undefined}
        />
        <div className={`r-slot ${spar ? "" : "off"}`} tabIndex={spar ? 0 : undefined}>
          <span className="r-icon-badge-wrap">
            <span className={`r-gicon zs r-slot-icon ${spar ? refineIconClass(spar.icon) ?? "" : ""}`}>{spar ? "" : "◆"}</span>
            {spar && <span className="r-mat-badge">{stones}</span>}
          </span>
          <span className="r-muted">{spar ? spar.name : "No spar"}</span>
          {spar && (
            <div className="r-tip">
              <b>{spar.name}</b>
              <span className="r-tip-body">{spar.desc}</span>
            </div>
          )}
        </div>
        <GearSlotBox
          icon={entry.item.icon}
          label={`Enchant ${enhGoal}`}
          tip={<GearTooltip entry={{ ...entry, enhance: enhGoal }} />}
          badge={ENH_LOCKS.includes(enhGoal) ? "safe" : undefined}
        />
      </div>
      <div className="r-two">
        <label className="r-numfield">
          <span>Enchant</span>
          <Input type="number" aria-label="Enchant" variant="secondary" value={enh}
            onChange={(e) => sim.setEnh(parseInt(e.target.value) || 0)} />
        </label>
        <label className="r-numfield">
          <span>Goal</span>
          <Input
            type="number"
            aria-label="Enchant goal"
            variant="secondary"
            value={goalDraft ?? enhGoal}
            disabled={enh >= enhMax}
            onChange={(e) => setGoalDraft(e.target.value)}
            onBlur={commitGoal}
            onKeyDown={(e) => { if (e.key === "Enter") commitGoal(); }}
          />
        </label>
      </div>
      {hasEnchant ? (
        enh >= enhMax ? (
          <p className="r-maxed">Enchant is maxed out</p>
        ) : (
          <p className="r-prob" style={{ color: probColor(enhRate ?? 0) }}>
            Probability {enhRate === null ? "—" : `${enhRate}%`}
          </p>
        )
      ) : (
        <p className="r-note">This item has no enchant curve (no STAR group).</p>
      )}
      {!spar && hasEnchant && (
        <p className="r-note">No spar covers level {entry.item.tier} {sparKind === "attack" ? "weapons / Spirit Breath" : "armour"}.</p>
      )}
      <label className="r-check">
        <input
          type="checkbox"
          checked={sim.auto}
          disabled={sim.enh >= sim.enhMax || !hasEnchant || !spar}
          onChange={(e) => sim.setAuto(e.target.checked)}
        />
        Auto Enchanting
      </label>
      <div className="r-actions">
        <Button variant="primary" size="lg" isDisabled={sim.enhDone || !spar || enhRate === null} onPress={() => sim.run("enchant")}>
          Enchant
        </Button>
      </div>
    </div>
  );
}
