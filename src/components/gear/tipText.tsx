// The talent/skill tooltip body is the game's own prose ("Increases damage of
// Frost Shot, Flame Shot and Thunder Shot spells by 7%" / "Learn skills:
// SS.Thunder Chasing, ..."). Highlight what matters:
// - numbers/percentages (gold, larger),
// - skill/stat names (blue): an "SS.<name>" class-skill reference, a run of
//   2+ capitalised words ("Frost Shot", "Critical Strike Damage"), a single
//   capitalised word standing right before spells/skill/chance/power/speed/
//   strike, standing stat words (Garrote, Dodge, Parry, Health, ...) and the
//   lowercase stat phrases ("attack speed", "critical strike", "max health")
import type { ReactNode } from "react";

const TIP_RE =
  /\d+(?:\.\d+)?%(?:s\b)?|\d+(?:,\d{3})+|\b\d+(?:\.\d+)?(?:\s*sec\b)?|\bSS\.[A-Za-z'-]+(?:\s+[A-Z][A-Za-z'-]+)*|[A-Z][A-Za-z'-]+(?:\s+[A-Z][A-Za-z'-]+)+|[A-Z][A-Za-z'-]+(?=\s+(?:spell|spells|skill|chance|power|speed|strike)\b)|\b(?:Garrote|Dodge|Parry|Health|Mana|Defense|Stamina|Accuracy)\b|\b(?:attack|critical|movement)\s+speed\b|\bcritical\s+strike\b|\bmaximum\s+health\b/g;

export function TipText({ text }: { text: string }) {
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
