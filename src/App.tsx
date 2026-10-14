import { useEffect, useMemo, useState } from "react";
import "./App.css";
import MapView from "./components/MapView";
import {
  CATEGORIES,
  loadData,
  toPixel,
  type Data,
  type MapMeta,
} from "./lib/data";

export default function App() {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [slug, setSlug] = useState<string>("");
  const [visible, setVisible] = useState<Set<string>>(
    () => new Set(CATEGORIES.map((c) => c.key)),
  );
  const [cursor, setCursor] = useState<[number, number] | null>(null);
  const [mquery, setMquery] = useState("");
  const [focus, setFocus] = useState<{ id: number } | null>(null);

  useEffect(() => {
    loadData()
      .then((d) => {
        setData(d);
        const first = d.maps.find((m) => d.transform[m.slug]) ?? d.maps[0];
        setSlug(first.slug);
      })
      .catch((e) => setErr(String(e)));
  }, []);

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

  if (err) return <div className="center">Failed to load data: {err}</div>;
  if (!data || !meta) return <div className="center">Loading…</div>;

  const hasTransform = !!data.transform[meta.slug];
  const mapName = (s: string) => data.maps.find((m) => m.slug === s)?.name ?? s;

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>Zu Online — Map</h1>
        <div className="searchwrap">
          <input
            className="search"
            id="marker-search"
            name="marker-search"
            placeholder="Find NPC / monster…"
            aria-label="Find marker"
            value={mquery}
            onChange={(e) => setMquery(e.target.value)}
          />
          {results.length > 0 && (
            <div className="results">
              {results.map((p) => {
                const t = data.transform[p.map!];
                const px = t ? toPixel(t, p.gx, p.gz) : null;
                return (
                  <button
                    key={p.id}
                    className="result"
                    onClick={() => {
                      setSlug(p.map!);
                      setFocus({ id: p.id });
                      setMquery("");
                    }}
                  >
                    <span className="rname">{p.name}</span>
                    <span className="rmap">
                      {mapName(p.map!)}
                      {px ? ` · ${px[0].toFixed(0)},${px[1].toFixed(0)}` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="maplist">
          {data.maps.map((m) => (
            <button
              key={m.slug}
              className={"mapitem" + (m.slug === slug ? " active" : "")}
              onClick={() => setSlug(m.slug)}
              title={m.slug}
            >
              <span>{m.name}</span>
              {!data.transform[m.slug] && <span className="warn">no data</span>}
            </button>
          ))}
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="title">
            {meta.name}
            <span className="dims">
              {meta.width}×{meta.height} · {mapPoints.length} points
            </span>
          </div>
          <div className="cats">
            {CATEGORIES.map((c) => (
              <label key={c.key} className="cat" style={{ opacity: visible.has(c.key) ? 1 : 0.45 }}>
                <input
                  type="checkbox"
                  checked={visible.has(c.key)}
                  onChange={() =>
                    setVisible((s) => {
                      const n = new Set(s);
                      n.has(c.key) ? n.delete(c.key) : n.add(c.key);
                      return n;
                    })
                  }
                />
                <span className="dot" style={{ background: c.color }} />
                {c.label}
                <span className="count">{countByCat[c.key] ?? 0}</span>
              </label>
            ))}
          </div>
          <div className="cursor">
            {cursor ? `x ${cursor[0].toFixed(0)}  y ${cursor[1].toFixed(0)}` : ""}
          </div>
        </div>
        <div className="mapwrap">
          <MapView
            key={meta.slug}
            meta={meta}
            transform={data.transform}
            points={mapPoints}
            visible={visible}
            onCursor={setCursor}
            focus={focus}
          />
          {!hasTransform && (
            <div className="banner">
              No world→pixel transform for this map yet — showing image only.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
