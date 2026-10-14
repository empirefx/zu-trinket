import { Box } from "./Box";
import { StatRow } from "./StatRow";

const PET_STATS = [
  { label: "Max HP Bonus", value: "+2,284" },
  { label: "Max MP Bonus", value: "+2,441" },
  { label: "Attack Bonus", value: "+1,079" },
  { label: "PD Bonus", value: "+308" },
  { label: "MD Bonus", value: "+411" },
  { label: "Speed+", value: "+93.00%" },
  { label: "Satiation", value: "487 / 1,000" },
  { label: "Intimacy", value: "840 / 1,000" },
  { label: "Health", value: "6,422" },
  { label: "Life Aptitude", value: "2,300 / 2,500" },
  { label: "Mana Aptitude", value: "2,300 / 2,500" },
  { label: "Attack Apt.", value: "2,300 / 2,500" },
  { label: "PD Aptitude", value: "2,300 / 2,500" },
  { label: "MD Aptitude", value: "2,300 / 2,500" },
  { label: "Savvy", value: "8" },
];

export function PetStats() {
  return (
    <Box title="Pet Stats" maxWidth="250px" className="stats">
      {PET_STATS.map((stat, i) => (
        <StatRow key={i} label={stat.label} value={stat.value} isLast={i === PET_STATS.length - 1} />
      ))}
    </Box>
  );
}