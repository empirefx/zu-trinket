import { useMemo } from "react";
import { useBuild } from "./BuildContext";
import { usePets } from "../../hooks/usePets";
import { petStats } from "../../lib/pets";

// The Pet Stats rows: the est. owner bonuses (RACE group-7 curve at the pet
// level scaled by aptitude/maxAptitude), Speed+ (server-side, always "—") and
// the five aptitude rows "cur / max" (cur = the egg range's midpoint).
// Satiation / Intimacy / Health were removed from the box (requirement).
export function usePetStats() {
  const { pet, hasPet } = useBuild();
  const pets = usePets();

  return useMemo(() => {
    const BONUS_ROWS = [
      ["Max HP Bonus", "hpBonus"],
      ["Max MP Bonus", "mpBonus"],
      ["Attack Bonus", "atkBonus"],
      ["PD Bonus", "pdBonus"],
      ["MD Bonus", "mdBonus"],
    ] as const;
    const APT_ROWS = [
      "Life Aptitude", "Mana Aptitude", "Attack Apt.", "PD Aptitude", "MD Aptitude",
    ];
    const dash = [...BONUS_ROWS.map(([l]) => ({ label: l, value: "—" })),
      { label: "Speed+", value: "—" },
      ...APT_ROWS.map((label) => ({ label, value: "—" }))];

    if (!hasPet || !pets || !pet) return dash;

    const species = pets.species.find((s) => s.id === pet.speciesId);
    const st = petStats(pet.level, species?.apt ?? null, pets.curve);
    return [
      ...BONUS_ROWS.map(([label, key]) => ({ label: `${label} (est.)`, value: st[key]?.toLocaleString() ?? "—" })),
      { label: "Speed+", value: "—" }, // the curve's MoveSpeed is a constant; the real bonus is server-side
      ...APT_ROWS.map((label) => ({
        label: `${label} (est.)`,
        value: st.apt ? `${st.apt[0].toLocaleString()} / ${st.apt[1].toLocaleString()}` : "—",
      })),
    ];
  }, [pet, hasPet, pets]);
}
