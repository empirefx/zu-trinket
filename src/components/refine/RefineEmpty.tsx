// The page's layout behind the gate: shown (greyed) instead of the workbench
// when the build has no gear, so the page shape stays visible.
import { Button, Card } from "@heroui/react";

export function RefineEmpty() {
  return (
    <div className="r-grid" data-testid="refine-empty-grid">
      <Card className="r-card r-fav" aria-label="Favorites">
        <Card.Header><Card.Title>Favorites</Card.Title></Card.Header>
        <Card.Content>
          <p className="r-fav-empty">Add Gear session as favorites</p>
        </Card.Content>
      </Card>
      <Card className="r-card r-work" aria-label="Refine">
        <Card.Content className="r-work-body">
          <p className="r-empty-note">Select gear to refine</p>
        </Card.Content>
      </Card>
      <Card className="r-card r-sum" aria-label="Expenses">
        <Card.Header><Card.Title>Total spent</Card.Title></Card.Header>
        <Card.Content className="r-sum-body">
          <p className="r-total">0 <span className="r-muted">Bones</span></p>
          <div className="r-stats">
            <div className="r-box"><small>Attempts</small><strong>0</strong></div>
            <div className="r-box"><small>Success rate</small><strong>0%</strong></div>
            <div className="r-box"><small>Successes</small><strong className="r-ok">0</strong></div>
            <div className="r-box"><small>Failures</small><strong className="r-bad">0</strong></div>
          </div>
          <div>
            <p className="r-muted">Materials used</p>
            <ul className="r-used">
              <li className="r-muted">Nothing yet</li>
            </ul>
          </div>
        </Card.Content>
        <Card.Footer>
          <Button variant="outline" size="lg" className="w-full" isDisabled>
            Reset session
          </Button>
        </Card.Footer>
      </Card>
      <Card className="r-card r-log" aria-label="Attempt log">
        <Card.Header><Card.Title>Attempts</Card.Title></Card.Header>
        <Card.Content className="r-log-body">
          <p className="r-empty-note">No attempts yet</p>
        </Card.Content>
      </Card>
    </div>
  );
}
