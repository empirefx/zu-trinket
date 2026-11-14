// The workbench card: the piece header (icon, chips, save), the Rank |
// Enchant switch and the panel for the active mode.
import { useState } from "react";
import { Button, Card } from "@heroui/react";
import { pretty } from "../gear/gearSlots";
import { iconClass } from "../../lib/icons";
import { type Mode } from "./refineBits";
import { useRefineSim } from "./RefineSim";
import { RefineRankPanel } from "./RefineRankPanel";
import { RefineEnchantPanel } from "./RefineEnchantPanel";

export function RefineWorkbench() {
  const sim = useRefineSim();
  const { entry, sel, rank, enh } = sim;
  const [mode, setMode] = useState<Mode>("rank");

  return (
    <Card className="r-card r-work" aria-label="Refine" data-testid="refine-workbench">
      <Card.Content className="r-work-body">
        <div className="r-work-head">
          <span className={`r-gicon zs r-big ${iconClass(entry.item.icon) ?? ""}`} aria-hidden="true" />
          <div className="r-grow">
            <strong>{entry.item.name}</strong>
            <div className="r-state">Rank {rank} · Enchant {enh}</div>
            <span className="r-meta">{pretty(sel)} · gear level {entry.item.tier}</span>
          </div>
          <Button
            variant="outline"
            size="md"
            className="r-fav-toggle"
            onPress={sim.saveSession}
            aria-label="Save this session to favorites"
          >
            ☆ Save
          </Button>
        </div>

        <div className="r-seg" role="tablist" aria-label="Mode">
          <button type="button" role="tab" aria-selected={mode === "rank"} className={mode === "rank" ? "on" : ""} onClick={() => setMode("rank")}>Rank</button>
          <button type="button" role="tab" aria-selected={mode === "enchant"} className={mode === "enchant" ? "on" : ""} onClick={() => setMode("enchant")}>Enchant</button>
        </div>

        {mode === "rank" ? <RefineRankPanel /> : <RefineEnchantPanel />}
      </Card.Content>
    </Card>
  );
}
