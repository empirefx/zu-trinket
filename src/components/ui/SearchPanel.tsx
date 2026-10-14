import { Card, CardContent, Input } from "@heroui/react";
import { type Data } from "../../lib/data";
import { toPixel } from "../../lib/data";

interface SearchPanelProps {
  data: Data;
  mquery: string;
  setMquery: (v: string) => void;
  results: { id: number; name: string; map: string | null; gx: number; gz: number }[];
  handleResultClick: (p: { id: number; map: string | null }) => void;
  mapName: (s: string) => string;
}

export function SearchPanel({ data, mquery, setMquery, results, handleResultClick, mapName }: SearchPanelProps) {
  return (
    <div id="search-panel" className="absolute top-14 right-3 z-50 w-64" data-testid="search-panel">
      <Card className="w-full bg-default/90 backdrop-blur-sm border-divider">
        <CardContent className="p-1.5 space-y-1">
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
                    className="px-1.5 py-1 text-xs cursor-pointer hover:bg-default/50 rounded"
                    onClick={() => handleResultClick(p)}
                    data-testid="search-result"
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
        </CardContent>
      </Card>
    </div>
  );
}