import { useEffect, useMemo, useState } from "react";
import { useBuild } from "./BuildContext";
import { loadSkills, loadSkillTreeRefs, resolveDesc, type Skill } from "../../lib/skills";
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
function SkillTip({ skill }: { skill: Skill }) {
  const r0 = skill.ranks[0];
  return (
    <>
      <b>{skill.name}</b>
      {skill.desc ? (
        <div className="tip-body">
          <TipText text={resolveDesc(skill.desc, r0.effect, skill.vals?.[0])} />
        </div>
      ) : (
        <div className="tip-body text-muted">No description in the shipped data.</div>
      )}
      {skill.ranks.length > 1 && (
        <div className="tip-meta">
          {skill.ranks.map((r) => {
            const needLabel = r.need > 0 ? `learn at level ${r.need}` : r.need === 0 ? "free" : "final rank";
            return (
              <div key={r.rank}>
                rank {r.rank + 1} ({needLabel}): {+r.effect.toFixed(1)}
              </div>
            );
          })}
        </div>
      )}
      {skill.ranks.length === 1 && skill.ranks[0].need < 0 && (
        <div className="tip-meta">single skill, no upgrades</div>
      )}
    </>
  );
}

// ---- grouping --------------------------------------------------------------
// Each class skill list splits into three visible panels ("sets", two flex
// columns each get their own background):
//  * the level ladder set (rank-0 'need' < 20): the game's own level 1-12
//    skills, low level
//  * the improved second set (rank 0 need >= 20): Sun Chasing etc, levels 60+
//  * singles that spend TREE skill points (the god calls/shapeshifts whose
//    effect carries the growth id 45xxx..) and the remaining no-upgrade
//    passives/utility singles (traps, heals)
function groupSkills(skills: Skill[], talentRefs: Set<string>): { key: string; title: string; list: Skill[] }[] {
  const ladders = skills.filter((s) => s.ranks.length > 1);
  const starters: Skill[] = [];
  const improved: Skill[] = [];
  for (const sk of ladders) {
    const learn = sk.ranks[0].need;
    // highest 'need' the ladder climbs to (this tier set's last real level)
    const top = Math.max(...sk.ranks.filter((r) => r.need >= 0 && r.need < 2 ** 31).map((r) => r.need));
    if (learn < 20 && top < 20 && sk.ranks[0].need >= 0) starters.push(sk);
    else improved.push(sk);
  }
  const singles = skills.filter((s) => s.ranks.length === 1);
  // tree-gated singles, in the game's own tree order:
  //  * the effect carries the class growth id (45xxx — the god
  //    calls/shapeshifts "Shapeshift to X. Drag it to the skills bar")
  //  * their "Talents N"/"Call God" name plumbing rows
  //  * the name is TAUGHT by a talent desc ("Teaches you Defensive Wall") —
  //    the tree spends points on it
  // Everything else keeps its own active/passive effect ("Mighty Power",
  // "Soul Ward", "Blow"...) and shows in the utility panel
  const tree = singles.filter(
    (s) =>
      (s.ranks[0].effect >= 45000 && s.ranks[0].effect < 52000) ||
      /( Call God| Shapeshift| Talents \d+)$/.test(s.name) ||
      /^(Call God|Shapeshift)/.test(s.name) ||
      /Shapeshift|Drag it to/.test(s.desc) ||
      talentRefs.has(s.name),
  );
  const rest = singles.filter((s) => !tree.includes(s));
  // sort every group by first id so the game's own order shows
  for (const list of [starters, improved, tree, rest]) {
    list.sort((a, b) => a.ranks[0].id - b.ranks[0].id);
  }
  return [
    { key: "starter", title: `Learned levels 1-12`, list: starters },
    { key: "improved", title: `Attack spells`, list: improved },
    { key: "tree", title: `Talent spells`, list: tree },
    { key: "passive", title: `Assistant spells`, list: rest },
  ].filter((g) => g.list.length > 0);
}

export function ClassSkills() {
  const { classId } = useBuild();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [treeRefs, setTreeRefs] = useState<Set<string>>(new Set());

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

  const groups = useMemo(() => groupSkills(skills, treeRefs), [skills, treeRefs]);

  return (
    <div className="sk-panel" data-testid="class-skills">
      {groups.map((g) => (
        <div key={g.key} className={`sk-group sk-group-${g.key}`}>
          <h2>{g.title}</h2>
          <div className="sk-grid">
            {g.list.map((sk, i) => (
              <div key={i} className="sk-tile" tabIndex={0}>
                <div className="sk-icon">
                  <div className={ICON_CLS(sk.icon)} />
                  {!SPRITE_CLASS[(sk.icon ?? "").toUpperCase()] && (
                    <span className="sk-icon-name">{sk.name}</span>
                  )}
                </div>
                <div className="sk-tile-label">{sk.name}</div>
                <div className="hover-tip" role="tooltip">
                  <SkillTip skill={sk} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
