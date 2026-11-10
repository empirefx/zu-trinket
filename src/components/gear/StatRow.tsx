// One stat row of the skeleton's StatList: label left, value right.
// tip = the sources that move the row — grouped into Title/Talents/Gear/Pet
// sections in the shared .hover-tip style on hover.
type StatTipData = { kind: string; name: string; text: string; icon?: string };

const KIND_ORDER = ["title", "talent", "gear", "sets", "pet"];
const KIND_NAME: Record<string, string> = {
  title: "Title", talent: "Talents", gear: "Gear", sets: "Sets", pet: "Pet",
};

export function StatRow({
  label,
  value,
  tip,
}: {
  label: string;
  value: string;
  tip?: StatTipData[];
}) {
  return (
    <div
      className="stat-row flex flex-1 items-center justify-between gap-4 rounded-2xl bg-surface-secondary px-4 py-3"
      tabIndex={tip?.length ? 0 : undefined}
    >
      <span className="text-lg text-muted capitalize">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
      {tip?.length ? (
        <div className="hover-tip" role="tooltip">
          {/*<div className="tip-stat-name">{label}</div>*/}
          {KIND_ORDER.map((k) => {
            const list = tip.filter((t) => t.kind === k);
            if (!list.length) return null;
            return (
              <div className="stat-type-row" key={k}>
                <div className="stat-tip-kind">{KIND_NAME[k]}</div>
                {list.map((t, i) => (
                  <div key={i} className="stat-tip-row">
                    {t.icon ? <span className={"gear-icon zs " + t.icon} /> : null}
                    <span className="stat-tip-src">{t.name}</span>
                    <span className="stat-tip-text">{t.text}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
