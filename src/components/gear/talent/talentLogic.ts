import type { TalentNode, TalentTree } from "../../../lib/talents";

// The learned ranks: a node's id -> the rank that is learned (0 = not learned)
export type TalentRanks = Record<number, number>;

export type NodeState = {
  node: TalentNode;
  // the learned rank (0 = not learned)
  rank: number;
  // a point can be spent on it right now
  learnable: boolean;
  // greyed out: it cannot be learned at all (and nothing was spent on it)
  locked: boolean;
  // every rank of it is learned
  maxed: boolean;
  // why it cannot be learned yet (empty when it can)
  reason: string;
};

// The game's own rules (zu-re/docs/talents.md):
//  - a node opens when the points **already spent in its tree** reach its
//    PointNeed (0/10/.../70),
//  - a node with a prerequisite needs that talent learned,
//  - every rank of a node costs one point,
//  - the points spent in a tree only ever grow, so a learned node stays open.
export function nodeStates(
  tree: TalentTree,
  ranks: TalentRanks,
  spent: number,
  free: number,
): NodeState[] {
  return tree.nodes.map((node) => {
    const rank = ranks[node.id] ?? 0;
    const state = { node, rank, learnable: false, locked: false, maxed: false, reason: "" };
    if (rank >= node.maxRank) return { ...state, maxed: true, reason: "maxed out" };
    if (spent < node.pointNeed) {
      return { ...state, locked: rank === 0, reason: `needs ${node.pointNeed} points in this tree` };
    }
    if (node.needNode && (ranks[node.needNode] ?? 0) < node.needRank) {
      return { ...state, locked: rank === 0, reason: "needs another talent first" };
    }
    // out of points: a node that already has points spent on it keeps its
    // look (it is only not raisable), the untouched ones stay greyed out
    if (free <= 0) return { ...state, locked: rank === 0, reason: "no talent points left" };
    return { ...state, learnable: true };
  });
}
