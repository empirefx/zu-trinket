import { StatRow } from "./StatRow";
import { usePlayerStats } from "./usePlayerStats";

export function PlayerStats() {
  const { rows } = usePlayerStats();

  return (
    <div className="flex flex-col gap-2 h-full">
      {rows.map((stat, i) => (
        <StatRow key={i} label={stat.label} value={stat.value} />
      ))}
    </div>
  );
}
