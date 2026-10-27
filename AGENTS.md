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
│   └── gear/
│       ├── GearPage.tsx    # Gear tab: BuildProvider + Character/Stats boxes + the Pet|Talent tabs
│       └── gear.css        # gear-page palette/box/gear styling
├── components/
│   ├── ui/
│   │   ├── SearchPanel.tsx      # Top-right: category grid + tabs (search/NPC/monster) + the list
│   │   ├── MapListPanel.tsx     # Left-middle: scrollable list of all 64 maps, active highlighted
│   │   ├── CategoryPanel.tsx    # HeroUI Tabs: category tab toggles inside the search panel
│   │   ├── CursorReadout.tsx    # Bottom-left: shows "x N y N"
│   │   └── TopTabs.tsx          # Top bar: Logo (disabled), Map, Gear
│   ├── map/
│   │   └── MapView.tsx          # Leaflet map: image overlay + circle markers, CRS.Simple
│   └── gear/
│       ├── BuildContext.tsx      # Build state: classId/level/title/hasPet + togglePet
│       ├── usePlayerStats.ts     # Player stat rows (applies class curve + title mods)
│       ├── usePetStats.ts        # Pet stat rows ("—" when no pet)
│       ├── classData.ts          # GENERATED: per-class, per-level curves (do not edit)
│       ├── titles.ts             # GENERATED: TITLES[] from TITLE.tsv
│       ├── CharacterGear.tsx     # Level/Title inputs + 6 L slots / 3D view / 5 R slots + Pet
│       ├── PlayerStats.tsx       # 13 player stat rows
│       ├── PetGear.tsx           # Pet level + 2/2 pet slots + S1-S8 spells
│       ├── PetStats.tsx          # 15 pet stat rows
│       └── Box.tsx / GearSlot.tsx / GearColumn.tsx / GearViewer.tsx / StatRow.tsx
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
| `src/lib/data.ts` | All shared types + `loadData()` + coordinate helpers |
| `src/hooks/useMapState.ts` | Single source of truth for map-page state |
| `src/components/map/MapView.tsx` | Leaflet integration; **only place touching Leaflet API** |
| `src/pages/MapPage.tsx` | Layout composition; no logic, just wiring |

## The search panel (the in-game "Search" dialog)
`SearchPanel.tsx` has three tabs, like the game's dialog
(`zu-re/docs/search-ui.md`):
- **Search** — the global name search over every point (all maps)
- **NPC** — the current map's NPCs: name · **function** · (x,y) in map units
- **Monster** — the current map's monsters: name · **level** · (x,y)

A row only shows the middle column when there is something to show (no
function / no known level → the column is dropped, not filled with a dash).
The **category panel** renders as a **HeroUI `Tabs` tab group**
(`CategoryPanel.tsx`): one tab per category, but the tabs toggle (multi-select)
— RAC Tabs is single-select, so `selectedKey` stays `""` and
`onSelectionChange(key)` toggles the category; the selected look comes from the
`visible` set, not from RAC's `aria-selected`. Each tab shows a **mask icon**
(`.cat-icon .cat-<key>` in `src/index.css`, currentColor + SVG masks; the
Object tab is a radial dot). The `CATEGORIES` colors in `lib/data.ts` match
the icon colors, so tabs and map markers agree. Map markers use the same
icons: `MapView.tsx` draws each point as an `L.divIcon`
(`<span class="cat-icon cat-<key> marker-icon">`, 20 px, `.marker-icon`
adds a 1 px drop-shadow for contrast), replacing the old circle markers.The game's fourth tab (the "Yellows" — the strong mobs) is not listed: the
client's colour rule for it was not pinned down, so there is no honest cut to
make.

The *function* and the *level* come from `OBJS.ZU1` (title @+30, level
@0xA0), matched to the keyword points **by name**; `build_data.py` emits them
as `func` / `level` per point.  The coordinates are the game's **map units**
(`(world - rect.min) * 1000 / max(sizeX,sizeZ)`) — the same numbers the
in-game cursor readout shows, so the panel can be compared with the game.

## Character Build Data (Gear Page)

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

## Gotchas
- **Vite runs on IPv6 `::1`** — use `http://[::1]:5173/` or `http://localhost:5173/`
- **Leaflet CSS** imported in `main.tsx` (not via Tailwind) to avoid build errors
- **HeroUI v3** = compound components (`Tabs.ListContainer`, `Tabs.List`, `Tabs.Tab`, `Tabs.Indicator`, `Tabs.Panel`)
- **Dark mode** forced by `class="dark"` on `<html>` in `index.html`
- **Maps without transform** show banner; markers hidden (see `hasTransform`)

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
```
