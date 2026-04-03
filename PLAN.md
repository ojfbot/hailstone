# Hailstone TypeScript + Architecture Modernization Plan

Date: 2026-04-03
Status: Proposed

---

## Problem Statement

Hailstone is a 5-year-dormant Chuuk Lagoon wreck-diving map app with 37 JS source files, zero type safety, zero tests, and 20 `window.*` global mutations acting as a state bus across 11 files. The Firebase v8 compat SDK adds ~270KB of dead weight, the build tooling (Webpack 5, node-sass, babel-eslint, ESLint v7) is deprecated or EOL, and innerHTML usage creates XSS vectors. The app cannot be safely extended, tested, or integrated into the Frame ecosystem without a full modernization pass.

**Assumptions:**
- The app will remain a vanilla TS app (no React migration). The factory-function DOM pattern is retained.
- Firebase project and Firestore data remain as-is; only the client SDK changes.
- Mapbox GL JS v2 is retained (no upgrade to v3 unless forced by types).
- GSAP license status is acceptable for current use.
- FirebaseUI may be replaced with custom auth UI if typings prove unworkable.

---

## Proposed Solution

Five sequential phases, each producing a working build before the next begins. No phase requires a feature freeze on another.

### Packages / modules affected

| Area | Current | Target |
|------|---------|--------|
| Bundler | Webpack 5 + Babel + node-sass + dotenv-webpack | Vite 6 (native TS, SCSS, env) |
| Linter | ESLint v7 + babel-eslint + strongloop config | Biome (lint + format, single binary) |
| Test runner | Jest v26 (zero tests) | Vitest |
| Language | JavaScript (37 files) | TypeScript strict |
| State | 20 `window.*` globals across 11 files | Typed `AppContext` module (import/export) |
| Firebase | v8 compat (namespaced) | v10 modular (tree-shakeable) |
| CSS tooling | node-sass + sass (Dart Sass, redundant) | sass (Dart Sass) only, via Vite |

---

## Phase 1: Foundation

**Goal:** Replace build tooling with Vite + Biome + tsconfig. App still runs as JS.

### Work items

1. Add `tsconfig.json` with `allowJs: true`, `strict: false`, `target: "ES2020"`, `module: "ESNext"`, `moduleResolution: "bundler"`, `outDir: "dist"`, `include: ["src"]`.
2. Add `vite.config.ts` replacing `webpack.config.js`. Port env var injection (`MB_TOKEN`, `MB_STYLE`, Firebase config) to Vite's `import.meta.env` with a `.env` file and `envPrefix: ["VITE_"]`. Rename env vars to `VITE_*` prefix.
3. Update `src/index.html` to use Vite's script module entry (`<script type="module" src="/src/index.js">`). Remove Webpack magic comments from dynamic imports.
4. Replace `node-sass` + `sass-loader` + `style-loader` + `css-loader` with Vite's built-in SCSS support (requires only `sass` as a dev dep).
5. Add `biome.json` replacing `.eslintrc`. Configure lint rules equivalent to current setup plus TypeScript-aware checks.
6. Remove deprecated deps: `node-sass`, `babel-eslint`, `babel-loader`, `@babel/preset-env`, `url-loader`, `svg-inline-loader`, `resolve-url-loader`, `nodemon`, `mini-css-extract-plugin`, `compression-webpack-plugin`, `clean-webpack-plugin`, `dotenv-webpack`, `eslint`, `eslint-config-strongloop`, `eslint-plugin-css-modules`, `html-webpack-plugin`, `webpack`, `webpack-cli`, `jest`, `dotenv`.
7. Add dev deps: `vite`, `sass`, `typescript`, `@biomejs/biome`, `vitest`, `@types/mapbox-gl`, `@types/suncalc`.
8. Update `package.json` scripts: `dev` -> `vite`, `build` -> `vite build`, `preview` -> `vite preview`, `lint` -> `biome check .`, `test` -> `vitest run`.
9. Fix repository URL in `package.json` (currently points to `ocommaj/unimatrix-zero.git`).
10. Verify the app builds and runs with `pnpm dev`.

### Acceptance criteria

1. `pnpm dev` starts Vite dev server and the map renders with wreck markers.
2. `pnpm build` produces a `dist/` bundle with no Webpack artifacts.
3. `pnpm lint` runs Biome with zero errors on existing JS files (warnings acceptable).
4. `tsconfig.json` exists with `allowJs: true` and `strict: false`.
5. No deprecated dependencies remain in `package.json`.
6. Environment variables load correctly via `import.meta.env.VITE_*`.
7. SCSS compiles without node-sass (Dart Sass only).
8. `webpack.config.js` is deleted.

---

## Phase 2: State Architecture

**Goal:** Replace all 20 `window.*` global mutations with a typed `AppContext` module.

### Work items

1. Create `src/scripts/context.ts` exporting a typed singleton:
   ```
   AppContext: {
     firebaseClient: FirebaseClientAPI | null
     user: FirebaseUser | null
     userData: UserData | null
     activeModal: ModalInstance | null
     mapCanvas: MapCanvasAPI | null
     wreckFeatures: WreckFeature[]
     updateUserStatusBar: (() => void) | null
     launchAuthUI: (() => void) | null
     hideAuthUI: (() => void) | null
   }
   ```
2. Create `src/scripts/types.ts` with interfaces: `FirebaseClientAPI`, `UserData`, `ImageRecord`, `WreckFeature`, `ModalInstance`, `MapCanvasAPI`, `WreckGalleryDoc`.
3. Replace every `window.<name> =` assignment (20 sites, 11 files) with `import { appContext } from '../context'` + `appContext.<name> =`.
4. Replace every `window.<name>` read with the corresponding `appContext.<name>` import.
5. Delete all `window.*` references from the codebase. Grep must return zero hits for `window.firebaseClient`, `window.user`, `window.userData`, `window.activeModal`, `window.mapCanvas`, `window.wreckFeatures`, `window.updateUserStatusBar`, `window.launchAuthUI`, `window.hideAuthUI`.

### Acceptance criteria

1. Zero `window.*` app-state references in `src/` (Mapbox/Firebase SDK `window` usage excluded).
2. `src/scripts/context.ts` exists and exports a typed `appContext` object.
3. `src/scripts/types.ts` exists with all core interfaces.
4. All 11 files that previously mutated `window.*` now import from `context.ts`.
5. App runs identically to Phase 1 output -- map renders, search works, modals open, auth flow completes.
6. `tsc --noEmit` passes with no errors (under `allowJs: true`, `strict: false`).

---

## Phase 3: Firebase v10

**Goal:** Rewrite Firebase v8 compat SDK usage to v10 modular SDK with typed schemas.

### Work items

1. Upgrade `firebase` package from `^8.2.4` to `^10.x`.
2. Rewrite `_client.js`:
   - `firebase.initializeApp(config)` -> `initializeApp(config)` from `firebase/app`.
   - `firebase.auth()` -> `getAuth(app)` from `firebase/auth`.
   - `firebase.firestore()` -> `getFirestore(app)` from `firebase/firestore`.
   - `firebase.storage()` -> `getStorage(app)` from `firebase/storage`.
   - Storage upload: `ref(storage, path)` + `uploadBytesResumable()` + `getDownloadURL()`.
3. Rewrite `_firestoreQueries.js`:
   - `db.collection('users').doc(uid)` -> `doc(db, 'users', uid)` with `setDoc`/`getDoc`/`updateDoc`.
   - `db.collection('wreckGalleries')` -> `collection(db, 'wreckGalleries')` with typed converters.
   - `FieldValue.arrayUnion` -> `arrayUnion()` from `firebase/firestore`.
4. Rewrite `_userManager.js`:
   - `firebase.auth().signInAnonymously()` -> `signInAnonymously(auth)`.
   - `onIdTokenChanged` -> `onIdTokenChanged(auth, callback)`.
   - Auth providers: `new GoogleAuthProvider()` etc. from `firebase/auth`.
5. Evaluate `firebaseui` compatibility with Firebase v10. If incompatible, replace with a custom auth UI component using `signInWithPopup()` / `signInWithRedirect()`.
6. Add Firestore typed converters using `withConverter<T>()` for `UserData` and `ImageRecord`.
7. Verify tree-shaking: `pnpm build` bundle size for Firebase should drop from ~300KB to ~60KB.

### Acceptance criteria

1. No imports from `firebase` top-level package (all imports are `firebase/app`, `firebase/auth`, `firebase/firestore`, `firebase/storage`).
2. No usage of `firebase.initializeApp`, `firebase.auth()`, `firebase.firestore()`, `firebase.storage()` (namespaced API).
3. Anonymous login, Google/email auth, profile creation, photo upload, upvoting all work against live Firestore.
4. Firestore queries use typed converters (`withConverter<UserData>`, `withConverter<ImageRecord>`).
5. `pnpm build` output size for Firebase-related chunks is under 80KB (gzipped).
6. `firebaseui` is either upgraded to a v10-compatible version or replaced with custom auth UI.
7. `tsc --noEmit` passes.

---

## Phase 4: Incremental TypeScript Conversion

**Goal:** Rename all 37 `.js` files to `.ts`, add explicit types to every export and parameter.

### Conversion order (by dependency depth, least-dependent first)

| Batch | Files | Rationale |
|-------|-------|-----------|
| 1 | `types.ts`, `context.ts` | Already `.ts` from Phase 2 |
| 2 | `animations/_modal.ts`, `animations/_upvoteGraphic.ts`, `animations/index.ts` | Pure functions, no app state deps |
| 3 | `firebase/_client.ts`, `firebase/_firestoreQueries.ts`, `firebase/_userManager.ts`, `firebase/index.ts` | Already rewritten in Phase 3, types from Phase 2 |
| 4 | `mapbox/_flyCamera.ts`, `mapbox/_formatMap.ts`, `mapbox/_loadMap.ts`, `mapbox/_mapEvents.ts`, `mapbox/index.ts` | `@types/mapbox-gl` provides most types |
| 5 | `components/_buoyIcon.ts`, `components/_galleryImage.ts`, `components/_controlToggler.ts`, `components/_applauseButton.ts`, `components/_controlWrapper.ts`, `components/_searchBar.ts`, `components/_userStatusBar.ts`, `components/index.ts` | DOM factories, depend on types + context |
| 6 | `controllers/_urlQueryListener.ts`, `controllers/index.ts` | Small, depends on mapbox + modals |
| 7 | `modals/` (all 16 files) | Largest group, depends on everything above |
| 8 | `scripts/index.ts`, `index.ts` | Entry points, convert last |

### Work items per file

1. Rename `.js` -> `.ts`.
2. Add parameter types to all function signatures.
3. Add return type annotations to all exported functions.
4. Replace `any` with specific types (using interfaces from `types.ts`).
5. Fix all `tsc` errors introduced by the rename.
6. Replace `var` with `const`/`let` (2 instances in `_userManager.js`).
7. Remove dead code: empty `handleAppleSignIn`, unused `parseAppleProfile`, unused `flyMap` assignment in `_searchBar.js`.

### Acceptance criteria

1. Zero `.js` files in `src/` (all renamed to `.ts`).
2. `tsc --noEmit` passes with `strict: false`.
3. No `any` types except where third-party types are genuinely unavailable (documented with `// TODO: type` comment).
4. All exported functions have explicit return types.
5. All function parameters are typed.
6. No `var` usage anywhere in `src/`.
7. Dead code removed: `handleAppleSignIn`, `parseAppleProfile`, unused `flyMap` in `_searchBar.ts`.
8. App functionality unchanged -- map, search, auth, upload, upvote all work.

---

## Phase 5: Hardening

**Goal:** Enable `strict: true`, add tests, fix security issues, add accessibility.

### Work items

1. **tsconfig strict mode:**
   - Set `strict: true` in `tsconfig.json`.
   - Remove `allowJs: true`.
   - Fix all new strict-mode errors (primarily `strictNullChecks` on optional chaining for `appContext.*` properties).

2. **Vitest test suite:**
   - Unit tests for `_firestoreQueries.ts` query construction (mock Firestore).
   - Unit tests for `_searchBar.ts` regex matching and result filtering.
   - Unit tests for `_userManager.ts` profile parsing (each provider: Google, Twitter, Facebook, email).
   - Unit tests for `_flyCamera.ts` options construction.
   - Unit tests for `context.ts` state management.
   - Unit tests for `_customDropdown.ts` keyboard navigation logic.
   - Integration test for `_uploadForm.ts` submit flow (mock Firebase Storage).
   - Target: >60% line coverage on `src/scripts/`.

3. **XSS fix:**
   - Replace `innerHTML` with `textContent` in `_profileField.ts` where user data is rendered.
   - Audit all other `innerHTML` usage; replace with `textContent` or sanitized insertion where user-controlled data is involved.

4. **Accessibility:**
   - Add `role="dialog"` and `aria-modal="true"` to modal elements in `_modalBase.ts`.
   - Add `aria-label` to all interactive elements without visible text (icon buttons: shaka, camera-add, binoculars).
   - Add `aria-live="polite"` region for search results in `_searchBar.ts`.
   - Add focus trap to modals (trap Tab/Shift+Tab within modal while open).
   - Add Escape key to close modals.
   - Add `aria-expanded` to `_customDropdown.ts`.

5. **Static HTML extraction:**
   - Move `_privacyPolicy.js` (~46K tokens) and `_termsOfService.js` to static `.html` files in `src/assets/legal/`.
   - Load via `fetch()` or Vite's `?raw` import.

6. **Firestore security rules:**
   - Add `firestore.rules` to the repository root.
   - Document the access patterns (users can read/write their own doc, wreckGalleries are world-readable, image writes require auth).

### Acceptance criteria

1. `tsconfig.json` has `strict: true` and no `allowJs`.
2. `tsc --noEmit` passes under strict mode.
3. `pnpm test` runs Vitest with >60% line coverage on `src/scripts/`.
4. Zero `innerHTML` assignments with user-controlled data.
5. All modals have `role="dialog"`, `aria-modal="true"`, focus trap, and Escape-to-close.
6. `_customDropdown.ts` has `aria-expanded`, `aria-activedescendant`, and `role="listbox"`.
7. Search results region has `aria-live="polite"`.
8. Privacy policy and TOS are static files, not JS string exports.
9. `firestore.rules` exists in repository root.
10. No `any` types in the codebase (except documented third-party gaps).

---

## Test Matrix

| Scenario | Input / State | Expected Output | Test Type |
|----------|--------------|-----------------|-----------|
| Wreck search matches partial name | Type "Fuj" in search bar | Results include "Fujikawa Maru" | Unit |
| Wreck search no match | Type "xyz123" in search bar | Empty results list | Unit |
| Wreck search keyboard nav | Arrow down through results | Active index increments, wraps at end | Unit |
| Profile parser: Google provider | Google auth response object | `{ displayName, email, pictureURL }` populated | Unit |
| Profile parser: Twitter provider | Twitter auth response object | `{ displayName, pictureURL }` populated, no email | Unit |
| Profile parser: email provider | Email auth response object | `{ email }` populated, no pictureURL | Unit |
| Fly camera constructs correct options | WreckFeature with coords | FlyToOptions with center, zoom, bearing, pitch | Unit |
| AppContext state isolation | Set `appContext.user`, read from another module | Same reference returned | Unit |
| Custom dropdown keyboard nav | Press ArrowDown, Enter | Active option changes, selection confirmed | Unit |
| Firestore user creation | New auth user object | `setDoc` called with correct path and typed data | Unit (mock) |
| Firestore upvote increment | Image ID + user ID | `updateDoc` with `increment(1)` and `arrayUnion` | Unit (mock) |
| Upload form validation | No file selected, submit clicked | Submit blocked, no Firebase call | Unit |
| Upload form progress | File upload in progress | Progress bar updates from 0 to 100 | Integration (mock) |
| Firebase v10 tree-shaking | `pnpm build` | Firebase chunks < 80KB gzipped | Build verification |
| innerHTML XSS prevention | User data containing `<script>alert(1)</script>` | Rendered as text, not executed | Unit |
| Modal focus trap | Tab from last focusable element | Focus returns to first focusable element | Unit |
| Modal Escape close | Press Escape while modal open | Modal closes, focus returns to trigger | Unit |
| ARIA attributes present | Render modal | `role="dialog"`, `aria-modal="true"` in DOM | Unit |
| Vite dev server starts | `pnpm dev` | Server on localhost, map renders | Manual / E2E |
| Production build | `pnpm build` | `dist/` contains index.html + hashed assets | Build verification |
| Strict mode compilation | `tsc --noEmit` with `strict: true` | Zero errors | Build verification |

---

## Open Questions

1. **FirebaseUI v10 compatibility:** Does `firebaseui@^4.7.3` work with `firebase@^10.x`? If not, the auth UI must be rebuilt as a custom component. This should be spiked early in Phase 3.
2. **Mapbox GL JS v2 token billing:** Is the current `MB_TOKEN` still active? Does the Mapbox account have billing configured for continued development use?
3. **GSAP license:** GSAP is free for non-commercial use. If Hailstone has any commercial context (Dirty Dozen Expeditions), verify the license tier.
4. **Firestore data migration:** Are there any Firestore schema changes needed for v10 typed converters, or do the existing documents match the planned `UserData` / `ImageRecord` interfaces exactly?
5. **Deployment target:** Where will the modernized app be deployed? Vercel (consistent with Frame ecosystem) or Firebase Hosting (existing)?
6. **include-media SCSS library:** Keep or replace with native CSS `@container` / `@media` queries? The library is small but adds a dependency.

---

## ADR Stub: TypeScript Migration Strategy

> Save this ADR to `decisions/adr/` with: `/adr new "Hailstone TypeScript Migration Strategy"`

### ADR-0036: Hailstone TypeScript Migration Strategy

Date: 2026-04-03
Status: Proposed
OKR: N/A
Commands affected: N/A
Repos affected: hailstone

---

#### Context

Hailstone is a 5-year-dormant vanilla JS app with 37 source files, zero type safety, and a `window.*` global state bus (20 mutations, 11 files). The Firebase v8 compat SDK is deprecated, the build tooling (Webpack 5, node-sass, babel-eslint) is EOL, and there are no tests. The app cannot be safely modified, tested, or integrated into the Frame ecosystem without modernization.

The question is whether to do a big-bang rewrite or an incremental migration, and which build tooling to adopt.

#### Decision

Migrate incrementally across five phases: (1) Vite + Biome + tsconfig with `allowJs:true`, (2) typed AppContext replacing window globals, (3) Firebase v10 modular rewrite, (4) file-by-file `.js` -> `.ts` rename in dependency order, (5) `strict:true` + tests + hardening. Each phase produces a working build.

Use Vite (not Webpack) for consistency with the Frame ecosystem. Use Biome (not ESLint v9) for single-binary lint+format. Retain vanilla TS with factory-function DOM pattern (no React migration).

#### Consequences

##### Gains
- Type safety catches bugs at compile time across all 37 files.
- Firebase v10 modular SDK cuts ~220KB from the bundle via tree-shaking.
- Vite provides sub-second HMR and native TS/SCSS support with near-zero config.
- AppContext module makes state flow explicit and testable.
- Each phase is independently shippable -- no all-or-nothing risk.

##### Costs
- Firebase v8 -> v10 is a full API rewrite of 3 files (~455 lines), not a mechanical rename.
- FirebaseUI may be incompatible with v10, requiring a custom auth UI replacement.
- Five phases means the codebase is in a mixed JS/TS state during Phases 1-3.

##### Neutral
- Factory-function DOM pattern is preserved. A future React migration would be a separate decision.
- GSAP and Mapbox GL JS APIs are largely unchanged between JS and TS usage.

#### Alternatives considered

| Alternative | Why rejected |
|-------------|--------------|
| Big-bang rewrite to React + TS | Too much scope for a dormant app; factory pattern works fine; no componentization benefit without ongoing feature work |
| Keep Webpack, add TS only | Webpack 5 config is simple but Vite is zero-config for TS/SCSS and aligns with Frame ecosystem tooling |
| ESLint v9 flat config + Prettier | Two tools where Biome does both; Biome is faster and has better TS integration |
| Skip Firebase v10, keep compat | Compat SDK is ~300KB, deprecated, and blocks typed Firestore converters |

---

## Suggested Next Command

```
/scaffold Hailstone Phase 1 foundation: tsconfig.json, vite.config.ts, biome.json, package.json updates, remove deprecated deps
```
