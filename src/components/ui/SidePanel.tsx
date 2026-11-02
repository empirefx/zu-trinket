import { useState, type ReactNode } from "react";
import { Card, CardContent, Input } from "@heroui/react";
import { type Data, type MapMeta, type Point } from "../../lib/data";
import { toPixel } from "../../lib/data";

type ListTab = "map" | "search" | "npc" | "monster";

interface SidePanelProps {
  data: Data;
  slug: string;
  onMapSelect: (slug: string) => void;
  meta?: MapMeta;
  points: Point[];
  mquery: string;
  setMquery: (v: string) => void;
  results: { id: number; name: string; map: string | null; gx: number; gz: number }[];
  handleResultClick: (p: { id: number; map: string | null }) => void;
  mapName: (s: string) => string;
  children?: ReactNode;
}

// the game's map units: the longer axis of the world rect is 1000 units
function cursorXY(meta: MapMeta | undefined, p: Point): [number, number] | null {
  if (!meta?.rect) return null;
  const [x0, z0, sx, sz] = meta.rect;
  const s = Math.max(sx, sz) / 1000;
  return [(p.gx - x0) / s, (p.gz - z0) / s];
}

// 999 = the level is not known
function knownLevel(p: Point): number | null {
  return p.level > 0 && p.level < 999 ? p.level : null;
}

const TABS: { key: ListTab; label: string }[] = [
  { key: "map", label: "Map" },
  { key: "npc", label: "NPC" },
  { key: "monster", label: "Monster" },
  { key: "search", label: "Search" },
];

export function SidePanel({
  data,
  slug,
  onMapSelect,
  meta,
  points,
  mquery,
  setMquery,
  results,
  handleResultClick,
  mapName,
  children,
}: SidePanelProps) {
  const [tab, setTab] = useState<ListTab>("map");
  const [selected, setSelected] = useState<number | null>(null);

  const npcs = points.filter((p) => p.cat === "npc").sort((a, b) => a.name.localeCompare(b.name));
  const mobs = points.filter((p) => p.cat === "mob").sort((a, b) => a.name.localeCompare(b.name));
  const list = tab === "npc" ? npcs : tab === "monster" ? mobs : [];

  return (
    <div id="side-panel" className="absolute top-14 right-3 z-50 w-[450px]" data-testid="side-panel">
      <Card className="w-full bg-default/90 backdrop-blur-sm border-divider">
        <CardContent className="p-1.5 space-y-1">
          {children && (
            <div className="border-b border-divider pb-1.5 mb-1" data-testid="side-panel-top">
              {children}
            </div>
          )}
          <div className="flex items-center gap-1" role="tablist">
            {TABS.map((t) => (
              <div
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                data-testid={`side-tab-${t.key}`}
                className={`px-2 py-1 text-xs font-medium rounded cursor-pointer select-none ${
                  tab === t.key
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:bg-black/40 hover:text-foreground"
                }`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </div>
            ))}
          </div>
          {tab === "map" ? (
            <div
              className="max-h-[480px] overflow-y-auto border-t border-divider pt-1"
              style={{ scrollbarWidth: "thin" }}
              data-testid="side-map-list"
            >
              {data.maps.map((m) => (
                <div
                  key={m.slug}
                  role="button"
                  tabIndex={0}
                  className={`w-full text-left px-1.5 py-1 rounded-none text-xs transition-colors cursor-pointer ${
                    m.slug === slug
                      ? "bg-black/40 text-primary font-medium"
                      : "text-foreground hover:bg-default/50"
                  }`}
                  onClick={() => onMapSelect(m.slug)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onMapSelect(m.slug);
                    }
                  }}
                  title={m.slug}
                  data-testid="side-map-item"
                  data-slug={m.slug}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="truncate">{m.name}</span>
                    {!data.transform[m.slug] && (
                      <span className="text-[10px] text-warning shrink-0">no data</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : tab === "search" ? (
            <>
              <Input
                id="marker-search"
                value={mquery}
                onChange={(e) => setMquery(e.target.value)}
                placeholder="Find NPC / monster…"
                className="w-full text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setMquery("");
                }}
              />
              {results.length > 0 && (
                <div className="max-h-60 overflow-y-auto border-t border-divider pt-1">
                  {results.map((p) => {
                    const t = data.transform[p.map!];
                    const px = t ? toPixel(t, p.gx, p.gz) : null;
                    return (
                      <div
                        key={p.id}
                        className={`px-1.5 py-1 text-xs cursor-pointer hover:bg-default/50 rounded ${
                          selected === p.id ? "bg-black/40" : ""
                        }`}
                        onClick={() => {
                          setSelected(p.id);
                          handleResultClick(p);
                        }}
                        data-testid="side-search-result"
                        data-id={p.id}
                      >
                        <div className="font-medium truncate">{p.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {mapName(p.map!)}
                          {px ? ` · ${px[0].toFixed(0)},${px[1].toFixed(0)}` : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="max-h-72 overflow-y-auto border-t border-divider pt-1" data-testid="side-list">
              {list.length === 0 && (
                <div className="px-1.5 py-1 text-[10px] text-muted-foreground">nothing here</div>
              )}
              {list.map((p) => {
                const xy = cursorXY(meta, p);
                const lvl = knownLevel(p);
                const mid = tab === "npc" ? p.func : lvl !== null ? `L${lvl}` : "";
                return (
                  <div
                    key={p.id}
                    className={`px-1.5 py-1 text-xs cursor-pointer hover:bg-default/50 rounded flex items-baseline gap-2 ${
                      selected === p.id ? "bg-black/40" : ""
                    }`}
                    onClick={() => {
                      setSelected(p.id);
                      handleResultClick(p);
                    }}
                    data-testid="side-list-row"
                    data-id={p.id}
                  >
                    <span className="font-medium truncate flex-1">{p.name}</span>
                    {mid && (
                      <span className="text-[10px] text-muted-foreground truncate w-24 text-right">
                        {mid}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground tabular-nums w-20 text-right">
                      {xy ? `${xy[0].toFixed(0)},${xy[1].toFixed(0)}` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
