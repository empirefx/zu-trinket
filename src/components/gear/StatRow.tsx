// One stat row of the skeleton's StatList: label left, value right.
export function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 items-center justify-between gap-4 rounded-2xl bg-surface-secondary px-4 py-3">
      <span className="text-lg text-muted">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}
