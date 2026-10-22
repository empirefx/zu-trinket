import { type Data } from "../../lib/data";

interface MapListPanelProps {
  data: Data;
  slug: string;
  onSelect: (slug: string) => void;
}

export function MapListPanel({ data, slug, onSelect }: MapListPanelProps) {
  return (
    <div
      id="map-list-panel"
      className="absolute left-3 top-32 z-50 w-60 max-h-[600px] overflow-hidden"
      data-testid="map-list-panel"
    >
      <div className="max-h-[600px] flex flex-col bg-default/90 backdrop-blur-sm border border-divider rounded-sm">
        <div className="p-1.5 flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          <div className="text-xs font-semibold text-muted-foreground mb-1.5 px-0.5">
            Maps ({data.maps.length})
          </div>
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
              onClick={() => onSelect(m.slug)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(m.slug);
                }
              }}
              title={m.slug}
              data-testid="map-list-item"
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
      </div>
    </div>
  );
}
