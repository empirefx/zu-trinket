import { Box } from "./Box";
import { StatRow } from "./StatRow";
import { usePlayerStats } from "./usePlayerStats";

export function PlayerStats() {
  const stats = usePlayerStats();

  return (
    <Box title="Player Stats" maxWidth="250px" className="stats">
      {stats.map((stat, i) => (
        <StatRow key={i} label={stat.label} value={stat.value} isLast={i === 13} />
      ))}
    </Box>
  );
}