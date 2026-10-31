import { Box } from "./Box";
import { StatRow } from "./StatRow";
import { usePetStats } from "./usePetStats";
import { useBuild } from "./BuildContext";

export function PetStats() {
  const stats = usePetStats();
  const { hasPet } = useBuild();

  return (
    <Box title="Pet Stats" maxWidth="250px" className="stats" dimmed={!hasPet}>
      {stats.map((stat, i) => (
        <StatRow key={i} label={stat.label} value={stat.value} isLast={i === stats.length - 1} />
      ))}
    </Box>
  );
}
