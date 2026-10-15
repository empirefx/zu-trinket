import { useMemo } from "react";
import { useBuild } from "./BuildContext";

const LABELS = [
  "Max HP Bonus", "Max MP Bonus", "Attack Bonus", "PD Bonus", "MD Bonus",
  "Speed+", "Satiation", "Intimacy", "Health", "Life Aptitude",
  "Mana Aptitude", "Attack Apt.", "PD Aptitude", "MD Aptitude", "Savvy",
];

export function usePetStats() {
  const { level, hasPet } = useBuild();

  const stats = useMemo(() => {
    if (!hasPet) return LABELS.map((label) => ({ label, value: "—" }));

    // Pet stats scale with player level
    const hpBonus = Math.floor(2284 * (level / 139));
    const mpBonus = Math.floor(2441 * (level / 139));
    const atkBonus = Math.floor(1079 * (level / 139));
    const pdBonus = Math.floor(308 * (level / 139));
    const mdBonus = Math.floor(411 * (level / 139));
    const speed = parseFloat((93 * (level / 139)).toFixed(2));
    const satiation = Math.min(1000, Math.floor(487 * (level / 139)));
    const intimacy = Math.min(1000, Math.floor(840 * (level / 139)));
    const health = Math.floor(6422 * (level / 139));

    return [
      { label: "Max HP Bonus", value: `+${hpBonus.toLocaleString()}` },
      { label: "Max MP Bonus", value: `+${mpBonus.toLocaleString()}` },
      { label: "Attack Bonus", value: `+${atkBonus.toLocaleString()}` },
      { label: "PD Bonus", value: `+${pdBonus.toLocaleString()}` },
      { label: "MD Bonus", value: `+${mdBonus.toLocaleString()}` },
      { label: "Speed+", value: `+${speed.toFixed(2)}%` },
      { label: "Satiation", value: `${satiation} / 1,000` },
      { label: "Intimacy", value: `${intimacy} / 1,000` },
      { label: "Health", value: health.toLocaleString() },
      { label: "Life Aptitude", value: "2,300 / 2,500" },
      { label: "Mana Aptitude", value: "2,300 / 2,500" },
      { label: "Attack Apt.", value: "2,300 / 2,500" },
      { label: "PD Aptitude", value: "2,300 / 2,500" },
      { label: "MD Aptitude", value: "2,300 / 2,500" },
      { label: "Savvy", value: "8" },
    ];
  }, [level, hasPet]);

  return stats;
}