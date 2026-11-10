import { useMemo } from "react";
import { useBuild } from "../BuildContext";
import { usePets } from "../../../hooks/usePets";
import { petPower, petApt, petOwnerBonus } from "../../../lib/pets";

// The Pet Stats rows (docs/pet-stat-calculations.md): the owner bonus rows
// are petOwnerBonus (floor(tooltip*factor) with the pet's panel set),
// the tooltip inputs are fresh formula(level, aptitudes) + the pet-gear
// record stats, and the five aptitude rows "cur / max" (cur = the egg
// range's midpoint).  The panel numbers themselves are server-sent
// (fIncPropNum); the pet spells' Garrote/Critical rates flow to the OWNER
// (usePlayerStats shows them).  Fighting Power is the game's own formula
// (pets.ts petPower — exact constants) over the tooltip with gear.
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
    const dash = [{ label: "Fighting Power", value: "—" },
      ...BONUS_ROWS.map(([l]) => ({ label: l, value: "—" })),
      { label: "Speed+", value: "—" },
      ...APT_ROWS.map((label) => ({ label, value: "—" }))];

    if (!hasPet || !pets || !pet) return dash;

    const species = pets.species.find((s) => s.id === pet.speciesId);
    const b = petOwnerBonus(pet.level, pet.gear, pet.spells, species, pets.spells);
    const A = petApt(pet.level, species?.apt ?? null);

    if (b.partial) {
      // no egg range shipped: the panel cannot be estimated — only the pet
      // gear adds and the spell rates are real
      if (!(b.atk + b.pd + b.md + b.speedPct +
            Object.values(b.spells).reduce<number>((s, v) => s + (v ?? 0), 0))) return dash;
      return [
        { label: "Fighting Power", value: "—" },
        ...BONUS_ROWS.map(([label, key]) => ({
          label,
          value: b[key] ? b[key].toLocaleString() : "—",
        })),
        { label: "Speed+", value: b.speedPct ? `+${b.speedPct}%` : "—" },
        ...APT_ROWS.map((label) => ({ label, value: "—" })),
      ];
    }

    // a non-partial bonus implies the egg range shipped, so A is non-null
    const [cur, max] = A!;
    const power = petPower({
      level: pet.level,
      pot: [cur, cur, cur, cur, cur],
      val: [b.total!.hp, b.total!.mp, b.total!.atk, b.total!.pd, b.total!.md],
      spells: Object.values(pet.spells),
      spellPower: pets.spellPower,
    });
    return [
      { label: "Fighting Power", value: power.toLocaleString() },
      ...BONUS_ROWS.map(([label, key]) => ({
        label,
        value: b[key] ? b[key].toLocaleString() : "—",
      })),
      { label: "Speed+", value: b.speedPct ? `+${b.speedPct}%` : "—" },
      ...APT_ROWS.map((label) => ({
        label,
        value: `${cur.toLocaleString()} / ${max.toLocaleString()}`,
      })),
    ];
  }, [pet, hasPet, pets]);
}
