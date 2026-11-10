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
├── index.css               # @import "@heroui/styles"; dark theme vars + `.cat-icon` mask css
├── vite.config.ts          # Vite + @tailwindcss/postcss plugin
├── hooks/
│   ├── useData.ts          # Loads maps/points/transform JSON
│   ├── useMapState.ts      # All map-page state (slug, visible, cursor, search, etc.)
│   ├── useItems.ts         # Lazy item/sets/star loaders (thin wrapper over lib/items.ts)
│   └── usePets.ts          # Pet list loader
├── lib/
│   ├── data.ts             # Types, loadData(), coordinate helpers, CATEGORIES, catColor
│   ├── items.ts            # Item[]/StarCurves/GearSet loaders + enhance math
│   ├── icons.ts            # iconClass(item.icon) → sprite-sheet css classes
│   ├── builds.ts           # Named builds in localStorage (max 10), no React
│   ├── pets.ts             # Pet stat model (tooltip/panel/power) + sprite icon names
│   ├── skills.ts           # Class skills: ranks, points cost, effect values
│   └── talents.ts          # Talent tree data + talentPoints(level) + TREE_NAMES
├── pages/
│   ├── MapPage.tsx         # Map tab: composes SidePanel, SavedPanel, CursorReadout, MapView
│   └── gear/
│       ├── GearPage.tsx    # Gear tab: BuildProvider + Character/Stats boxes + the Pet|Talent tabs
│       └── gear.css        # gear-page palette/box/gear styling
├── components/
│   ├── ui/
│   │   ├── SidePanel.tsx        # Top-right: category grid + tabs (map/NPC/monster/search) + the list
│   │   ├── SavedPanel.tsx       # Bottom-left: current-map thumbnail + the saved (pinned) points
│   │   ├── CategoryPanel.tsx    # HeroUI Tabs: category tab toggles inside the search panel
│   │   ├── CursorReadout.tsx    # Bottom-left: shows "x N y N"
│   │   └── TopTabs.tsx          # Top bar: Logo (disabled), Map, Gear
│   ├── map/
│   │   └── MapView.tsx          # Leaflet map: image overlay + divIcon markers, CRS.Simple
│   └── gear/
│       ├── BuildContext.tsx      # Build state: classId/level/title/hasPet + gear + pet
│       ├── BuildsHeader.tsx      # Save/load named builds (localStorage via lib/builds.ts)
│       ├── CharacterGear.tsx     # Level/Title inputs + 6 L slots / 3D view / 5 R slots + Pet
│       ├── PlayerStats.tsx       # 13 player stat rows
│       ├── GearPicker.tsx        # Item picker modal (class/slot/grade grouped)
│       ├── GearDrawer.tsx        # Right drawer: rank, enhance, elements, attributes, set
│       ├── GearTooltip.tsx / tipText.tsx  # The hover tooltip, the game's wording
│       ├── ClassSkills.tsx       # The class skill list ("the I key view")
│       ├── gearSlots.ts          # Slot maps, uniqueItems(), elementNumber math, pretty()
│       ├── GearSlot.tsx / GearColumn.tsx / GearViewer.tsx / StatRow.tsx
│       ├── talent/
│       │   ├── TalentTrees.tsx   # 3 trees × PointNeed bands, icons + CSS tooltips
│       │   └── talentLogic.ts    # nodeStates(): the game's open/prereq/point rules
│       ├── pet/
│       │   ├── PetGear.tsx       # Pet level + 2/2 pet slots + S1-S8 spells
│       │   ├── PetGearPicker.tsx # Pet gear picker
│       │   ├── PetPicker.tsx     # Species picker, EGG_GROUPS (hand-kept)
│       │   ├── PetStats.tsx      # 15 pet stat rows
│       │   └── usePetStats.ts    # Pet stat rows ("—" when no pet)
│       └── generated/            # GENERATED — do not edit by hand
│           ├── classData.ts      # per-class, per-level stat curves (RACE.ZU1)
│           ├── titles.ts         # TITLES[] from TITLE.tsv
│           ├── refineData.ts     # per-slot potential attributes (REFINE.ZU1)
│           ├── attrData.ts       # attribute tooltip text (ITEMATT.ZU1)
│           ├── elementWheel.ts   # five-element wheel + per-set multipliers
│           ├── gearSprites.ts    # icon name → gear sprite css classes
│           └── petSprites.ts     # pet icon name → pet sprite css classes
└── assets/
    ├── logo.bmp           # 64×64 logo for top tab bar
    ├── icons/*.bmp        # raw item icons (from ITEMS +588 icon paths)
    └── sprites/           # packed PNG sheets (5 class + pet) + their css
```

## Data Flow
1. `App` → `useData()` fetches `/data/{maps,points,transform}.json` (built by `scripts/build_data.py`)
2. `App` passes `data` to `MapPage` (Map tab) or `GearPage` (Gear tab)
3. `MapPage` → `useMapState(data)` derives all interactive state
4. State passed to floating panels (`SidePanel`, `SavedPanel`, `CategoryPanel`, `CursorReadout`)
5. `MapView` receives `meta`, `transform`, `points`, `visible`, `onCursor`, `focus`



## Key Files to Know
| File | Purpose |
|------|---------|
| `src/lib/data.ts` | All shared types + `loadData()` + coordinate helpers |
| `src/hooks/useMapState.ts` | Single source of truth for map-page state |
| `src/components/map/MapView.tsx` | Leaflet integration; **only place touching Leaflet API** |
| `src/pages/MapPage.tsx` | Layout composition; no logic, just wiring |

## The side panel (the in-game "Search" dialog + the map list)
`SidePanel.tsx` (renamed from `SearchPanel` — it also hosts the map list) has
four tabs (Map first, the default):
- **Map** — the map switcher (all maps, active highlighted, click to jump)
- **NPC** — the current map's NPCs: name · **function** · (x,y) in map units
- **Monster** — the current map's monsters: name · **level** · (x,y)
- **Search** — the global name search over every point (all maps)

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

## The saved panel (SavedPanel.tsx, bottom-left)
Clicking a **map marker** pins the point; clicking it again unpins (the pinned
marker gets a gold ring, `.marker-saved` in `src/index.css`). The panel stacks
a **static thumbnail** of the current map (aspect-ratio box + `<img>`, pinned
points as `.cat-icon` dots positioned by the transform) over the **saved
list**: category icon · name · map name, click jumps via `handleResultClick`
(switches maps). State is `saved` (insertion-ordered ids) + `savedSet` in
`useMapState` — session-only, clears on refresh. Nothing re-renders except on
map switch or pin/unpin.

The thumb also shows the **main map's viewport rectangle** (gold border):
`MapView` reports its view on `moveend` (`getBounds()` clamped to the pixel
box, as fractions) through `onViewport` into `useMapState`'s `viewport`
state, and the panel draws it; hidden on maps without a transform.

**Minimap orientation (measured, 2026-11-02):** Leaflet's lat axis runs up;
the art file's **top edge holds the high-gz content** (image top edge reads
cursor y ≈ 811, bottom ≈ −22 — verified against the game-verified readout
frame), so the thumb maps a pixel as `top = 1 − py/t.h` and the rectangle as
`top = 1 − (y + h)`. The thumb's **aspect is the transform box** `t.w/t.h` —
the overlay stretches the image to that box, and it can differ a lot from
`meta.width/height` (Miracle Town 1024×817 vs 1885×819), which would skew
both the image and the dot positions.

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
