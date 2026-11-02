import { useState } from "react";
import { pretty, SLOT_REFINE, REFINE_SET, elementNumbers, darksteelBonus, nextDarksteelTier, TIER_LABEL, statLine, damageLine } from "./gearSlots";
import { REFINE_ATTRS } from "./refineData";
import { ATTR_INFO } from "./attrData";
import { ELEMENT_BIT, ELEMENT_WHEEL } from "./elementWheel";
import { useBuild } from "./BuildContext";
import { useStar, useSets } from "../../hooks/useItems";
import { enhancePct } from "../../lib/items";
import { iconClass } from "../../lib/icons";
import type { DarksteelKey, DarksteelTier, EquipEntry, Item } from "../../lib/items";

// Enchant is driven by STAR.bin (item.starGroup -> cumulative bonus fraction curve), so
// the strip stops at the group's max level. REFINE_ATTRS lists the potential
// attributes this slot can roll (from REFINE.ZU1). ponytail: the item's own
// element mask / potential value / attribute +N values aren't stored in the
// record, so Five elements and the Attributes list are click-to-toggle reference
// choices (stored on the entry) rather than per-item rolls.
export const glyph = (i: number) => (i < 10 ? "★" : i < 20 ? "☾" : "☀");
export const glyphColor = (i: number) => (i < 10 ? "#e8c36a" : i < 20 ? "#9ecbff" : "#ffd36e");

// base row = rank stat + quality gain (no enchant)
const dsEnd = (v: number | null, t?: DarksteelTier) => (v === null ? "—" : String(v + darksteelBonus(v, t)));

// "3 suns" = enhance level 21..30 (the strip is 10 stars, 10 moons, 10 suns)
const shownEnhLabel = (lvl: number) =>
  lvl <= 10 ? `${lvl} stars` : lvl <= 20 ? `${lvl - 10} moons` : `${lvl - 20} suns`;

// The five elements, as the game names them (ITEMATT.ZU1 / ITEMFIVEATTRIBUTE.ZU1):
// Metal = "Increases Attack Power", Wood = "Increases max health", Water =
// "Increases Magic Defense", Fire = "Increases the effect duration of
// shapeshifting", Earth = "Increases Physical Defense".  The bit is the one the
// game uses for the element set (ITEMFIVEATTRIBUTE row id).
const ELEMENTS: [string, number][] = [
  ["Metal", 1], ["Wood", 2], ["Water", 4], ["Fire", 8], ["Earth", 16],
];
// The guide and the REFINE table call the first element "Gold"; ATTR_INFO is
// keyed by that name.
export const ATTR_KEY: Record<string, string> = { Metal: "Gold" };

interface GearDrawerProps {
  item: Item;
  appSlot: string;
  onCancel: () => void;
  onAdd: (entry: EquipEntry) => void;
  initial?: EquipEntry;
}

export function GearDrawer({ item, appSlot, onCancel, onAdd, initial }: GearDrawerProps) {
  const [enhRaw, setEnh] = useState(initial?.enhance ?? 0);
  const [rank, setRank] = useState(initial?.rank ?? 0);
  const [on, setOn] = useState<Set<string>>(new Set(initial?.attrs ?? []));
  // which elements are activated on the item: that is the player's choice
  // (element stones), it is NOT in the tables - the values are.
  const [onElem, setOnElem] = useState<Set<string>>(new Set(initial?.elements ?? []));
  const [hover, setHover] = useState<{ n: number; v: number } | null>(null);
  const [ds, setDs] = useState<Partial<Record<DarksteelKey, DarksteelTier>>>(initial?.darksteel ?? {});
  const rotate = (key: DarksteelKey) => setDs((d) => ({ ...d, [key]: nextDarksteelTier(d[key]) }));
  const anyDs = !!(ds.dmg || ds.pd || ds.md);
  const star = useStar();
  const sets = useSets();
  const { gear } = useBuild();
  const curve = star?.[String(item.starGroup)];
  const maxEnh = curve ? curve.length - 1 : 30;
  const enh = Math.min(enhRaw, maxEnh);

  // The multiplier the game applies for the currently active element set
  // (ITEMFIVEATTRIBUTE.ZU1: one row per set, keyed by the element bitmask).
  const activeMask = ELEMENTS.reduce((m, [k, bit]) => m | (onElem.has(k) ? bit : 0), 0);
  // raw enchant fraction from the STAR curve — the base rows below need it
  const enhPct = enhancePct(star ?? {}, item.starGroup, enh);

  const maxRank = Math.max(item.ranks.length - 1, 0);
  const rk = item.ranks[Math.min(rank, maxRank)] ?? [item.atkMin, item.atkMax, item.phys, item.mag];
  const [rAtkMin, rAtkMax, rPhys, rMag] = rk;
  const hasAttack = !!(rAtkMin || rAtkMax);
  // The character level the gear needs - the item record's own "YearsNeed"
  // (ITEMS +332).  It grows a little with the rank, so the chosen rank's
  // value is shown.  0 means the game does not write one down.
  const reqLevel =
    item.reqLevels?.[Math.min(rank, (item.reqLevels?.length ?? 1) - 1)] || item.reqLevel;
  const base: { k: string; v: string; dsKey?: DarksteelKey }[] = [
    { k: "Gear level", v: String(item.tier) },
    { k: "Required Level", v: reqLevel ? String(reqLevel) : "—" },
  ];
  // The crafting recipe has a level of its own (SPELLSEX) - only the
  // craftable grades have one, and it is not the same number.
  if (item.craftLevel) {
    base.push({ k: "Craft Level", v: String(item.craftLevel) });
  }
  if (hasAttack) {
    base.push({
      k: "Attack",
      v: `${dsEnd(rAtkMin, ds.dmg)} ~ ${dsEnd(rAtkMax, ds.dmg)} (${TIER_LABEL[ds.dmg ?? "fine"]})`,
      dsKey: "dmg",
    });
  } else {
    base.push({
      k: "Phys Def",
      v: `${dsEnd(rPhys, ds.pd)} (${TIER_LABEL[ds.pd ?? "fine"]})`,
      dsKey: "pd",
    });
    base.push({
      k: "Mag Def",
      v: `${dsEnd(rMag, ds.md)} (${TIER_LABEL[ds.md ?? "fine"]})`,
      dsKey: "md",
    });
  }
  // enchant row: helper totals (weapon shares one avg-flat paren, never per-end floor)
  if (enhPct > 0) {
    base.push({
      k: `At ${shownEnhLabel(enh)} enchant`,
      v: hasAttack
        ? `${damageLine(rAtkMin ?? 0, rAtkMax ?? 0, enhPct, ds.dmg).minTotal} ~ ${damageLine(rAtkMin ?? 0, rAtkMax ?? 0, enhPct, ds.dmg).maxTotal}`
        : `${statLine(rPhys ?? 0, enhPct, ds.pd).total} / ${statLine(rMag ?? 0, enhPct, ds.md).total}`,
    });
  }
  const refineSlot = SLOT_REFINE[appSlot] ?? 0;
  const attrs = REFINE_ATTRS[String(refineSlot)] ?? [];

  // Set bonuses: count the same set already worn in the other slots, plus this
  // item. bonuses are keyed by piece count ("2".."8"); tiers at/below the worn
  // count are active.
  const set = item.setId ? sets?.[String(item.setId)] : undefined;
  const worn = item.setId
    ? Object.entries(gear).filter(([s, e]) => s !== appSlot && e.item.setId === item.setId).length + 1
    : 0;
  const setTiers = set
    ? Object.entries(set.bonuses)
        .map(([n, text]) => [Number(n), text] as [number, string])
        .sort((a, b) => a[0] - b[0])
    : [];

  const toggle = (cur: Set<string>, set: (s: Set<string>) => void, name: string) => {
    const next = new Set(cur);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    set(next);
  };

  const shownEnh = hover?.n === 1 ? hover.v : enh;
  const shownPct = curve && shownEnh > 0 ? curve[Math.min(shownEnh, curve.length - 1)] : 0;
  const shownRank = hover?.n === 2 ? hover.v : rank;
  const icon = iconClass(item.icon);

  return (
    <div className="drawer-wrap" onClick={onCancel}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div className="drawer-title">
            {item.name}{" "}
            <span className="drawer-sub">
              Lvl {item.tier} · {pretty(appSlot)}
            </span>
          </div>
          {icon ? <span className={"gear-icon zs " + icon} /> : null}
        </div>

        <div className="drawer-body">
          <div className="sec">
            Base stats <span className="sec-hint">(click a stat)</span>
          </div>
          <div className="statgrid">
            {base.map(({ k, v, dsKey }) => (
              <div
                key={k}
                className={dsKey ? "ds" : undefined}
                onClick={dsKey ? () => rotate(dsKey) : undefined}
              >
                <span className="k">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>

          <div className="sec">
            Enchant <span className="sec-val">{shownEnh}{shownPct > 0 && ` · +${(shownPct * 100).toFixed(1)}%`}</span>
          </div>
          <div className="rate" onMouseLeave={() => setHover(null)}>
            <span
              style={{ color: shownEnh === 0 ? "#e8c36a" : "#3a4150" }}
              onMouseEnter={() => setHover({ n: 1, v: 0 })}
              onClick={() => setEnh(0)}
            >
              ⚬
            </span>
            {Array.from({ length: maxEnh }, (_, i) => (
              <span
                key={i}
                style={{ color: i + 1 <= shownEnh ? glyphColor(i) : "#3a4150" }}
                onMouseEnter={() => setHover({ n: 1, v: i + 1 })}
                onClick={() => setEnh(i + 1)}
              >
                {glyph(i)}
              </span>
            ))}
          </div>
          <div className="rate-legend">
            <span>⚬ None</span>
            <span>★ Stars 1–10</span>
            <span>☾ Moons 11–20</span>
            <span>☀ Suns 21–30</span>
          </div>

          <div className="sec">Rank <span className="sec-val">{shownRank}</span></div>
          <div className="rate rank" onMouseLeave={() => setHover(null)}>
            {Array.from({ length: maxRank + 1 }, (_, k) => (
              <span
                key={k}
                style={{ color: k <= shownRank ? "#e8c36a" : "#3a4150" }}
                onMouseEnter={() => setHover({ n: 2, v: k })}
                onClick={() => setRank(k)}
              >
                {k}
              </span>
            ))}
          </div>

          <div className="sec">
            Five elements <span className="sec-hint">(click to toggle)</span>
          </div>
          <div className="attrlist elem-lines">
            {ELEMENTS.map(([name], idx) => {
              const info = ATTR_INFO[ATTR_KEY[name] ?? name];
              const w = ELEMENT_WHEEL[name];
              const active = onElem.has(name);
              const base = item.elems?.[Math.min(rank, item.elems.length - 1)]?.[idx] ?? undefined;
              const { value, swings } = elementNumbers(name, base, activeMask);
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
                <div
                  key={name}
                  className={"attr" + (active ? " on" : "")}
                  onClick={() => toggle(onElem, setOnElem, name)}
                >
                  <span className="mark">{active ? "✓" : "□"}</span>
                  <span className="elem-line">
                    ({active ? "activated" : "desactivated"}) {tag}
                    <span className="attr-desc">{info?.desc ?? ""}</span>
                    {active && value !== undefined ? value : ""}
                    {active ? swings.join("") : ""}
                  </span>
                </div>
              );
            })}
          </div>
          {attrs.length > 0 && (
            <>
              <div className="sec">
                Attributes <span className="sec-hint">({REFINE_SET[refineSlot] ?? "set"})</span>
              </div>
              <div className="attrrows">
                {attrs.map((a) => {
                  const info = ATTR_INFO[a];
                  return (
                    <div
                      key={a}
                      className={"attr-row" + (on.has(a) ? " on" : "")}
                      onClick={() => toggle(on, setOn, a)}
                    >
                      <span className="mark">{on.has(a) ? "✓" : "□"}</span>
                      <span>
                        <b>{a}</b>
                        {info && info.name !== a ? <span className="attr-note"> ({info.name})</span> : null}
                        {" — "}
                        <span className="attr-desc">{info?.desc ?? ""}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {set && setTiers.length > 0 && (
            <>
              <div className="sec">
                Set <span className="sec-hint">{set.name}</span>{" "}
                <span className="sec-val">{worn} pieces</span>
              </div>
              <div className="attrrows">
                {setTiers.map(([n, text]) => (
                  <div key={n} className={"attr-row" + (worn >= n ? " on" : "")}>
                    <span className="mark">{worn >= n ? "✓" : "□"}</span>
                    <span>
                      <b>{n} pieces</b> — <span className="attr-desc">{text}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="drawer-foot">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button
            className="btn primary"
            onClick={() =>
              onAdd({ item, enhance: enh, rank, attrs: [...on], elements: [...onElem], darksteel: anyDs ? { ...ds } : undefined })
            }
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
