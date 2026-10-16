import { useState } from "react";
import { pretty, SLOT_REFINE, REFINE_SET, ATTR_DESC } from "./gearSlots";
import { REFINE_ATTRS } from "./refineData";
import { useBuild } from "./BuildContext";
import { useStar, useSets } from "../../hooks/useItems";
import type { EquipEntry, Item } from "../../lib/items";

// Enhance is driven by STAR.bin (item.starGroup -> cumulative bonus % curve), so
// the strip stops at the group's max level. REFINE_ATTRS lists the potential
// attributes this slot can roll (from REFINE.ZU1). ponytail: the item's own
// element mask / potential value / attribute +N values aren't stored in the
// record, so Five elements and the Attributes list are click-to-toggle reference
// choices (stored on the entry) rather than per-item rolls.
const glyph = (i: number) => (i < 10 ? "★" : i < 20 ? "☾" : "☀");
const glyphColor = (i: number) => (i < 10 ? "#e8c36a" : i < 20 ? "#9ecbff" : "#ffd36e");

const num = (v: number | null) => (v === null ? "—" : String(v));
const range = (a: number | null, b: number | null) => `${num(a)} ~ ${num(b)}`;

// Stat granted by each five-element stone (2008 guide wording).
const ELEMENTS: [string, string][] = [
  ["Gold", "+Atk"],
  ["Wood", "+HP"],
  ["Water", "+MDef"],
  ["Fire", "+Shift"],
  ["Earth", "+PDef"],
];

interface GearDrawerProps {
  item: Item;
  appSlot: string;
  onCancel: () => void;
  onAdd: (entry: EquipEntry) => void;
}

export function GearDrawer({ item, appSlot, onCancel, onAdd }: GearDrawerProps) {
  const [enhRaw, setEnh] = useState(0);
  const [rank, setRank] = useState(0);
  const [on, setOn] = useState<Set<string>>(new Set());
  const [onElem, setOnElem] = useState<Set<string>>(new Set());
  const [hover, setHover] = useState<{ n: number; v: number } | null>(null);
  const star = useStar();
  const sets = useSets();
  const { gear } = useBuild();
  const curve = star?.[String(item.starGroup)];
  const maxEnh = curve ? curve.length - 1 : 30;

  const maxRank = Math.max(item.ranks.length - 1, 0);
  const rk = item.ranks[Math.min(rank, maxRank)] ?? [item.atkMin, item.atkMax, item.phys, item.mag];
  const [rAtkMin, rAtkMax, rPhys, rMag] = rk;
  const hasAttack = !!(rAtkMin || rAtkMax);
  const base: [string, string][] = [["Required Level", String(item.tier)]];
  if (hasAttack) base.push(["Attack", range(rAtkMin, rAtkMax)]);
  else {
    base.push(["Phys Def", num(rPhys)]);
    base.push(["Mag Def", num(rMag)]);
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

  const enh = Math.min(enhRaw, maxEnh);
  const shownEnh = hover?.n === 1 ? hover.v : enh;
  const shownPct = curve && shownEnh > 0 ? curve[Math.min(shownEnh, curve.length - 1)] : 0;
  const shownRank = hover?.n === 2 ? hover.v : rank;

  return (
    <div className="drawer-wrap" onClick={onCancel}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          {item.name}{" "}
          <span className="drawer-sub">
            Lvl {item.tier} · {pretty(appSlot)}
          </span>
        </div>

        <div className="drawer-body">
          <div className="sec">Base stats</div>
          <div className="statgrid">
            {base.map(([k, v]) => (
              <div key={k}>
                <span className="k">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>

          <div className="sec">
            Enhance <span className="sec-val">{shownEnh}{shownPct > 0 && ` · +${shownPct}%`}</span>
          </div>
          <div className="rate" onMouseLeave={() => setHover(null)}>
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
          <div className="attrlist">
            {ELEMENTS.map(([name, stat]) => (
              <span
                key={name}
                className={"attr" + (onElem.has(name) ? " on" : "")}
                onClick={() => toggle(onElem, setOnElem, name)}
              >
                {name} <span className="attr-note">{stat}</span>
              </span>
            ))}
          </div>

          {attrs.length > 0 && (
            <>
              <div className="sec">
                Attributes <span className="sec-hint">({REFINE_SET[refineSlot] ?? "set"})</span>
              </div>
              <div className="attrrows">
                {attrs.map((a) => (
                  <div
                    key={a}
                    className={"attr-row" + (on.has(a) ? " on" : "")}
                    onClick={() => toggle(on, setOn, a)}
                  >
                    <span className="mark">{on.has(a) ? "✓" : "□"}</span>
                    <span>
                      <b>{a}</b> — <span className="attr-desc">{ATTR_DESC[a] ?? ""}</span>
                    </span>
                  </div>
                ))}
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
              onAdd({ item, enhance: enh, rank, attrs: [...on], elements: [...onElem] })
            }
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
