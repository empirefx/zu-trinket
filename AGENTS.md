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
│   └── GearPage.tsx        # Gear tab: build planner
├── components/
│   ├── ui/
│   │   ├── SearchPanel.tsx      # Top-left: input + results popover (click to jump)
│   │   ├── MapListPanel.tsx     # Left-middle: scrollable list of all 64 maps, active highlighted
│   │   ├── CategoryPanel.tsx    # Top-right: checkbox toggles with color dots + counts
│   │   ├── CursorReadout.tsx    # Bottom-left: shows "x N y N"
│   │   └── TopTabs.tsx          # Top bar: Logo (disabled), Map, Gear
│   ├── map/
│   │   └── MapView.tsx          # Leaflet map: image overlay + circle markers, CRS.Simple
│   └── gear/
│       ├── ClassSelect.tsx      # Class/race selection (12 options from NEWCHAR.LUA)
│       ├── StatDisplay.tsx      # Base/level stats display
│       ├── GearSlots.tsx        # Equipment slots (L1-L6, R1-R6, B1-B4)
│       └── PetGear.tsx          # Pet gear & spells
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

## Character Build Data (Gear Page)

### Game Data Sources (Read-Only)
- `E:\ZUtest\extracted\DATA\FORMULA.tsv` — 130+ stat formulas using attributes
- `E:\ZUtest\extracted\DATA\PKLEVEL.ZU1` — 107 level records (72 bytes/rec, 18 uint32 = base stats per level)
- `E:\ZUtest\extracted\DATA\CHAR.ZU1` (4917B), `RACE.ZU1` (40588B) — base stats per class/race
- `E:\ZUtest\extracted\DATA\NEWCHAR.LUA` — 12 character classes (radio buttons CMD01-CMD12)
- `E:\ZUtest\extracted\INTERFACE\SCRIPT\HUD_PROPERTY.LUA` — character panel UI (stats display logic)
- `E:\ZUtest\extracted\DATA\TALENTS.tsv` — talent/skill names
- `E:\ZUtest\extracted\DATA\SUITATTRIBUTEINTRO.tsv` — suit/set bonuses
- `E:\ZUtest\extracted\DATA\ITEMS*.tsv` — equipment items
- `E:\ZUtest\extracted\DATA\PETSTAR.ZU1`, `PETEVOLVE.ZU1` — pet growth

### Attribute Names (from FORMULA.tsv)
| Code | Meaning |
|------|---------|
| `A:CPR` | Physical Critical Rate / Power |
| `A:CYR` | Critical Y Rate |
| `A:CPS` | Physical Speed / Attack Speed |
| `A:CPI` | Physical Intelligence / Power |
| `A:CIA` | Internal Attack |
| `A:CXA` | External Attack |
| `A:CY` | Critical Y |
| `A:CP` | Critical Power |

### Level-Up Stats (PKLEVEL.ZU1)
- 107 levels, 18 uint32 values per level = base stats at each level
- Rec size 72 bytes (18 × uint32), count = 107
- Likely stats: HP, MP, Atk, Def, MDef, Hit, Dodge, Parry, Crit, etc. per level

### Character Classes (from NEWCHAR.LUA - 12 radio buttons)
Classes correspond to NEWCHAR_CMD01 through NEWCHAR_CMD12 radio buttons. Need to map CMD01-12 to actual class names via string table (`string_newchar_txt*`).

### Gear Slots (from skeleton.html / NEWCHAR.LUA)
| Slot | Position | Type |
|------|----------|------|
| L1 | Precious | Character |
| L2 | Weapon | Character |
| L3 | SpiritWeapon | Character |
| L4 | SpiritArmor | Character |
| L5 | FortuneGear | Character |
| L6 | Trinket | Character |
| R1 | Headband | Character |
| R2 | Clothes | Character |
| R3 | WaistbandDecorator | Character |
| R4 | Armguards | Character |
| R5 | Boots | Character |
| R6 | Pet | Character |
| B1 | FashionHead | Character (bottom row) |
| B2 | FashionBody | Character (bottom row) |
| B3 | FashionWeapon | Character (bottom row) |
| B4 | FashionWings | Character (bottom row) |
| L1 | PetGearEyes | Pet |
| L2 | PetGearInnerBolus | Pet |
| R1 | PetGearFeetDecoration | Pet |
| R2 | PetGearSaddle | Pet |
| S1-S8 | Pet Spells | Pet (8 slots) |

### Pet Stats
- Level, Satiety, Intimacy, Health, Aptitudes (Life/Mana/Atk/PD/MD), Savvy
- Pet gear: Eyes, Inner Bolus, Feet Decoration, Saddle
- Pet spells: 8 slots (S1-S8)

### Stat Display Names (from HUD_PROPERTY.LUA / skeleton.html)
| Stat | Display Name |
|------|--------------|
| Fighting Power | Fighting Power |
| Health | Health (current/max) |
| Mana | Mana (current/max) |
| Damage | Damage (min~max + bonus) |
| PD | Physical Defense (+bonus) |
| MD | Magical Defense (+bonus) |
| Dodge | Dodge % |
| Parry | Parry % (+bonus%) |
| Critical | Critical % (+bonus%) |
| Garrote | Garrote % (+bonus%) |
| Atk Speed | Atk Speed (value) |
| Movement | Movement (+bonus) |
| Gear Loss Rate | Gear Loss Rate % |

Pet Stats:
| Stat | Display Name |
|------|--------------|
| Max HP Bonus | Max HP Bonus |
| Max MP Bonus | Max MP Bonus |
| Attack Bonus | Attack Bonus |
| PD Bonus | PD Bonus |
| MD Bonus | MD Bonus |
| Speed+ | Speed+% |
| Satiation | Satiation (current/max) |
| Intimacy | Intimacy (current/max) |
| Health | Health |
| Life Aptitude | Life Aptitude (current/max) |
| Mana Aptitude | Mana Aptitude (current/max) |
| Attack Apt. | Attack Apt. (current/max) |
| PD Aptitude | PD Aptitude (current/max) |
| MD Aptitude | MD Aptitude (current/max) |
| Savvy | Savvy |

### Key Files to Know (Extended)
| File | Purpose |
|------|---------|
| `scripts/build_data.py` | Decodes `MAPS.ZU1`, `KEYWORDDATA.ZU1`; emits `public/data/*.json` |
| `src/lib/data.ts` | All shared types + `loadData()` + coordinate helpers |
| `src/hooks/useMapState.ts` | Single source of truth for map-page state |
| `src/components/map/MapView.tsx` | Leaflet integration; **only place touching Leaflet API** |
| `src/pages/MapPage.tsx` | Layout composition; no logic, just wiring |
| `src/pages/gear/GearPage.tsx` | Build planner main page |
| `src/pages/gear/components/ClassSelect.tsx` | Class/race picker (12 classes) |
| `src/pages/gear/components/StatDisplay.tsx` | Base stats + level scaling |
| `src/pages/gear/components/GearSlots.tsx` | Equipment slots grid |
| `src/pages/gear/components/PetGear.tsx` | Pet gear + spells |

## Common Tasks
| Task | Where |
|------|-------|
| Add new marker category | `src/lib/data.ts` → `CATEGORIES` |
| Change coordinate transform | `scripts/build_data.py` (re-run + rebuild) |
| Modify map list UI | `src/components/ui/MapListPanel.tsx` |
| Adjust search behavior | `src/hooks/useMapState.ts` → `results` memo |
| Change floating panel positions | `src/pages/MapPage.tsx` (Tailwind classes) |
| Add Gear tab content | `src/pages/gear/GearPage.tsx` + components |
| Add new stat formula | Parse `FORMULA.tsv`, implement in `StatDisplay` |
| Parse base stats from CHAR.ZU1 | Write parser, add to `StatDisplay` |
| Parse level scaling from PKLEVEL.ZU1 | Write parser, add to `StatDisplay` |

## Gotchas
- **Vite runs on IPv6 `::1`** — use `http://[::1]:5173/` or `http://localhost:5173/`
- **Leaflet CSS** imported in `main.tsx` (not via Tailwind) to avoid build errors
- **HeroUI v3** = compound components (`Tabs.ListContainer`, `Tabs.List`, `Tabs.Tab`, `Tabs.Indicator`, `Tabs.Panel`)
- **Dark mode** forced by `class="dark"` on `<html>` in `index.html`
- **Maps without transform** show banner; markers hidden (see `hasTransform`)
- **`build_data.py` must run after any data extraction changes** → `python scripts/build_data.py` then `npm run build`
- **Binary ZU1 files** need custom parsers (different record sizes per file)

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
- `E:\ZUtest\extracted\DATA\FORMULA.tsv` — 130+ stat formulas
- `E:\ZUtest\extracted\DATA\PKLEVEL.ZU1` — 107 levels × 18 stats
- `E:\ZUtest\extracted\DATA\CHAR.ZU1` / `RACE.ZU1` — base stats per class/race
- `E:\ZUtest\extracted\INTERFACE\SCRIPT\NEWCHAR.LUA` — 12 character classes
- `E:\ZUtest\extracted\INTERFACE\SCRIPT\HUD_PROPERTY.LUA` — character panel UI