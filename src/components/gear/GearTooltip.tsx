import { useStar, useSets } from "../../hooks/useItems";
import { useBuild } from "./BuildContext";
import { elementNumbers, CLASS_NAMES, TIER_LABEL, statLineText, damageLineText } from "./gearSlots";
import { ATTR_INFO } from "./generated/attrData";
import { ELEMENT_WHEEL, ELEMENT_BIT } from "./generated/elementWheel";
import { enhancePct, type EquipEntry } from "../../lib/items";
import { glyph, glyphColor, ATTR_KEY } from "./GearDrawer";

const ELEMENTS: [string, number][] = [
  ["Metal", 1],
  ["Wood", 2],
  ["Water", 4],
  ["Fire", 8],
  ["Earth", 16],
];

function swingSpan(s: string, i: number) {
  const m = /^(<)(\w+)([+-]\d+)(>)$/.exec(s);
  if (!m) return <span key={i}>{s}</span>;
  return (
    <span key={i}>
      {m[1]}
      {m[2]}
      <span className={m[3][0] === "+" ? "g" : "r"}>{m[3]}</span>
      {m[4]}
    </span>
  );
}

export function GearTooltip({ entry }: { entry: EquipEntry }) {
  const star = useStar();
  const sets = useSets();
  const { gear } = useBuild();
  const { item, enhance } = entry;

  const rank = Math.min(entry.rank, Math.max((item.ranks?.length ?? 1) - 1, 0));
  const rk = item.ranks[rank] ?? [item.atkMin, item.atkMax, item.phys, item.mag];
  const hasAttack = !!(rk[0] || rk[1]);   // mirror of the drawer's branch
  const ds = entry.darksteel ?? {};
  const maxEnh = star?.[String(item.starGroup)] ? star[String(item.starGroup)].length - 1 : 30;
  // the band of the LAST earned glyph — keying off `enhance` itself left the
  // range empty at exactly 10/20 (ten stars or ten moons rendered nothing)
  const bandStart = enhance - 1 < 10 ? 0 : enhance - 1 < 20 ? 10 : 20;
  const bandEnd = Math.min(enhance, maxEnh + 1);
  const req = item.reqLevels?.[rank] ?? item.reqLevel;

  const activeElems = entry.elements ?? [];
  const activeMask = ELEMENTS.reduce((m, [k, bit]) => m | (activeElems.includes(k) ? bit : 0), 0);
  // raw enhance curve fraction (0.112 = +11.2 %); 0 under SSR (star not loaded)
  const enchantFrac = enhancePct(star ?? {}, item.starGroup, enhance);

  const set = sets && item.setId ? sets[String(item.setId)] : undefined;
  const setKeys = set ? Object.keys(set.bonuses).map(Number).sort((a, b) => a - b) : [];
  const worn = set ? Object.values(gear).filter((e) => e.item.setId === item.setId).length : 0;
  const maxTier = setKeys.length ? Math.max(...setKeys) : 0;

  const intro = [
    `${CLASS_NAMES[item.class] ?? item.class}'s`,
    "level",
    String(item.tier),
    item.grade && item.grade !== "common" ? item.grade[0].toUpperCase() + item.grade.slice(1) : "",
    item.slot ? item.slot[0].toUpperCase() + item.slot.slice(1) : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="item-tip">
      <p className="center o" style={{ fontSize: 14 }}>
        {item.names?.[rank] || item.name}
      </p>
      {enhance > 0 && (
        <p className="star">
          {Array.from({ length: Math.max(0, bandEnd - bandStart) }, (_, k) => {
            const i = bandStart + k;
            return (
              <span key={i} style={{ color: glyphColor(i) }}>
                {glyph(i)}
              </span>
            );
          })}
        </p>
      )}
      <p>{rank} rank</p>
      {hasAttack ? (
        rk[0] === null || rk[1] === null ? (
          <p className="g">{TIER_LABEL[ds.dmg ?? "fine"]} Damage: {rk[0] ?? "—"}~{rk[1] ?? "—"}</p>
        ) : (
          <p className="g">{damageLineText(rk[0], rk[1], enchantFrac, ds.dmg)}</p>
        )
      ) : (
        (["pd", "md"] as const).map((k, i) => {
          const t = ds[k];
          const v = rk[2 + i];
          return v === null ? (
            <p key={k}>{k.toUpperCase()}: —</p>
          ) : (
            <p key={k} className="g">{statLineText(v, enchantFrac, t, k.toUpperCase())}</p>
          );
        })
      )}
      {req > 0 && (
        <p>{`Required Level: ${req} \u00a0\u00a0 Clan: ${CLASS_NAMES[item.class] ?? item.class}`}</p>
      )}
      {ELEMENTS.map(([name], idx) => {
        const active = activeElems.includes(name);
        const base = item.elems?.[rank]?.[idx] ?? undefined;
        const { value, swings } = elementNumbers(name, base, activeMask);
        const w = ELEMENT_WHEEL[name];
        const pos = !!w && !!(activeMask & ELEMENT_BIT[w.pos]);
        const neg = !!w && !!(activeMask & ELEMENT_BIT[w.neg]);
        const tag = !active
          ? `[${name}]`
          : pos && neg
            ? `[${name}+/-]`
            : pos
              ? `[${name}+]`
              : neg
                ? `[${name}-]`
                : `[${name}]`;
        return (
          <p key={name} className={active ? "c" : "x"}>
            {tag}
            {ATTR_INFO[ATTR_KEY[name] ?? name]?.desc ?? ""}
            {active && value !== undefined ? value : ""}
            {active ? swings.map(swingSpan) : null}
          </p>
        );
      })}
      {entry.attrs?.length
        ? entry.attrs.map((a, i) => {
            const desc = ATTR_INFO[a]?.desc ?? "";
            return (
              <p key={i} className={["g", "b", "y"][i % 3]}>
                {`${a}${desc ? ": " + desc : ""}`}
              </p>
            );
          })
        : null}
      {set && (
        <>
          <p className="c gap">
            {set.name} {worn}/{maxTier}
          </p>
          {setKeys.map((n) => (
            <p key={n} className={n <= worn ? "c" : "x"}>
              {`(${n}Piece)`}
              {set.bonuses[String(n)]}
            </p>
          ))}
        </>
      )}
      <p className="gap">Item introduction:</p>
      <p className="indent">{intro}</p>
    </div>
  );
}
