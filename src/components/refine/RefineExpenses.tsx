// The expenses card: the session's total Bones, attempts and the materials
// used, with the reset-everything button.
import { Button, Card } from "@heroui/react";
import { refineIconClass } from "../../lib/icons";
import { num } from "./refineBits";
import { useRefineSim } from "./RefineSim";

export function RefineExpenses() {
  const sim = useRefineSim();
  const { attempts, totals } = sim;

  return (
    <Card className="r-card r-sum" aria-label="Expenses" data-testid="refine-expenses">
      <Card.Header><Card.Title>Total spent</Card.Title></Card.Header>
      <Card.Content className="r-sum-body">
        <p className="r-total">{num(totals.gold)} <span className="r-muted">Bones</span></p>
        <div className="r-stats">
          <div className="r-box"><small>Attempts</small><strong>{attempts.length}</strong></div>
          <div className="r-box"><small>Success rate</small><strong>{attempts.length ? Math.round((totals.ok / attempts.length) * 100) : 0}%</strong></div>
          <div className="r-box"><small>Successes</small><strong className="r-ok">{totals.ok}</strong></div>
          <div className="r-box"><small>Failures</small><strong className="r-bad">{totals.fail}</strong></div>
        </div>
        <div>
          <p className="r-muted">Materials used</p>
          <ul className="r-used">
            {totals.mats.map(([name, m]) => (
              <li key={name}>
                <span className={`r-gicon zs ${m.icon ? refineIconClass(m.icon) ?? "" : ""}`}>{m.icon ? "" : "◆"}</span>
                <span className="r-grow">{name}</span>
                <strong>×{m.count}</strong>
              </li>
            ))}
            {totals.mats.length === 0 && <li className="r-muted">Nothing yet</li>}
          </ul>
        </div>
      </Card.Content>
      <Card.Footer>
        <Button variant="outline" size="lg" className="w-full" isDisabled={attempts.length === 0} onPress={sim.resetSession}>
          Reset session
        </Button>
      </Card.Footer>
    </Card>
  );
}
