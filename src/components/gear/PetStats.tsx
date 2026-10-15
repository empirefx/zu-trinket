import { Box } from "./Box";
import { StatRow } from "./StatRow";
import { usePetStats } from "./usePetStats";

export function PetStats() {
  const stats = usePetStats();

  return (
    <Box title="Pet Stats" maxWidth="250px" className="stats">
      {stats.map((stat, i) => (
        <StatRow key={i} label={stat.label} value={stat.value} isLast={i === 14} />
      ))}
    </Box>
  );
}