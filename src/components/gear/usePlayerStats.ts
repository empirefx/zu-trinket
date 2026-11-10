import { useEffect, useMemo, useState } from "react";
import { useBuild } from "./BuildContext";
import { gearTotals } from "./gearSlots";
import { useStar, useSets } from "../../hooks/useItems";
import { usePets } from "../../hooks/usePets";
import { TITLES } from "./generated/titles";
import { CLASS_CURVES } from "./generated/classData";
import { ELEMENT_BIT, ELEMENT_SETS } from "./generated/elementWheel";
import { ATTR_INFO } from "./generated/attrData";
import { loadTalents, passiveStats, type ClassTalents } from "../../lib/talents";
import { petOwnerBonus } from "../../lib/pets";

const PARRY = 3;
const CRIT = 3;
const GARROTE = 3;
const GEAR_LOSS = 10;

// row labels when pets.json has not loaded yet — the spell descriptions
// themselves (usePlayerStats derives the display label from them)
const FALLBACK_ROW: Record<number, string> = {
  3: "Increases resistance rate $$_a",
  1: "Increases the restoration speed of HP $$_a",
  2: "Increases the restoration speed of MP $$_a",
  0: "Rebound damages $$_a",
};

function bonus(n: number) {
  return n > 0 ? ` (+${n})` : "";
}

export function usePlayerStats() {
  const { classId, level, title, gear, talentRanks, pet, hasPet } = useBuild();
  const star = useStar();
  const sets = useSets();
  const pets = usePets();
  const [talents, setTalents] = useState<Record<string, ClassTalents> | null>(null);
  useEffect(() => {
    let on = true;
    loadTalents().then((t) => {
      if (on) setTalents(t);
    });
    return () => {
      on = false;
    };
  }, []);

  return useMemo(() => {
    const curve = CLASS_CURVES[classId] ?? CLASS_CURVES.summoner;
    const mod = TITLES.find((t) => t.name === title);
    const lv = Math.min(Math.max(0, level), curve.hp.length - 1);

    // the passive stat lines of the learned talent ranks (talents.ts
    // passiveStats): the per-spell talents belong to the Skills tab
    const pas = passiveStats(talents?.[classId], talentRanks);
    // the pet's owner bonus: the five panel numbers of the pet tooltip with
    // gear (fIncPropNum, server-sent — the fitted panelStats model here) +
    // the Speed+ % + the Garrote/Critical pet-spell rates (pets.ts)
    const b =
      hasPet && pets && pet
        ? petOwnerBonus(
            pet.level,
            pet.gear,
            pet.spells,
            pets.species.find((s) => s.id === pet.speciesId),
            pets.spells,
          )
        : null;

    // titles and talent % compose multiplicatively; the pet's flats add on
    // top (the game's own order of application is server-side)
    const atkMult = (1 + (mod?.attack ?? 0) / 100) * (1 + pas.atkPct / 100);
    const defMult = (1 + (mod?.defense ?? 0) / 100) * (1 + pas.defPct / 100);
    const moveMult = (1 + (mod?.move ?? 0) / 100) * (1 + (b?.speedPct ?? 0) / 100);

    // race-base values, before title/talent % and before gear+pet
    const baseHp = curve.hp[lv];
    const baseMin = curve.minAtk[lv];
    const baseMax = curve.maxAtk[lv];
    const basePd = curve.pd[lv];
    const baseMd = curve.md[lv];

    const g = gearTotals(gear, star ?? {});

    // The toggled *five elements*: the item's own element value (ITEMS +376,
    // per rank) x the active set's multiplier (elementNumbers' rule), folded
    // into the stat the element raises — Metal attack power, Wood max
    // health, Water MD, Earth PD (Fire is shapeshift duration, no row).
    const elemAdd = { hp: 0, atk: 0, pd: 0, md: 0 };
    // The toggled *potential attributes*: the game's own percentages from
    // ATTR_INFO (attrData.ts) — the same rows the pet spells fold into.
    // Combat-proc attributes (Berserk, Corruption, Rip, Slow, Stun,
    // Protection, Restoration) are not sheet stats and stay out.
    const attr = { crit: 0, garrote: 0, parry: 0, dodge: 0, regen: 0, rej: 0, rebound: 0, atkSpd: 0, move: 0, drop: 0 };
    // Set bonuses of the worn pieces: parsed out of the game's own bonus
    // text (sets.json). Attack Power / Maximum Health / PD+MD move rows; the
    // garrote/critical *resistance* texts have no stat row and are skipped.
    const setAdd = { hp: 0, atk: 0, pd: 0, md: 0 };
    const ELEM_NAMES = ["Metal", "Wood", "Water", "Fire", "Earth"];
    const ELEM_STAT: ("atk" | "hp" | "pd" | "md" | null)[] = ["atk", "hp", "md", null, "pd"];
    const pct100 = (v: number | undefined) => (v ?? 0) * 100;
    for (const e of Object.values(gear)) {
      let mask = 0;
      for (const n of e.elements ?? []) mask |= ELEMENT_BIT[n] ?? 0;
      e.item.elems?.[Math.min(e.rank, e.item.elems.length - 1)]?.forEach((base, idx) => {
        if (base == null || !(mask & (1 << idx))) return;
        const st = ELEM_STAT[idx];
        if (!st) return;
        elemAdd[st] += Math.floor(base * (ELEMENT_SETS[String(mask)]?.[ELEM_NAMES[idx]] ?? 1));
      });
      for (const a of e.attrs ?? []) {
        const v = ATTR_INFO[a]?.values ?? [];
        if (a === "Critical") attr.crit += pct100(v[0]);
        else if (a === "Garrote") attr.garrote += pct100(v[0]);
        else if (a === "Dodge") attr.dodge += pct100(v[0]);
        else if (a === "Resistance") attr.parry += pct100(v[0]);
        else if (a === "Power") { attr.garrote += pct100(v[0]); attr.crit += pct100(v[1]); }
        else if (a === "Luck") { attr.parry += pct100(v[0]); attr.garrote += pct100(v[1]); attr.crit += pct100(v[2]); attr.drop += pct100(v[3]); }
        else if (a === "Regeneration") attr.regen += pct100(v[0]);
        else if (a === "Rejuvenation") attr.rej += pct100(v[0]);
        else if (a === "Resilience") attr.rebound += pct100(v[0]);
        else if (a === "Slice") attr.atkSpd += pct100(v[0]);
        else if (a === "swiftness") attr.move += v[0] ?? 0; // flat, not a %
      }
    }
    const counts: Record<number, number> = {};
    for (const e of Object.values(gear)) if (e.item.setId) counts[e.item.setId] = (counts[e.item.setId] ?? 0) + 1;
    for (const [id, n] of Object.entries(counts)) {
      const set = sets?.[id];
      if (!set) continue;
      for (let k = 2; k <= Math.min(n, 8); k++) {
        const t = set.bonuses[String(k)];
        if (!t) continue;
        const m = /Increases (\d+) Attack Power/.exec(t);
        if (m) setAdd.atk += +m[1];
        const h = /Increases (\d+) Maximum Health/.exec(t);
        if (h) setAdd.hp += +h[1];
        const d = /Increases (\d+) Physical Defense and (\d+) Magical Defense/.exec(t);
        if (d) { setAdd.pd += +d[1]; setAdd.md += +d[2]; }
      }
    }

    let hp = baseHp;
    if (mod) hp = mod.hpPct ? Math.floor(baseHp * (1 + mod.hp / 100)) : baseHp + mod.hp;
    if (pas.hpPct) hp = Math.floor(hp * (1 + pas.hpPct / 100));
    if (b) hp += b.hp;
    hp += elemAdd.hp + setAdd.hp;

    const atkFlat = elemAdd.atk + setAdd.atk + (b?.atk ?? 0);
    const mp = curve.mp[lv] + (b?.mp ?? 0);
    const minAtk = Math.floor((baseMin + g.atkMin) * atkMult) + atkFlat;
    const maxAtk = Math.floor((baseMax + g.atkMax) * atkMult) + atkFlat;
    const pd = Math.floor((basePd + g.phys) * defMult) + elemAdd.pd + setAdd.pd + (b?.pd ?? 0);
    const md = Math.floor((baseMd + g.mag) * defMult) + elemAdd.md + setAdd.md + (b?.md ?? 0);

    // HUD_PROPERTY.LUA: Damage bonus = avg of the min/max deltas vs race base
    // (gear, titles, talents and the pet all flow into the same delta).
    const dmgBonus = Math.floor((minAtk - baseMin + (maxAtk - baseMax)) / 2);
    const pdBonus = pd - basePd;
    const mdBonus = md - baseMd;

    const dodge = Math.min(50, curve.dodge + (mod?.dodge ?? 0) + pas.dodge + attr.dodge);
    const move = Math.floor(curve.move * moveMult) + attr.move;
    const lossRate = Math.max(
      0,
      +(GEAR_LOSS * (1 - ((mod?.drop ?? 0) + attr.drop) / 100)).toFixed(2),
    );

    // Fighting Power. The game computes it on the SERVER: the client only
    // reads char+0x3e5b1, which the character-property packet fills in
    // (client.lto, SC_GetCharTotalPower / the packet handler).  This is the
    // estimate fitted to four live level-0 characters (Sun Warrior 68,
    // Swordsman 59, Bead Fairy 59, Summoner 67) - all four match - applied
    // over the row values above (gear, titles, talents and the pet move it).
    const power = Math.round(0.26 * hp + 0.093 * mp + 0.92 * dodge + 6.5);

    // pct rows: +N% with 2 decimals, trailing zeros dropped (+10, +7.7)
    const pct = (v: number) => `+${+v.toFixed(2)}%`;

    return {
      rows: [
        { label: "Fighting Power", value: power.toLocaleString() },
        { label: "Health", value: `${hp} / ${hp}` },
        { label: "Mana", value: `${mp} / ${mp}` },
        { label: "Damage", value: `${minAtk}~${maxAtk}${bonus(dmgBonus)}` },
        { label: "PD", value: `${pd}${bonus(pdBonus)}` },
        { label: "MD", value: `${md}${bonus(mdBonus)}` },
        { label: "Dodge", value: `${Math.min(50, dodge).toFixed(2)}%` },
        { label: "Parry", value: `${(PARRY + pas.parry + attr.parry).toFixed(2)}%` },
        // no talent ships a block base - the row only exists as a bonus
        ...(pas.block ? [{ label: "Block", value: pct(pas.block) }] : []),
        { label: "Critical", value: `${(CRIT + pas.crit + (b?.spells[6] ?? 0) + attr.crit).toFixed(2)}%` },
        ...(pas.critDmg ? [{ label: "Critical damage", value: pct(pas.critDmg) }] : []),
        { label: "Garrote", value: `${(GARROTE + pas.garrote + (b?.spells[5] ?? 0) + attr.garrote).toFixed(2)}%` },
        ...(pas.garroteDmg ? [{ label: "Garrote damage", value: pct(pas.garroteDmg) }] : []),
        // the pet spells with no stat row, same rule as the baseless talent
        // rows: visible only while a spell of the kind is assigned (or an
        // attribute raises the row); the label is the spell's own description
        // (kind 4 Ride Speed and 7 Store Up are ignored, 5 Garrote / 6
        // Critical fold into the rows above)
        ...[3, 1, 2, 0]
          .map((k) => ({
            k,
            // kind 1/2 also take the Regeneration / Rejuvenation attribute
            // toggles, kind 0 the Resilience reflect toggle
            v:
              (b?.spells[k] ?? 0) +
              (k === 1 ? attr.regen : k === 2 ? attr.rej : k === 0 ? attr.rebound : 0),
          }))
          .filter((x) => x.v > 0)
          .map((x) => ({
            // e.g. "Increases the restoration speed of HP $$_a" →
            // "restoration speed of HP" (fallback wording for the first
            // frame while pets.json loads)
            label:
              (pets?.spells[x.k]?.desc ?? FALLBACK_ROW[x.k])
                .split("$")[0].replace(/^Increases (the )?/, "").trim(),
            value: pct(x.v),
          })),
        { label: "Atk Speed", value: (curve.atkSpeed * (1 + attr.atkSpd / 100)).toFixed(2) },
        { label: "Movement", value: `${move}${bonus(move - curve.move)}` },
        { label: "Gear Loss Rate", value: `${lossRate.toFixed(2)}%` },
      ],
    };
  }, [classId, level, title, gear, star, sets, talentRanks, talents, pets, pet, hasPet]);
}
