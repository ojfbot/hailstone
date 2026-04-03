# CLAUDE.md

## What is Hailstone

Interactive 3D wreck-diving map of Chuuk (Truk) Lagoon built on Mapbox GL JS with Firebase auth/storage and a photo gallery with upvoting. Renders ~30 WWII shipwreck locations as map markers.

## Current state

Vanilla JavaScript, mid-TypeScript migration (Phase 1 complete: Vite + Biome + tsconfig scaffolded, `.js` files not yet renamed). See [RECON.md](./RECON.md) for full architecture assessment and [PLAN.md](./PLAN.md) for the 5-phase migration plan.

## Build

```bash
pnpm install
pnpm dev          # Vite dev server
pnpm build        # tsc type-check + Vite production build
pnpm preview      # Preview production build
pnpm type-check   # tsc --noEmit
pnpm lint         # Biome check
pnpm lint:fix     # Biome auto-fix
```

## Key directories

```
src/
  index.html          # HTML entry (single div#mainMap)
  index.js            # JS entry (imports styles, lazy-loads scripts)
  assets/
    wreckLocations.json   # GeoJSON FeatureCollection (~30 wrecks)
    icons/                # SVG icons
  scripts/
    index.js              # Main orchestrator: Firebase -> Map -> Controls
    firebase/             # Auth, Firestore queries, Storage uploads
    mapbox/               # Map init, camera, events, 3D sky layer
    components/           # DOM factory functions (search, controls, gallery)
    modals/               # Modal system (wreck gallery, user profile, site info)
    animations/           # GSAP timeline animations
    controllers/          # URL deep-link handler
  styles/                 # SCSS (main.scss + component partials)
  types/
    index.ts              # Shared TypeScript interfaces
```

## Environment variables

Firebase credentials and Mapbox token are loaded via Vite's `import.meta.env`. Create a `.env` file with `VITE_` prefixed vars (see `src/env.d.ts` for the full list). Never commit `.env` or credentials.

## Frame OS context

> Before making any cross-repo architectural decisions, read `domain-knowledge/frame-os-context.md`.
