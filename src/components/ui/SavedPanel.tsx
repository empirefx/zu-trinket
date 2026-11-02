import { Card, CardContent } from "@heroui/react";
import { type Data, type MapMeta, type Point, type Viewport } from "../../lib/data";
import { catColor, toPixel } from "../../lib/data";

interface SavedPanelProps {
  data: Data;
  meta?: MapMeta;
  points: Point[]; // the current map's points (thumbnail dots)
  saved: number[]; // pinned point ids, insertion-ordered
  viewport?: Viewport | null; // the main map's view, as fractions of the box
  onClick: (p: { id: number; map: string | null }) => void;
}

export function SavedPanel({ data, meta, points, saved, viewport, onClick }: SavedPanelProps) {
  const has = new Set(saved);
  const pinned = data.points.filter((p) => has.has(p.id));
  const t = meta ? data.transform[meta.slug] : undefined;

  return (
    <div
      id="saved-panel"
      className="absolute left-3 bottom-3 z-50 w-56 max-h-[60vh] overflow-y-auto"
      style={{ scrollbarWidth: "thin" }}
      data-testid="saved-panel"
    >
      <Card className="w-full bg-default/90 backdrop-blur-sm border border-divider rounded-sm">
        <CardContent className="p-1.5 space-y-1">
          {meta && (
            // the current map as a static thumbnail, pinned points as dots —
            // the box matches the transform's pixel box (the overlay's real
            // aspect); Leaflet's lat axis runs up, so the image row order is
            // top = py max, hence the 1 - py fraction
            <div
              className="relative w-full rounded-sm overflow-hidden select-none border border-divider"
              style={{
                aspectRatio: t ? `${t.w} / ${t.h}` : `${meta.width} / ${meta.height}`,
              }}
              data-testid="saved-thumb"
            >
              <img src={meta.image} alt="" draggable={false} className="absolute inset-0 w-full h-full" />
              {t &&
                points
                  .filter((p) => has.has(p.id))
                  .map((p) => {
                    const [px, py] = toPixel(t, p.gx, p.gz);
                    return (
                      <span
                        key={p.id}
                        className={`cat-icon cat-${p.cat} cursor-pointer`}
                        title="show on map"
                        onClick={() => onClick(p)}
                        style={{
                          position: "absolute",
                          left: `${(px / t.w) * 100}%`,
                          top: `${(1 - py / t.h) * 100}%`,
                          width: 10,
                          height: 10,
                          margin: "-5px 0 0 -5px",
                          color: catColor(p.cat),
                        }}
                      />
                    );
                  })}
              {/* the main map's viewport rectangle (y is stored py-down) */}
              {viewport && viewport.w > 0 && viewport.h > 0 && (
                <div
                  className="pointer-events-none absolute rounded-[2px] border border-yellow-400/90 bg-yellow-200/10"
                  style={{
                    left: `${viewport.x * 100}%`,
                    top: `${(1 - (viewport.y + viewport.h)) * 100}%`,
                    width: `${viewport.w * 100}%`,
                    height: `${viewport.h * 100}%`,
                  }}
                  data-testid="saved-thumb-viewport"
                />
              )}
            </div>
          )}
          <div className="text-xs font-semibold text-muted-foreground px-0.5">
            Saved ({pinned.length})
          </div>
          {pinned.length === 0 && (
            <div className="px-1.5 py-1 text-xs text-dimgrey text-center">
              click a marker to pin it here
            </div>
          )}
          {pinned.map((p) => (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              className="w-full text-left px-1.5 py-1 rounded-none text-xs transition-colors cursor-pointer flex items-baseline gap-1.5 text-foreground hover:bg-default/50"
              onClick={() => onClick(p)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick(p);
                }
              }}
              data-testid="saved-item"
              data-id={p.id}
            >
              <span
                className={`cat-icon cat-${p.cat} shrink-0 self-center`}
                style={{ color: catColor(p.cat) }}
              />
              <span className="truncate flex-1">{p.name}</span>
              <span className="text-[10px] text-muted-foreground truncate w-20 text-right">
                {p.map ? data.maps.find((m) => m.slug === p.map)?.name : ""}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
