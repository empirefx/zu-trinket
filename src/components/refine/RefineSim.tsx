// The refine sim state (one provider per selected piece): rank/enchant
// progress, the attempt log and the roll logic. The gear page's
// BuildContext pattern — panels consume useRefineSim instead of prop drilling.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { EquipEntry } from "../../lib/items";
import { saveFav, type FavAttempt } from "../../lib/refineFavs";
import { ENCHANT_RATE, SPARS, UPGRADES } from "../gear/generated/refineTable";
import { AUTO_CAP, lockFloor, sparKindOf, ENH_LOCKS, RANK_LOCKS, type LoadReq } from "./refineBits";

interface RefineSim {
  entry: EquipEntry;
  sel: string;
  rank: number;
  enh: number;
  rankGoal: number;
  enhGoal: number;
  maxRank: number;
  enhMax: number;
  hasEnchant: boolean;
  spar: (typeof SPARS)[number] | undefined;
  sparKind: "attack" | "defense";
  enhRate: number | null;
  rankRate: number;
  gradeCost: number;
  gradeMats: { name: string; count: number; icon?: string }[];
  stones: number;
  auto: boolean;
  setAuto: (v: boolean) => void;
  party: boolean;
  setParty: (v: boolean) => void;
  setRank: (v: number) => void;
  setEnh: (v: number) => void;
  attempts: FavAttempt[];
  totals: { gold: number; ok: number; fail: number; mats: [string, { count: number; icon?: string }][] };
  rankDone: boolean;
  enhDone: boolean;
  setRankGoal: (v: number) => void;
  setEnhGoal: (v: number) => void;
  run: (m: "rank" | "enchant") => void;
  resetSession: () => void;
  saveSession: () => void;
}

const RefineSimContext = createContext<RefineSim | null>(null);

export function RefineSimProvider({
  entry,
  sel,
  loadReq,
  onFavSaved,
  children,
}: {
  entry: EquipEntry;
  sel: string;
  loadReq: LoadReq;
  onFavSaved: () => void;
  children: ReactNode;
}) {
  const item = entry.item;
  const kind = sel === "Weapon" ? "weapon" : "armor";
  const tier = Math.min(9, Math.max(1, item.tier || 1));
  const grades = UPGRADES[kind][tier - 1];
  const maxRank = Math.max(0, item.ranks.length - 1);

  // the spar this gear level accepts (attack = weapons + Spirit Breath)
  const sparKind = sparKindOf(sel);
  const spar = SPARS.find((s) => s.kind === sparKind && item.tier >= s.minLevel && item.tier <= s.maxLevel);

  const curve = ENCHANT_RATE[String(item.starGroup)];
  const enhMax = curve ? Math.min(curve.length - 1, 30) : 0;
  const hasEnchant = Boolean(curve) && item.starGroup !== 0;

  // local sim state: re-derived when the piece (or its build rank/enhance)
  // changes; a favorite load (loadReq.n) jumps to the saved state instead.
  // The goal defaults to current + 1 but stays editable - never the same or
  // lower than the current value (setRankGoal keeps it above)
  const [rank, setRank] = useState(Math.min(entry.rank, maxRank));
  const [enh, setEnh] = useState(Math.min(entry.enhance, enhMax));
  // the game's own default: 5 stones per attempt (1..5 in game; the spar
  // count drives the success rate and the material cost)
  const stones = 5;
  const [auto, setAuto] = useState(false);
  const [party, setParty] = useState(false);
  const [attempts, setAttempts] = useState<FavAttempt[]>([]);
  const [rankGoal, setRankGoal] = useState(Math.min(entry.rank + 1, maxRank));
  const [enhGoal, setEnhGoal] = useState(Math.min(entry.enhance + 1, enhMax));

  // raising the current value past the goal drags the goal up with it
  const applyRank = (v: number) => {
    const r = Math.max(0, Math.min(maxRank, v));
    setRank(r);
    setRankGoal(Math.min(maxRank, Math.max(rankGoal, r + 1)));
  };
  const applyEnh = (v: number) => {
    const e = Math.max(0, Math.min(enhMax, v));
    setEnh(e);
    setEnhGoal(Math.min(enhMax, Math.max(enhGoal, e + 1)));
  };
  // a goal can never drop to the current value or below; at the cap it
  // equals the current value (nothing left to attempt)
  const clampRankGoal = (v: number) =>
    setRankGoal(Math.min(maxRank, Math.max(rank + 1, v)));
  const clampEnhGoal = (v: number) =>
    setEnhGoal(Math.min(enhMax, Math.max(enh + 1, v)));

  useEffect(() => {
    const fromFav = loadReq && loadReq.slot === sel && loadReq.itemId === item.id;
    setRank(Math.min(fromFav ? loadReq.rank : entry.rank, maxRank));
    setEnh(Math.min(fromFav ? loadReq.enh : entry.enhance, enhMax));
    setAttempts(fromFav ? loadReq.attempts : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, entry.item.id, entry.rank, entry.enhance, loadReq?.n]);

  const grade = grades[Math.min(9, Math.floor(rank / 3))];
  const rateRow = curve?.[Math.min(enh, curve.length - 1)];
  const rateUsable = Boolean(rateRow && rateRow[0] !== null && rateRow[1] !== null);
  const enhRate =
    rateUsable && stones > 0 ? Math.min(100, ((rateRow as [number, number])[0] + (rateRow as [number, number])[1] * stones) / 100) : null;
  // a full party helps the refine: +8 to the success percentage
  const rankRate = Math.min(100, grade.rate + (party ? 8 : 0));

  const run = (m: "rank" | "enchant") => {
    const log: FavAttempt[] = [];
    let r = rank;
    let e = enh;
    let guard = 0;
    do {
      guard++;
      if (m === "rank") {
        if (r >= rankGoal || r >= maxRank) break;
        const g = grades[Math.min(9, Math.floor(r / 3))];
        const ok = Math.random() * 100 < Math.min(100, g.rate + (party ? 8 : 0));
        log.push({
          kind: "rank",
          ok,
          from: r,
          to: ok ? r + 1 : lockFloor(r, RANK_LOCKS),
          gold: g.cost,
          mats: g.mats.map((x) => ({ name: x.name, count: x.count, icon: x.icon })),
        });
        r = ok ? r + 1 : lockFloor(r, RANK_LOCKS);
      } else {
        if (!spar || !hasEnchant || enhRate === null || e >= enhGoal || e >= enhMax) break;
        const ok = Math.random() * 100 < enhRate;
        log.push({
          kind: "enchant",
          ok,
          from: e,
          to: ok ? e + 1 : lockFloor(e, ENH_LOCKS),
          gold: 0,
          mats: [{ name: spar.name, count: stones, icon: spar.icon }],
        });
        e = ok ? e + 1 : lockFloor(e, ENH_LOCKS);
      }
    } while (auto && guard < AUTO_CAP);
    setRank(r);
    setEnh(e);
    // reaching the goal moves it one ahead again (2→3 success = now aiming
    // at 4), so refining can continue; at the cap the goal stays put
    if (r >= rankGoal && r < maxRank) setRankGoal(Math.min(maxRank, r + 1));
    if (e >= enhGoal && e < enhMax) setEnhGoal(Math.min(enhMax, e + 1));
    setAttempts((a) => [...a, ...log]);
  };

  const saveSession = () => {
    saveFav(sel, item, { rank, enh, attempts });
    onFavSaved();
  };

  // reset: everything back to the gear's own state (the build's rank/enhance,
  // empty log; the goals re-derive from those)
  const resetSession = () => {
    setRank(Math.min(entry.rank, maxRank));
    setEnh(Math.min(entry.enhance, enhMax));
    setRankGoal(Math.min(entry.rank + 1, maxRank));
    setEnhGoal(Math.min(entry.enhance + 1, enhMax));
    setAttempts([]);
  };

  const rankDone = rank >= rankGoal || rank >= maxRank;
  const enhDone = !hasEnchant || enh >= enhGoal || enh >= enhMax;
  const totals = useMemo(() => {
    let gold = 0;
    let ok = 0;
    const mats = new Map<string, { count: number; icon?: string }>();
    for (const a of attempts) {
      gold += a.gold;
      if (a.ok) ok++;
      for (const m of a.mats) {
        const k = m.name;
        const prev = mats.get(k) ?? { count: 0, icon: m.icon };
        mats.set(k, { count: prev.count + m.count, icon: prev.icon });
      }
    }
    return { gold, ok, fail: attempts.length - ok, mats: [...mats.entries()] };
  }, [attempts]);

  return (
    <RefineSimContext.Provider
      value={{
        entry,
        sel,
        rank,
        enh,
        rankGoal,
        enhGoal,
        maxRank,
        enhMax,
        hasEnchant,
        spar,
        sparKind,
        enhRate,
        rankRate,
        gradeCost: grade.cost,
        gradeMats: grade.mats,
        stones,
        auto,
        setAuto,
        party,
        setParty,
        setRank: applyRank,
        setEnh: applyEnh,
        setRankGoal: clampRankGoal,
        setEnhGoal: clampEnhGoal,
        attempts,
        totals,
        rankDone,
        enhDone,
        run,
        resetSession,
        saveSession,
      }}
    >
      {children}
    </RefineSimContext.Provider>
  );
}

export function useRefineSim() {
  const ctx = useContext(RefineSimContext);
  if (!ctx) throw new Error("useRefineSim must be used within RefineSimProvider");
  return ctx;
}
