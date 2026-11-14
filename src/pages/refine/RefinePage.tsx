// The Refine tab: rank + enchant planning for one piece of the build's gear.
// Layout from refine-skeleton.html, the gear page's palette. Every number is
// the game's own data (scripts/gen_refine.py -> generated/refineTable.ts):
// rank attempts are REFINE.ZU1's "Upgrade" recipes, enchant attempts read the
// item's STAR group (base + per-stone success) and consume the spars.
//
// Thin composition page (the gear page's pattern): the pieces live in
// src/components/refine/, the sim state in RefineSim's provider.
import { useEffect, useState } from "react";
import { Alert } from "@heroui/react";
import { BuildProvider, useBuild } from "../../components/gear/BuildContext";
import { RefineHeader } from "../../components/refine/RefineHeader";
import { RefineSimProvider } from "../../components/refine/RefineSim";
import { RefineFavorites } from "../../components/refine/RefineFavorites";
import { RefineWorkbench } from "../../components/refine/RefineWorkbench";
import { RefineExpenses } from "../../components/refine/RefineExpenses";
import { RefineAttempts } from "../../components/refine/RefineAttempts";
import { RefineEmpty } from "../../components/refine/RefineEmpty";
import { loadItems } from "../../lib/items";
import type { RefineFav } from "../../lib/refineFavs";
import type { LoadReq } from "../../components/refine/refineBits";
import "./refine.css";
function RefineBody() {
  const { gear, setGear } = useBuild();
  const [sel, setSel] = useState<string | null>(null);
  const [loadReq, setLoadReq] = useState<LoadReq>(null);
  const [favTick, setFavTick] = useState(0); // re-renders the favorites list

  // keep the selection on a piece that still exists; default to the first
  const entries = Object.entries(gear);
  const current = sel && gear[sel] ? sel : null;
  useEffect(() => {
    if (!current && entries.length) setSel(entries[0][0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, gear]);

  const entry = current ? gear[current] : null;

  const loadFav = async (slot: string, fav: RefineFav) => {
    // re-equip the favorite's gear if the slot no longer carries it, so
    // every favorite loads no matter what the build wears
    const cur = gear[slot];
    if (!cur || cur.item.id !== fav.itemId) {
      const items = await loadItems();
      const item = items.find((i) => i.id === fav.itemId);
      if (item) setGear(slot, { item, enhance: fav.enh, rank: fav.rank });
    }
    setSel(slot);
    setLoadReq({
      slot,
      itemId: fav.itemId,
      rank: fav.rank,
      enh: fav.enh,
      attempts: fav.attempts,
      n: (loadReq?.n ?? 0) + 1,
    });
  };

  return (
    <>
      {/* no gear: the whole page dims + goes inert (the gear page's panel
          gate), the fixed warning below stays readable */}
      <div
        className={entry ? "" : "opacity-40 pointer-events-none"}
        inert={entry ? undefined : true}
        data-testid="refine-gate"
      >
        <RefineHeader sel={current} onSel={setSel} />
        {entry ? (
          <RefineSimProvider
            entry={entry}
            sel={current!}
            loadReq={loadReq}
            onFavSaved={() => setFavTick((t) => t + 1)}
          >
            <div className="r-grid" data-testid="refine-grid">
              <RefineFavorites key={favTick} onLoad={loadFav} />
              <RefineWorkbench />
              <RefineExpenses />
              <RefineAttempts />
            </div>
          </RefineSimProvider>
        ) : (
          <RefineEmpty />
        )}
      </div>
      {!entry && (
        <div className="fixed bottom-10 right-10 z-50 w-[420px]" data-testid="refine-empty">
          <Alert status="warning">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>No gear to refine</Alert.Title>
              <Alert.Description>
                Equip gear on the Gear tab first — the pieces you added there show up in the select-gear list.
              </Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
      )}
    </>
  );
}

export function RefinePage() {
  return (
    <BuildProvider>
      {/* gear-page carries the shared .item-tip tooltip styles the slots reuse */}
      <div id="refine-page" className="refine-page gear-page h-full w-full overflow-auto" data-testid="refine-page">
        <main className="mx-auto max-w-7xl p-3 pt-16 sm:p-6 sm:pt-30">
          <RefineBody />
        </main>
      </div>
    </BuildProvider>
  );
}
