interface StatRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

export function StatRow({ label, value, isLast }: StatRowProps) {
  return (
    <div className={`stat ${isLast ? "" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}