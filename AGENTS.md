# Zu Online Map — Agent Reference

## Project Overview
React + Leaflet full-screen web map tool for Zu Online / 新蜀山OL. Displays mob spawns, objects, NPCs per map with map switcher, per-category toggles, and name search that jumps to markers.

**Stack:** React 19, Leaflet 1.9.4 (CRS.Simple), Vite 8, TypeScript 6, HeroUI 3.2.6, Tailwind CSS 4.

**Dev server:** `npm run dev` → `http://localhost:5173` (IPv6 `::1:5173`)

**Build:** `npm run build` → `dist/`

## Folder Structure
```
src/
├── App.tsx                 # Root: data loading, tabs (Map/Gear), renders pages
├── main.tsx                # Entry, imports leaflet.css + index.css
├── index.css               # @import "@heroui/styles"; dark theme vars
├── vite.config.ts          # Vite + @tailwindcss/postcss plugin
├── hooks/
│   ├── useData.ts          # Loads maps/points/transform JSON
│   └── useMapState.ts      # All map-page state (slug, visible, cursor, search, etc.)
├── pages/
│   ├── MapPage.tsx         # Map tab: composes SearchPanel, MapListPanel, CategoryPanel, CursorReadout, MapView
│   └── GearPage.tsx        # Gear tab: centered "gear" + "working on it"
├── components/
│   ├── ui/
│   │   ├── SearchPanel.tsx      # Top-left: input + results popover (click to jump)
│   │   ├── MapListPanel.tsx     # Left-middle: scrollable list of all 64 maps, active highlighted
│   │   ├── CategoryPanel.tsx    # Top-right: checkbox toggles with color dots + counts
│   │   ├── CursorReadout.tsx    # Bottom-left: shows "x N y N"
│   │   └── TopTabs.tsx          # Top bar: Logo (disabled), Map, Gear
│   └── map/
│       └── MapView.tsx          # Leaflet map: image overlay + circle markers, CRS.Simple
├── lib/
│   └── data.ts            # Types (MapMeta, Point, Transform, Data, Category), loadData(), toPixel/fromPixel, CATEGORIES, catColor
└── assets/
    └── logo.bmp           # 64×64 logo for top tab bar
```

## Data Flow
1. `App` → `useData()` fetches `/data/{maps,points,transform}.json` (built by `scripts/build_data.py`)
2. `App` passes `data` to `MapPage` (Map tab) or `GearPage` (Gear tab)
3. `MapPage` → `useMapState(data)` derives all interactive state
4. State passed to floating panels (`SearchPanel`, `MapListPanel`, `CategoryPanel`, `CursorReadout`)
5. `MapView` receives `meta`, `transform`, `points`, `visible`, `onCursor`, `focus`

## Coordinate System (Critical)
- Game world coordinates `(gx, gz)` from `KEYWORDDATA.ZU1` (via `build_data.py`)
- Each map has `rect = [minX, minZ, sizeX, sizeZ]` from `MAPS.ZU1` @ 0x54
- **Transform**: `S = max(sizeX, sizeZ) / 1000` — the game normalizes the longer axis to 1000 units
- **World → game cursor**: `cx = (gx - minX) / S`, `cz = (gz - minZ) / S`
- **World → image pixel** (for markers): `px = (gx - minX) / sizeX * imgW`, `py = (gz - minZ) / sizeZ * imgH`
- `Transform` stored in `transform.json` with `kx = sizeX*1000/(imgW*max)`, `kz = sizeZ*1000/(imgH*max)` to convert image px → game cursor for readout
- **Images displayed at native aspect** (no stretch); markers align fractionally

## Key Files to Know
| File | Purpose |
|------|---------|
| `scripts/build_data.py` | Decodes `MAPS.ZU1`, `KEYWORDDATA.ZU1`; emits `public/data/*.json` |
| `src/lib/data.ts` | All shared types + `loadData()` + coordinate helpers |
| `src/hooks/useMapState.ts` | Single source of truth for map-page state |
| `src/components/map/MapView.tsx` | Leaflet integration; **only place touching Leaflet API** |
| `src/pages/MapPage.tsx` | Layout composition; no logic, just wiring |

## Common Tasks
| Task | Where |
|------|-------|
| Add new marker category | `src/lib/data.ts` → `CATEGORIES` |
| Change coordinate transform | `scripts/build_data.py` (re-run + rebuild) |
| Modify map list UI | `src/components/ui/MapListPanel.tsx` |
| Adjust search behavior | `src/hooks/useMapState.ts` → `results` memo |
| Change floating panel positions | `src/pages/MapPage.tsx` (Tailwind classes) |
| Add Gear tab content | `src/pages/GearPage.tsx` |

## Gotchas
- **Vite runs on IPv6 `::1`** — use `http://[::1]:5173/` or `http://localhost:5173/`
- **Leaflet CSS** imported in `main.tsx` (not via Tailwind) to avoid build errors
- **HeroUI v3** = compound components (`Tabs.ListContainer`, `Tabs.List`, `Tabs.Tab`, `Tabs.Indicator`, `Tabs.Panel`)
- **Dark mode** forced by `class="dark"` on `<html>` in `index.html`
- **Maps without transform** show banner; markers hidden (see `hasTransform`)
- **`build_data.py` must run after any data extraction changes** → `python scripts/build_data.py` then `npm run build`

## Agent Conventions
- **Ponytail mode (full)** active: shortest working diff, stdlib/native first, delete over add
- **Never add deps** unless existing ones can't do it
- **Run `npm run build` before claiming done** — TypeScript + Vite must pass
- **No unrequested docs/readmes** — only code
- **One-line tests** for non-trivial logic: `assert` in `__main__` or `test_*.py`

## Commands
```bash
npm run dev          # dev server (IPv6 ::1:5173)
npm run build        # typecheck + production build
npm run lint         # oxlint
python scripts/build_data.py  # regenerate public/data/*.json
```

## Data Sources (Read-Only)
- `E:\ZUtest\extracted\DATA\MAPS.ZU1` — 161 records, 1316B each, title@0x37, rect@0x54
- `E:\ZUtest\extracted\DATA\KEYWORDDATA.ZU1` — spawns, `hdr[2]` = map id
- `E:\ZUtest\extracted\WORLDS\<LEVEL>.DAT` — world headers via `zutools/zuworld.py`
- `E:\ZUtest\extracted\MAPS\<WORLD>_{MINIMAP,GRAYMAP}.{jpg,ZU3}` — map images