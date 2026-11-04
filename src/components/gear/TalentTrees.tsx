import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Card, Chip } from "@heroui/react";
import { useBuild } from "./BuildContext";
import {
  loadTalents,
  talentPoints,
  TREE_NAMES,
  type ClassTalents,
  type TalentNode,
  type TalentTree,
} from "../../lib/talents";
import { nodeStates } from "./talentLogic";
import { iconClass } from "../../lib/icons";

const COLS = 4;
const ROWS = 8;

// The tooltip body is the game's own prose ("Increases damage of Frost Shot,
// Flame Shot and Thunder Shot spells by 7%" / "Learn skills: SS.Thunder
// Chasing, ..."). Highlight what matters:
// - numbers/percentages (gold, larger),
// - skill/stat names (blue): an "SS.<name>" class-skill reference, a run of
//   2+ capitalised words ("Frost Shot", "Critical Strike Damage"), a single
//   capitalised word standing right before spells/skill/chance/power/speed/
//   strike, standing stat words (Garrote, Dodge, Parry, Health, ...) and the
//   lowercase stat phrases ("attack speed", "critical strike", "max health")
const TIP_RE =
  /\d+(?:\.\d+)?%(?:s\b)?|\d+(?:,\d{3})+|\b\d+(?:\.\d+)?(?:\s*sec\b)?|\bSS\.[A-Za-z'-]+(?:\s+[A-Z][A-Za-z'-]+)*|[A-Z][A-Za-z'-]+(?:\s+[A-Z][A-Za-z'-]+)+|[A-Z][A-Za-z'-]+(?=\s+(?:spell|spells|skill|chance|power|speed|strike)\b)|\b(?:Garrote|Dodge|Parry|Health|Mana|Defense|Stamina|Accuracy)\b|\b(?:attack|critical|movement)\s+speed\b|\bcritical\s+strike\b|\bmaximum\s+health\b/g;

function TipText({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(TIP_RE)) {
    const at = m.index!;
    if (at > last) out.push(text.slice(last, at));
    const cls = /\d/.test(m[0]) ? "tip-num" : "tip-skill";
    out.push(
      <span key={key++} className={cls}>
        {m[0]}
      </span>,
    );
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

// The tree's rows are the PointNeed bands (0..70 points -> 8 rows) and the
// nodes of a band are laid out left to right, centred in the row.  The
// game's own grid table (interface/include/inherence.inc) is not recoverable
// (see zu-re/docs/talents.md), so the columns are an approximation - the
// row/band structure is the real one.
function layout(tree: TalentTree): (TalentNode | null)[] {
  const cells: (TalentNode | null)[] = new Array(ROWS * COLS).fill(null);
  const bands = new Map<number, TalentNode[]>();
  for (const n of tree.nodes) {
    const row = Math.min(Math.floor(n.pointNeed / 10), ROWS - 1);
    bands.set(row, [...(bands.get(row) ?? []), n]);
  }
  for (const [row, nodes] of bands) {
    const start = Math.floor((COLS - nodes.length) / 2);
    nodes.forEach((n, i) => {
      const col = start + i;
      if (col < COLS) cells[row * COLS + col] = n;
    });
  }
  return cells;
}

export function TalentTrees() {
  const { classId, level, talentRanks, learnTalent } = useBuild();
  const [talents, setTalents] = useState<Record<string, ClassTalents>>({});

  useEffect(() => {
    loadTalents().then(setTalents);
  }, []);

  const trees = talents[classId] ?? [];
  const earned = talentPoints(level);

  // the points spent in each tree and the free points (one pool for all three)
  const { states, spent, free } = useMemo(() => {
    const spentPerTree = trees.map((tree) =>
      tree.nodes.reduce(
        (sum, n) => sum + Math.min(talentRanks[n.id] ?? 0, n.maxRank),
        0,
      ),
    );
    const spentTotal = spentPerTree.reduce((a, b) => a + b, 0);
    const free = earned - spentTotal;
    return {
      states: trees.map((tree, i) => nodeStates(tree, talentRanks, spentPerTree[i], free)),
      spent: spentPerTree,
      free,
    };
  }, [trees, talentRanks, earned]);

  const names = TREE_NAMES[classId] ?? ["Talent tree 1", "Talent tree 2", "Talent tree 3"];

  return (
    <div className="talent-panel" data-testid="talent-trees">
      <div className="talent-bar">
        <span>
          Points earned <b>{earned}</b>
        </span>
        <span>
          Spent <b>{spent.reduce((a, b) => a + b, 0)}</b>
        </span>
        <span>
          Remaining <b>{free}</b>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {trees.map((tree, i) => {
          const cells = layout(tree);
          const byId = new Map(states[i].map((s) => [s.node.id, s]));
          return (
            <Card key={tree.tree} className="rounded-[28px] p-5">
              <Card.Header className="flex-row items-center justify-between">
                <Card.Title className="text-2xl">{names[i] ?? `Talent tree ${i + 1}`}</Card.Title>
                <Chip size="lg" color="accent" variant="soft">
                  {spent[i]} pts
                </Chip>
              </Card.Header>
              <Card.Content>
                <div className="talent-grid">
                {cells.map((node, k) => {
                  if (!node) return <div key={k} className="talent-gap" />;
                  const st = byId.get(node.id);
                  if (!st) return <div key={k} className="talent-gap" />;
                  // the text of the rank that is learned: the HUD reads
                  // GetTalentBaseInfo(instance.ID) and the instance id is the
                  // current rank's record, so an unlearned node shows rank 1
                  const intro =
                    node.intros[Math.min(Math.max(st.rank, 1), node.intros.length) - 1];
                  const cls =
                    "talent-node" +
                    (st.rank > 0 ? " learned" : "") +
                    (st.maxed ? " maxed" : "") +
                    (st.learnable ? " learnable" : "") +
                    (st.locked ? " locked" : "");
                  return (
                    <div
                      key={k}
                      className={cls}
                      role="button"
                      tabIndex={0}
                      aria-label={`${node.name} - ${intro}`}
                      onClick={() => st.learnable && learnTalent(node.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if ((talentRanks[node.id] ?? 0) > 0) learnTalent(node.id, -1);
                      }}
                      onKeyDown={(e) => {
                        if (st.learnable && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          learnTalent(node.id);
                        }
                      }}
                    >
                      <span className={"gear-icon zs " + (iconClass(node.icon) ?? "")} />
                      {st.rank > 0 && <span className="rank-badge">{st.rank}</span>}
                      <div className="hover-tip" role="tooltip">
                        <b>{node.name}</b>
                        <div className="tip-body">
                          <TipText text={intro} />
                        </div>
                        <div className="tip-meta">
                          {node.maxRank} rank{node.maxRank > 1 ? "s" : ""}
                          {node.pointNeed ? ` · band at ${node.pointNeed} points` : ""}
                        </div>
                        {!st.learnable && st.reason && (
                          <div className="talent-locked">{st.reason}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              </Card.Content>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
