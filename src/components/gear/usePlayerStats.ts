import { useMemo } from "react";
import { useBuild } from "./BuildContext";
import { TITLES } from "./titles";

const CLASS_BASE: Record<string, { hp: number; mp: number; patk: number; pdef: number; mdef: number; hit: number; dodge: number; parry: number; crit: number; aspd: number }> = {
  swordsman: { hp: 520, mp: 160, patk: 52, pdef: 28, mdef: 16, hit: 96, dodge: 4, parry: 5, crit: 2, aspd: 100 },
  sunwarrior: { hp: 500, mp: 200, patk: 48, pdef: 26, mdef: 24, hit: 95, dodge: 5, parry: 6, crit: 2.5, aspd: 100 },
  beadfairy: { hp: 420, mp: 350, patk: 32, pdef: 20, mdef: 32, hit: 93, dodge: 7, parry: 3, crit: 3, aspd: 110 },
  moonmaiden: { hp: 400, mp: 380, patk: 35, pdef: 18, mdef: 35, hit: 92, dodge: 8, parry: 2, crit: 4, aspd: 115 },
  summoner: { hp: 440, mp: 320, patk: 30, pdef: 22, mdef: 30, hit: 94, dodge: 6, parry: 3, crit: 2.5, aspd: 105 },
};

const CLASS_GROWTH: Record<string, { hp: number; mp: number; patk: number; pdef: number; mdef: number; hit: number; dodge: number; parry: number; crit: number }> = {
  swordsman: { hp: 14, mp: 4, patk: 2.8, pdef: 1.5, mdef: 0.8, hit: 0.15, dodge: 0.1, parry: 0.12, crit: 0.08 },
  sunwarrior: { hp: 13, mp: 5, patk: 2.5, pdef: 1.4, mdef: 1.2, hit: 0.12, dodge: 0.12, parry: 0.15, crit: 0.1 },
  beadfairy: { hp: 11, mp: 9, patk: 1.5, pdef: 1.1, mdef: 1.8, hit: 0.1, dodge: 0.15, parry: 0.1, crit: 0.12 },
  moonmaiden: { hp: 10, mp: 10, patk: 1.8, pdef: 1, mdef: 2, hit: 0.1, dodge: 0.18, parry: 0.08, crit: 0.15 },
  summoner: { hp: 12, mp: 8, patk: 1.5, pdef: 1.2, mdef: 1.5, hit: 0.12, dodge: 0.12, parry: 0.1, crit: 0.1 },
};

function calc(base: number, growth: number, level: number) {
  return Math.floor(base + growth * (level - 1));
}

export function usePlayerStats() {
  const { classId, level, title } = useBuild();

  const stats = useMemo(() => {
    const base = CLASS_BASE[classId] || CLASS_BASE.swordsman;
    const growth = CLASS_GROWTH[classId] || CLASS_GROWTH.swordsman;
    const mod = TITLES.find((t) => t.name === title);

    const atkMult = 1 + (mod?.attack ?? 0) / 100;
    const defMult = 1 + (mod?.defense ?? 0) / 100;
    const moveMult = 1 + (mod?.move ?? 0) / 100;

    let hp = calc(base.hp, growth.hp, level);
    if (mod) hp = mod.hpPct ? Math.floor(hp * (1 + mod.hp / 100)) : hp + mod.hp;

    const mp = calc(base.mp, growth.mp, level);
    const patk = calc(base.patk, growth.patk, level) * atkMult;
    const pdef = calc(base.pdef, growth.pdef, level) * defMult;
    const mdef = calc(base.mdef, growth.mdef, level) * defMult;
    const dodge = Math.min(50, parseFloat((base.dodge + growth.dodge * (level - 1) + (mod?.dodge ?? 0)).toFixed(2)));
    const parry = Math.min(50, parseFloat((base.parry + growth.parry * (level - 1)).toFixed(2)));
    const crit = Math.min(50, parseFloat((base.crit + growth.crit * (level - 1)).toFixed(2)));
    const move = Math.floor((300 + level * 0.2) * moveMult);
    const lossRate = Math.max(0, 7.03 * (1 - (mod?.drop ?? 0) / 100));

    return [
      { label: "Fighting Power", value: Math.floor((hp + mp + patk * 10 + pdef * 5 + mdef * 5) / 100).toLocaleString() },
      { label: "Health", value: `${hp.toLocaleString()} / ${hp.toLocaleString()}` },
      { label: "Mana", value: `${mp.toLocaleString()} / ${mp.toLocaleString()}` },
      { label: "Damage", value: `${Math.floor(patk * 0.8)}~${Math.floor(patk * 1.2)} (+${Math.floor(patk * 0.5)})` },
      { label: "PD", value: `${Math.floor(pdef).toLocaleString()} (+${Math.floor(pdef * 0.99)})` },
      { label: "MD", value: `${Math.floor(mdef).toLocaleString()} (+${Math.floor(mdef * 0.99)})` },
      { label: "Dodge", value: `${dodge.toFixed(2)}%` },
      { label: "Parry", value: `${parry.toFixed(2)}% (+${(parry * 0.87).toFixed(2)}%)` },
      { label: "Critical", value: `${crit.toFixed(2)}% (+${(crit * 0.86).toFixed(2)}%)` },
      { label: "Garrote", value: `${(crit * 1.5).toFixed(2)}% (+${(crit * 1.37).toFixed(2)}%)` },
      { label: "Atk Speed", value: `${base.aspd}.00 (+0.00)` },
      { label: "Movement", value: `${move} (+${Math.max(0, move - 300)})` },
      { label: "Gear Loss Rate", value: `${lossRate.toFixed(2)}%` },
    ];
  }, [classId, level, title]);

  return stats;
}