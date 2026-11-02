import { CATEGORIES } from "../lib/data";
import { type Data } from "../lib/data";
import MapView from "../components/map/MapView";
import { SidePanel } from "../components/ui/SidePanel";
import { CategoryPanel } from "../components/ui/CategoryPanel";
import { CursorReadout } from "../components/ui/CursorReadout";
import { useMapState } from "../hooks/useMapState";

interface MapPageProps {
  data: Data;
  slug: string;
  setSlug: (s: string) => void;
  isActive: boolean;
}

export function MapPage({ data, slug, setSlug, isActive }: MapPageProps) {
  const {
    meta,
    mapPoints,
    countByCat,
    visible,
    toggleCategory,
    cursor,
    setCursor,
    mquery,
    setMquery,
    focus,
    results,
    mapName,
    handleResultClick,
    hasTransform,
  } = useMapState({ data, slug, setSlug });

  return (
    <div
      id="map-page"
      className={`flex h-full w-full relative transition-opacity duration-200 ${
        isActive ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      data-testid="map-page"
    >
      <div id="map-container" className="absolute inset-0" data-testid="map-container">
        {meta && (
          <MapView
            key={meta.slug}
            meta={meta}
            transform={data.transform}
            points={mapPoints}
            visible={visible}
            onCursor={setCursor}
            focus={focus}
          />
        )}
        {!hasTransform && (
          <div
            id="no-transform-banner"
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-yellow-500/90 px-3 py-1.5 text-xs text-yellow-900"
            data-testid="no-transform-banner"
          >
            No world→pixel transform for this map yet — showing image only.
          </div>
        )}
      </div>

      <SidePanel
        data={data}
        slug={slug}
        onMapSelect={setSlug}
        meta={meta}
        points={mapPoints}
        mquery={mquery}
        setMquery={setMquery}
        results={results}
        handleResultClick={handleResultClick}
        mapName={mapName}
      >
        <CategoryPanel
          categories={CATEGORIES}
          visible={visible}
          countByCat={countByCat}
          onToggle={toggleCategory}
        />
      </SidePanel>
      <CursorReadout cursor={cursor} />
    </div>
  );
}