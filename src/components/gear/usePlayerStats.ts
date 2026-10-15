import { useMemo } from "react";
import { useBuild } from "./BuildContext";
import { TITLES } from "./titles";
import { CLASS_CURVES } from "./classData";

const PARRY = 3;
const CRIT = 3;
const GARROTE = 3;
const GEAR_LOSS = 10;

function bonus(n: number) {
  return n > 0 ? ` (+${n})` : "";
}

export function usePlayerStats() {
  const { classId, level, title } = useBuild();

  return useMemo(() => {
    const curve = CLASS_CURVES[classId] ?? CLASS_CURVES.summoner;
    const mod = TITLES.find((t) => t.name === title);
    const lv = Math.min(Math.max(0, level), curve.hp.length - 1);

    const atkMult = 1 + (mod?.attack ?? 0) / 100;
    const defMult = 1 + (mod?.defense ?? 0) / 100;
    const moveMult = 1 + (mod?.move ?? 0) / 100;

    const baseHp = curve.hp[lv];
    let hp = baseHp;
    if (mod) hp = mod.hpPct ? Math.floor(baseHp * (1 + mod.hp / 100)) : baseHp + mod.hp;

    const mp = curve.mp[lv];
    const minAtk = Math.floor(curve.minAtk[lv] * atkMult);
    const maxAtk = Math.floor(curve.maxAtk[lv] * atkMult);
    const dmgBonus = Math.floor(curve.minAtk[lv] * (atkMult - 1));

    const pd = Math.floor(curve.pd[lv] * defMult);
    const md = Math.floor(curve.md[lv] * defMult);
    const defBonus = Math.floor(curve.pd[lv] * (defMult - 1));

    const dodge = Math.min(50, +(curve.dodge + (mod?.dodge ?? 0)).toFixed(2));
    const move = Math.floor(curve.move * moveMult);
    const lossRate = Math.max(0, +(GEAR_LOSS * (1 - (mod?.drop ?? 0) / 100)).toFixed(2));

    // Fighting Power. Engine-side (SC_GetCharTotalPower); weights fitted to four
    // live level-0 characters (Sun Warrior 68, Swordsman 59, Bead Fairy 59,
    // Summoner 67) - all four match. ponytail: approximation, refine when more
    // level-0 samples (esp. Moonmaiden) are available.
    const power = Math.round(0.26 * hp + 0.093 * mp + 0.92 * dodge + 6.5);

    return [
      { label: "Fighting Power", value: power.toLocaleString() },
      { label: "Health", value: `${hp} / ${hp}` },
      { label: "Mana", value: `${mp} / ${mp}` },
      { label: "Damage", value: `${minAtk}~${maxAtk}${bonus(dmgBonus)}` },
      { label: "PD", value: `${pd}${bonus(defBonus)}` },
      { label: "MD", value: `${md}${bonus(defBonus)}` },
      { label: "Dodge", value: `${dodge.toFixed(2)}%` },
      { label: "Parry", value: `${PARRY.toFixed(2)}%` },
      { label: "Critical", value: `${CRIT.toFixed(2)}%` },
      { label: "Garrote", value: `${GARROTE.toFixed(2)}%` },
      { label: "Atk Speed", value: `${curve.atkSpeed}.00` },
      { label: "Movement", value: `${move}${bonus(move - curve.move)}` },
      { label: "Gear Loss Rate", value: `${lossRate.toFixed(2)}%` },
    ];
  }, [classId, level, title]);
}
