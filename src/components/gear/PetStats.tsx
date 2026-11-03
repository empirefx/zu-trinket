import { StatRow } from "./StatRow";
import { usePetStats } from "./usePetStats";
import { useBuild } from "./BuildContext";

export function PetStats() {
  const stats = usePetStats();
  const { hasPet } = useBuild();

  return (
    <div
      className={`flex flex-col gap-2 h-full ${hasPet ? "" : "opacity-40 pointer-events-none grayscale"}`}
    >
      {stats.map((stat, i) => (
        <StatRow key={i} label={stat.label} value={stat.value} />
      ))}
    </div>
  );
}
