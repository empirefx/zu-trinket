import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, type Data, type MapMeta } from "../lib/data";

interface UseMapStateOpts {
  data: Data | null;
  slug?: string;
  setSlug?: (s: string) => void;
}

export function useMapState({ data, slug: externalSlug, setSlug: externalSetSlug }: UseMapStateOpts) {
  const [internalSlug, setInternalSlug] = useState<string>("");
  const [visible, setVisible] = useState<Set<string>>(
    () => new Set(CATEGORIES.map((c) => c.key)),
  );
  const [cursor, setCursor] = useState<[number, number] | null>(null);
  const [mquery, setMquery] = useState("");
  const [focus, setFocus] = useState<{ id: number } | null>(null);

  const slug = externalSlug ?? internalSlug;
  const setSlug = externalSetSlug ?? setInternalSlug;

  // Initialize slug to Holy City on first load (only if no external slug)
  useEffect(() => {
    if (data && !slug && !externalSlug) {
      const holyCity = data.maps.find((m) => m.slug === "level01_00_wyc");
      setSlug(holyCity?.slug ?? data.maps[0]?.slug ?? "");
    }
  }, [data, slug, externalSlug, setSlug]);

  const meta: MapMeta | undefined = data?.maps.find((m) => m.slug === slug);
  const mapPoints = useMemo(
    () => (data && meta ? data.points.filter((p) => p.map === meta.slug) : []),
    [data, meta],
  );

  const countByCat = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of mapPoints) c[p.cat] = (c[p.cat] ?? 0) + 1;
    return c;
  }, [mapPoints]);

  const results = useMemo(() => {
    if (!data) return [];
    const q = mquery.trim().toLowerCase();
    if (q.length < 2) return [];
    return data.points
      .filter((p) => p.map && p.name.toLowerCase().includes(q))
      .slice(0, 60);
  }, [data, mquery]);

  const mapName = (s: string) => data?.maps.find((m) => m.slug === s)?.name ?? s;

  const handleResultClick = (p: { id: number; map: string | null }) => {
    setSlug(p.map!);
    setFocus({ id: p.id });
    setMquery("");
  };

  const toggleCategory = (key: string) => {
    setVisible((s) => {
      const n = new Set(s);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  };

  return {
    slug,
    setSlug,
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
    setFocus,
    results,
    mapName,
    handleResultClick,
    hasTransform: !!data?.transform[slug],
  };
}