import { useMemo } from "react";
import { useBuild } from "./BuildContext";
import { usePets } from "../../hooks/usePets";
import { petPower, petApt, petTooltip, panelStats, panelSetOf, type Stat, type Aptitudes } from "../../lib/pets";

// The Pet Stats rows (the fitted model of docs/pet-stat-calculations.md,
// all of it (est.)): the owner bonus rows are panelStats (floor(tooltip *
// factor) with the pet's panel set, default A), the tooltip inputs are
// fresh formula(level, aptitudes) + the Pet Bolus roll + the pet-gear
// record stats (atk/pd/md flat; feet speed% on Speed+), and the five
// aptitude rows "cur / max" (cur = the egg range's midpoint). Fighting
// Power stays the game's own formula (pets.ts petPower — exact constants;
// its val input is the est. tooltip with gear, so (est.)).
// Satiation / Intimacy / Health were removed from the box (requirement).
export function usePetStats() {
  const { pet, hasPet } = useBuild();
  const pets = usePets();

  return useMemo(() => {
    const BONUS_ROWS = [
      ["Max HP Bonus", "hp"],
      ["Max MP Bonus", "mp"],
      ["Attack Bonus", "atk"],
      ["PD Bonus", "pd"],
      ["MD Bonus", "md"],
    ] as const;
    const APT_ROWS = [
      "Life Aptitude", "Mana Aptitude", "Attack Apt.", "PD Aptitude", "MD Aptitude",
    ];
    const dash = [{ label: "Fighting Power (est.)", value: "—" },
      ...BONUS_ROWS.map(([l]) => ({ label: l, value: "—" })),
      { label: "Speed+", value: "—" },
      ...APT_ROWS.map((label) => ({ label, value: "—" }))];

    if (!hasPet || !pets || !pet) return dash;

    // Pet gear contributes its record stats to the pet's attack/pd/md and the
    // feet accelerator's speed% (the gear's own values, not an estimate);
    // the *application* is server-side, so the rows keep their (est.) label.
    const gear = Object.values(pet.gear);
    const gearSum = {
      atk: gear.reduce((s, it) => s + (it.atk ?? 0), 0),
      pd: gear.reduce((s, it) => s + (it.pd ?? 0), 0),
      md: gear.reduce((s, it) => s + (it.md ?? 0), 0),
      speed: gear.reduce((s, it) => s + (it.speed ?? 0), 0),
    };
    const speedRow = { label: "Speed+", value: gearSum.speed ? `+${gearSum.speed}%` : "—" };
    const gearAdds = (key: (typeof BONUS_ROWS)[number][1]) =>
      key === "atk" ? gearSum.atk : key === "pd" ? gearSum.pd : key === "md" ? gearSum.md : 0;

    const species = pets.species.find((s) => s.id === pet.speciesId);
    const A = petApt(pet.level, species?.apt ?? null);
    if (!A) {
      // no egg range shipped: the fresh stats (and so the panel) can't be
      // estimated — only the gear adds and Speed+ are real
      if (gearSum.atk + gearSum.pd + gearSum.md + gearSum.speed === 0) return dash;
      return [
        { label: "Fighting Power (est.)", value: "—" },
        ...BONUS_ROWS.map(([label, key]) => ({
          label: `${label} (est.)`,
          value: gearAdds(key) ? gearAdds(key).toLocaleString() : "—",
        })),
        speedRow,
        ...APT_ROWS.map((label) => ({ label, value: "—" })),
      ];
    }

    const [cur, max] = A;
    const apt: Aptitudes = { life: cur, mana: cur, attack: cur, pd: cur, md: cur };
    const { total } = petTooltip(pet.level, apt, {
      gear: { atk: gearSum.atk, pd: gearSum.pd, md: gearSum.md },
    });
    // factor set from the egg kind (Primary/Junior = B, Senior/Other = A)
    const panel = panelStats(total, panelSetOf(species?.eggKind ?? "Other"));
    const power = petPower({
      level: pet.level,
      pot: [cur, cur, cur, cur, cur],
      val: [total.hp, total.mp, total.atk, total.pd, total.md],
      spells: Object.values(pet.spells),
      spellPower: pets.spellPower,
    });
    return [
      { label: "Fighting Power (est.)", value: power.toLocaleString() },
      ...BONUS_ROWS.map(([label, key]) => ({
        label: `${label} (est.)`,
        value: panel[key as Stat] ? panel[key as Stat].toLocaleString() : "—",
      })),
      speedRow,
      ...APT_ROWS.map((label) => ({
        label: `${label} (est.)`,
        value: `${cur.toLocaleString()} / ${max.toLocaleString()}`,
      })),
    ];
  }, [pet, hasPet, pets]);
}
