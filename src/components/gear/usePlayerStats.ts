import { useEffect, useMemo, useState } from "react";
import { useBuild } from "./BuildContext";
import { gearTotals } from "./gearSlots";
import { useStar, useSets } from "../../hooks/useItems";
import { usePets } from "../../hooks/usePets";
import { TITLES } from "./generated/titles";
import { CLASS_CURVES } from "./generated/classData";
import { ELEMENT_BIT, ELEMENT_SETS } from "./generated/elementWheel";
import { ATTR_INFO } from "./generated/attrData";
import { loadTalents, passiveStats, type PassiveStats, type ClassTalents } from "../../lib/talents";
import { petOwnerBonus } from "../../lib/pets";
import { iconClass, petIconClass } from "../../lib/icons";

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

// one tooltip line of a stat row: the source's icon (when it has one),
// name, and what it gives — kind drives the Title/Talent/Gear/Pet grouping
export type StatTipKind = "title" | "talent" | "gear" | "sets" | "pet";
export type StatTip = { kind: StatTipKind; name: string; text: string; icon?: string };

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

    // per-row contributor tooltip: every source that moves a row lists
    // itself here (icon when the source has one — name — its own wording),
    // grouped by kind — the tooltip renders Title/Talent/Gear/Sets/Pet
    // sections
    const tips: Record<string, StatTip[]> = {};
    const tip = (row: string, kind: StatTip["kind"], name: string, text: string, icon?: string) =>
      (tips[row] ??= []).push({ kind, name, text, icon });
    // the title: the game's own effect text is what it gives
    if (mod) {
      if (mod.hp) tip("Health", "title", mod.name, mod.effect);
      if (mod.attack) tip("Damage", "title", mod.name, mod.effect);
      if (mod.defense) tip("PD", "title", mod.name, mod.effect);
      if (mod.dodge) tip("Dodge", "title", mod.name, mod.effect);
      if (mod.move) tip("Movement", "title", mod.name, mod.effect);
      if (mod.drop) tip("Gear Loss Rate", "title", mod.name, mod.effect);
    }

    // the baseless bonus rows' labels derive once — the rows and the tips
    // share them (kind 3 → "resistance rate", 1 → "restoration speed of
    // HP", 2 → "restoration speed of MP", 0 → "Rebound damages")
    const kLabel: Record<number, string> = {};
    for (const k of [3, 1, 2, 0])
      kLabel[k] =
        (pets?.spells[k]?.desc ?? FALLBACK_ROW[k])
          .split("$")[0].replace(/^Increases (the )?/, "").trim();

    // the passive stat lines of the learned talent ranks (talents.ts
    // passiveStats): the per-spell talents belong to the Skills tab
    const pas = passiveStats(talents?.[classId], talentRanks, iconClass);
    const ROW_OF_STAT: Record<keyof PassiveStats, string> = {
      hpPct: "Health", atkPct: "Damage", defPct: "PD", dodge: "Dodge",
      garrote: "Garrote", crit: "Critical", parry: "Parry",
      critDmg: "Critical damage", garroteDmg: "Garrote damage", block: "Block",
    };
    for (const en of pas.entries)
      for (const k of Object.keys(en.stats) as (keyof PassiveStats)[])
        tip(ROW_OF_STAT[k], "talent", en.name, en.text, en.icon);

    // the pet's owner bonus: the five panel numbers of the pet tooltip with
    // gear (fIncPropNum, server-sent — the fitted panelStats model here) +
    // the Speed+ % + the Garrote/Critical pet-spell rates (pets.ts)
    const petSpec = hasPet && pets && pet ? pets.species.find((s) => s.id === pet.speciesId) : undefined;
    const b =
      hasPet && pets && pet
        ? petOwnerBonus(pet.level, pet.gear, pet.spells, petSpec, pets.spells)
        : null;
    const petName = petSpec?.name ?? "Pet";
    const petIcon = petIconClass(petSpec?.icon);
    if (b) {
      const fmt = (v: number) => `+${+v.toFixed(2)}%`;
      if (b.hp) tip("Health", "pet", petName, `+${b.hp} Health`, petIcon);
      if (b.mp) tip("Mana", "pet", petName, `+${b.mp} Mana`, petIcon);
      if (b.atk) tip("Damage", "pet", petName, `+${b.atk} Attack`, petIcon);
      if (b.pd) tip("PD", "pet", petName, `+${b.pd} PD`, petIcon);
      if (b.md) tip("MD", "pet", petName, `+${b.md} MD`, petIcon);
      if (b.speedPct) tip("Movement", "pet", petName, `+${b.speedPct}% Speed`, petIcon);
      // the pet spells: 5/6 into the rate rows, 1/2/3/0 into baseless rows
      if (b.spells[5]) tip("Garrote", "pet", pets?.spells[5]?.name ?? "Pet spell", fmt(b.spells[5]), petIconClass(pets?.spells[5]?.icon));
      if (b.spells[6]) tip("Critical", "pet", pets?.spells[6]?.name ?? "Pet spell", fmt(b.spells[6]), petIconClass(pets?.spells[6]?.icon));
      for (const k of [3, 1, 2, 0])
        if (b.spells[k]) tip(kLabel[k], "pet", pets?.spells[k]?.name ?? "Pet spell", fmt(b.spells[k]), petIconClass(pets?.spells[k]?.icon));
    }

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
      const ico = iconClass(e.item.icon);
      const elemRow: Record<string, string> = { atk: "Damage", hp: "Health", pd: "PD", md: "MD" };
      e.item.elems?.[Math.min(e.rank, e.item.elems.length - 1)]?.forEach((base, idx) => {
        if (base == null || !(mask & (1 << idx))) return;
        const st = ELEM_STAT[idx];
        if (!st) return;
        const el = Math.floor(base * (ELEMENT_SETS[String(mask)]?.[ELEM_NAMES[idx]] ?? 1));
        elemAdd[st] += el;
        tip(elemRow[st], "gear", e.item.name, `${ELEM_NAMES[idx]} +${el}`, ico);
      });
      for (const a of e.attrs ?? []) {
        const v = ATTR_INFO[a]?.values ?? [];
        if (a === "Critical") { const x = pct100(v[0]); attr.crit += x; tip("Critical", "gear", e.item.name, `Critical +${+x.toFixed(2)}%`, ico); }
        else if (a === "Garrote") { const x = pct100(v[0]); attr.garrote += x; tip("Garrote", "gear", e.item.name, `Garrote +${+x.toFixed(2)}%`, ico); }
        else if (a === "Dodge") { const x = pct100(v[0]); attr.dodge += x; tip("Dodge", "gear", e.item.name, `Dodge +${+x.toFixed(2)}%`, ico); }
        else if (a === "Resistance") { const x = pct100(v[0]); attr.parry += x; tip("Parry", "gear", e.item.name, `Resistance +${+x.toFixed(2)}%`, ico); }
        else if (a === "Power") {
          for (const [row, key] of [["Garrote", "garrote"], ["Critical", "crit"]] as const) {
            const x = pct100(key === "garrote" ? v[0] : v[1]);
            attr[key] += x; tip(row, "gear", e.item.name, `Power +${+x.toFixed(2)}%`, ico);
          }
        }
        else if (a === "Luck") {
          const p = pct100(v[0]), c = pct100(v[1]), g2 = pct100(v[2]), d = pct100(v[3]);
          attr.parry += p; attr.garrote += c; attr.crit += g2; attr.drop += d;
          tip("Parry", "gear", e.item.name, `Luck +${+p.toFixed(2)}% parry`, ico);
          tip("Garrote", "gear", e.item.name, `Luck +${+c.toFixed(2)}% garrote`, ico);
          tip("Critical", "gear", e.item.name, `Luck +${+g2.toFixed(2)}% critical`, ico);
          tip("Gear Loss Rate", "gear", e.item.name, `Luck −${+d.toFixed(2)}% gear loss`, ico);
        }
        else if (a === "Regeneration") { const x = pct100(v[0]); attr.regen += x; tip(kLabel[1], "gear", e.item.name, `Regeneration +${+x.toFixed(2)}%`, ico); }
        else if (a === "Rejuvenation") { const x = pct100(v[0]); attr.rej += x; tip(kLabel[2], "gear", e.item.name, `Rejuvenation +${+x.toFixed(2)}%`, ico); }
        else if (a === "Resilience") { const x = pct100(v[0]); attr.rebound += x; tip(kLabel[0], "gear", e.item.name, `Resilience +${+x.toFixed(2)}%`, ico); }
        else if (a === "Slice") { const x = pct100(v[0]); attr.atkSpd += x; tip("Atk Speed", "gear", e.item.name, `Attack Speed +${+x.toFixed(2)}%`, ico); }
        else if (a === "swiftness") { attr.move += v[0] ?? 0; tip("Movement", "gear", e.item.name, `Swiftness +${v[0] ?? 0} Movement`, ico); }
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
        if (m) { setAdd.atk += +m[1]; tip("Damage", "sets", set.name, t); }
        const h = /Increases (\d+) Maximum Health/.exec(t);
        if (h) { setAdd.hp += +h[1]; tip("Health", "sets", set.name, t); }
        const d = /Increases (\d+) Physical Defense and (\d+) Magical Defense/.exec(t);
        if (d) { setAdd.pd += +d[1]; setAdd.md += +d[2]; tip("PD", "sets", set.name, t); tip("MD", "sets", set.name, t); }
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
            label: kLabel[k],
            // kind 1/2 also take the Regeneration / Rejuvenation attribute
            // toggles, kind 0 the Resilience reflect toggle
            v:
              (b?.spells[k] ?? 0) +
              (k === 1 ? attr.regen : k === 2 ? attr.rej : k === 0 ? attr.rebound : 0),
          }))
          .filter((x) => x.v > 0)
          .map((x) => ({ label: x.label, value: pct(x.v) })),
        { label: "Atk Speed", value: (curve.atkSpeed * (1 + attr.atkSpd / 100)).toFixed(2) },
        { label: "Movement", value: `${move}${bonus(move - curve.move)}` },
        { label: "Gear Loss Rate", value: `${lossRate.toFixed(2)}%` },
      ],
      tips,
    };
  }, [classId, level, title, gear, star, sets, talentRanks, talents, pets, pet, hasPet]);
}
