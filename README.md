# Zu Online Map & Build Planner

A web tool for the MMORPG **Zu Online**. Two tabs:

- **Map** — a full-screen interactive overworld map (React + Leaflet) showing
  mob spawns, objects and NPCs for every map, with a map switcher, per-category
  toggles, a name search that jumps to markers, pinnable (saved) points and a
  cursor readout in the game's own map units — so readings can be compared
  1:1 with the in-game map.
- **Gear** — a character build planner: 5 selectable classes, level and title
  inputs, per-slot equipment with real item stats from the game's item table
  (upgrade ranks, enhance stars, five elements, potential attributes, set
  bonuses), class stat curves, pets (stats, gear, spells), the class talent
  trees and the class skill list, plus named builds saved in localStorage.

## To-do, missing, server side, etc.

- [ ] Refines page

**Map**
 - [ ] Brigand and Treasure chests categories

 **Gear**

 - [ ] All classes missing one weapon suit lvl 9 icon
 - [ ] SW suit lvl 9 and epic lvl 7 icon no match
 - [ ] Classes level stats
 - [ ] Pet stats and Pet(star/moon/sun) calculations
 - [ ] Character/Pet/Gear Fighting Power calculation
 - [ ] Add suffixes anti-/resist fields differs from gear parts and suit/epic. Affected by rank
 - [ ] Add common spirit weapon, spirit armor, waistband decorator
 - [ ] Add HP Chain Bonus(legendary)


## Stack

React 19 · TypeScript · Vite 8 · Leaflet 1.9 (CRS.Simple) · HeroUI 3 + Tailwind CSS 4

## Commands

```bash
npm run dev          # dev server on http://localhost:5173 (IPv6 ::1)
npm run build        # typecheck + production build
npm run lint         # oxlint
```

For the full architecture, coordinate system, data formats and conventions,
read [`AGENTS.md`](AGENTS.md) — it is the detailed project reference.
