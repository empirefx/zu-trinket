import { useEffect, useMemo, useState } from "react";
import { useBuild } from "./BuildContext";
import {
  loadSkills,
  loadSkillTreeRefs,
  metRank,
  resolveDesc,
  type Skill,
  type SkillRank,
} from "../../lib/skills";
import { loadTalents, taughtBy, type ClassTalents } from "../../lib/talents";
import { SPRITE_CLASS } from "./gearSprites";
import { TipText } from "./tipText";

// the skill icons live in the per-class gear sheets (zs-JX, ...); the sprite
// draws on its own layer inside the tile container
const ICON_CLS = (iconName: string | null): string =>
  iconName ? "gear-icon zs " + (SPRITE_CLASS[iconName.toUpperCase()] ?? "") : "";

// The rank texts can bake the rank number into the words, but only ranks 0..2
// keep the plain wording: the shipped desc per rank record is not cut short at
// rank 3 because Effect 104 Kind 2 Vary the private text record carries both
// a level and a rank; the desc does too, but the per-rank text is unchanged
// (see the shipped data: th "of X V" tier appears inside the name, not here).
//
// rankIdx is the rank the character's level has reached: the level groups
// describe only that rank, with that rank's own numbers ("updated"), instead
// of listing the whole ladder; null = the tree spells, whose gate is a talent
// point and not a level, so they keep the full ladder.  A level that reaches
// no rank yet describes the first one - its requirement is what the greyed
// out tile is waiting for.
function SkillTip({ skill, rankIdx }: { skill: Skill; rankIdx: number | null }) {
  const i = rankIdx === null ? 0 : Math.max(rankIdx, 0);
  const r = skill.ranks[i];
  const line = (x: SkillRank) => {
    const needLabel = x.need > 0 ? `learn at level ${x.need}` : x.need === 0 ? "free" : "final rank";
    return (
      <div key={x.rank}>
        rank {x.rank + 1} ({needLabel}): {+x.effect.toFixed(1)}
      </div>
    );
  };
  return (
    <>
      <b>{skill.name}</b>
      {skill.desc ? (
        <div className="tip-body">
          <TipText text={resolveDesc(skill.desc, r.effect, skill.vals?.[i])} />
        </div>
      ) : (
        <div className="tip-body text-muted">No description in the shipped data.</div>
      )}
      {skill.ranks.length > 1 && (
        <div className="tip-meta">{rankIdx === null ? skill.ranks.map(line) : line(r)}</div>
      )}
      {skill.ranks.length === 1 && (
        <div className="tip-meta">{r.need < 0 ? "single skill, no upgrades" : line(r)}</div>
      )}
    </>
  );
}

// ---- grouping --------------------------------------------------------------
// Three visible panels ("sets", two flex columns each get their own
// background):
//  * the rank ladders the tree does not own: Sword Shadow, Sun Chasing,
//    Thunder Shot ... — gated by the character level
//  * the TREE spells (the god calls/shapeshifts whose effect carries the growth
//    id 45xxx.., plus every name the shipped tree list spends points on) —
//    gated by a talent point
//  * the remaining no-upgrade passives/utility singles (traps, heals)

// a spell the talent tree spends its points on:
//  * the effect carries the class growth id (45xxx — the god
//    calls/shapeshifts "Shapeshift to X. Drag it to the skills bar")
//  * the name is plumbing ("Talents N"/"Call God"/"Shapeshift ...")
//  * the desc teaches the mechanic ("Shapeshift to X", "Drag it to...")
//  * the name is TAUGHT by a talent desc ("Teaches you Defensive Wall") —
//    the shipped tree list (talentRefs.json) holds those names
// It runs over every skill, not just the single-row ones: the game ships a
// talent spell as a rank ladder too (Immobilize, the Formations), and those
// must not fall into the level group.
function isTalentSpell(sk: Skill, talentRefs: Set<string>): boolean {
  return (
    (sk.ranks[0].effect >= 45000 && sk.ranks[0].effect < 52000) ||
    /( Call God| Shapeshift| Talents \d+)$/.test(sk.name) ||
    /^(Call God|Shapeshift)/.test(sk.name) ||
    /Shapeshift|Drag it to/.test(sk.desc) ||
    talentRefs.has(sk.name)
  );
}

function groupSkills(skills: Skill[], talentRefs: Set<string>): { key: string; title: string; list: Skill[] }[] {
  const tree = skills.filter((s) => isTalentSpell(s, talentRefs));
  const ladders = skills.filter((s) => s.ranks.length > 1 && !tree.includes(s));
  // everything that is not a tree spell and not a ladder keeps its own
  // active/passive effect ("Mighty Power", "Soul Ward", "Blow"...) and shows
  // in the utility panel
  const rest = skills.filter((s) => s.ranks.length === 1 && !tree.includes(s));
  // sort every group by first id so the game's own order shows
  for (const list of [ladders, tree, rest]) {
    list.sort((a, b) => a.ranks[0].id - b.ranks[0].id);
  }
  return [
    { key: "improved", title: `Attack spells`, list: ladders },
    { key: "tree", title: `Talent spells`, list: tree },
    { key: "passive", title: `Assistant spells`, list: rest },
  ].filter((g) => g.list.length > 0);
}

export function ClassSkills() {
  const { classId, level, talentRanks } = useBuild();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [treeRefs, setTreeRefs] = useState<Set<string>>(new Set());
  const [talents, setTalents] = useState<Record<string, ClassTalents>>({});

  useEffect(() => {
    // lazy, cached load of the class-skill table + the talent desc reference
    // names ("Teaches you X" / "SS.X") that mark a single as tree-gated
    let gone = false;
    loadSkills().then((all) => {
      if (!gone) setSkills(all.filter((s) => s.class === classId));
    });
    loadSkillTreeRefs().then((refs) => {
      if (!gone) setTreeRefs(refs);
    });
    return () => {
      gone = true;
    };
  }, [classId]);

  useEffect(() => {
    // the trees that gate the Talent spells (cached like the skill table)
    let gone = false;
    loadTalents().then((t) => {
      if (!gone) setTalents(t);
    });
    return () => {
      gone = true;
    };
  }, []);

  const groups = useMemo(() => groupSkills(skills, treeRefs), [skills, treeRefs]);
  // the talent node that grants each tree spell (name -> node id)
  const grants = useMemo(() => taughtBy(talents[classId]), [talents, classId]);

  return (
    <div className="sk-panel" data-testid="class-skills">
      {groups.map((g) => (
        <div key={g.key} className={`sk-group sk-group-${g.key}`}>
          <h2>{g.title}</h2>
          <div className="sk-grid">
            {g.list.map((sk, i) => {
              // the tree spells open with a talent point, every other group
              // with a character level (rankIdx = the rank that level reached)
              const rankIdx = g.key === "tree" ? null : metRank(sk, level);
              const nodeId = g.key === "tree" ? grants.get(sk.name) : undefined;
              const locked =
                g.key === "tree"
                  ? nodeId !== undefined && (talentRanks[nodeId] ?? 0) === 0
                  : (rankIdx ?? -1) < 0;
              return (
                <div key={i} className={"sk-tile" + (locked ? " sk-locked" : "")} tabIndex={0}>
                  <div className="sk-icon">
                    <div className={ICON_CLS(sk.icon)} />
                    {!SPRITE_CLASS[(sk.icon ?? "").toUpperCase()] && (
                      <span className="sk-icon-name">{sk.name}</span>
                    )}
                  </div>
                  <div className="sk-tile-label">{sk.name}</div>
                  <div className="hover-tip" role="tooltip">
                    <SkillTip skill={sk} rankIdx={rankIdx} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
