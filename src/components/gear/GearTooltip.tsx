import { useStar, useSets } from "../../hooks/useItems";
import { useBuild } from "./BuildContext";
import { elementNumbers, CLASS_NAMES } from "./gearSlots";
import { ATTR_INFO } from "./attrData";
import { ELEMENT_WHEEL, ELEMENT_BIT } from "./elementWheel";
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
  const maxEnh = star?.[String(item.starGroup)] ? star[String(item.starGroup)].length - 1 : 30;
  const bandStart = enhance < 10 ? 0 : enhance < 20 ? 10 : 20;
  const bandEnd = Math.min(enhance, maxEnh + 1);
  const req = item.reqLevels?.[rank] ?? item.reqLevel;

  const activeElems = entry.elements ?? [];
  const activeMask = ELEMENTS.reduce((m, [k, bit]) => m | (activeElems.includes(k) ? bit : 0), 0);
  const enhFactor = 1 + enhancePct(star ?? {}, item.starGroup, enhance) / 100;

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
      {req > 0 && (
        <p>{`Required Level: ${req} \u00a0\u00a0 Clan: ${CLASS_NAMES[item.class] ?? item.class}`}</p>
      )}
      {ELEMENTS.map(([name], idx) => {
        const active = activeElems.includes(name);
        const base = item.elems?.[rank]?.[idx] ?? undefined;
        const { value, swings } = elementNumbers(name, base, activeMask, enhFactor);
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
