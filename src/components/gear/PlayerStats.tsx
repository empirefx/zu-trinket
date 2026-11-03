import { StatRow } from "./StatRow";
import { usePlayerStats } from "./usePlayerStats";

export function PlayerStats() {
  const stats = usePlayerStats();

  return (
    <div className="flex flex-col gap-2 h-full">
      {stats.map((stat, i) => (
        <StatRow key={i} label={stat.label} value={stat.value} />
      ))}
    </div>
  );
}
