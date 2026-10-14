import { Box } from "./Box";
import { StatRow } from "./StatRow";

const PLAYER_STATS = [
  { label: "Fighting Power", value: "14,379" },
  { label: "Health", value: "11,731 / 11,731" },
  { label: "Mana", value: "5,218 / 11,436" },
  { label: "Damage", value: "2,807~3,125 (+2,927)" },
  { label: "PD", value: "1,178 (+1,168)" },
  { label: "MD", value: "1,611 (+1,597)" },
  { label: "Dodge", value: "12.50%" },
  { label: "Parry", value: "22.95% (+19.95%)" },
  { label: "Critical", value: "21.65% (+18.65%)" },
  { label: "Garrote", value: "32.84% (+29.84%)" },
  { label: "Atk Speed", value: "1,185.00 (-47.00)" },
  { label: "Movement", value: "328 (+38)" },
  { label: "Gear Loss Rate", value: "7.03%" },
];

export function PlayerStats() {
  return (
    <Box title="Player Stats" maxWidth="250px" className="stats">
      {PLAYER_STATS.map((stat, i) => (
        <StatRow key={i} label={stat.label} value={stat.value} isLast={i === PLAYER_STATS.length - 1} />
      ))}
    </Box>
  );
}