# Hailstone -- Codebase Reconnaissance Report

**Date:** 2026-04-03
**Last commit activity:** April 2021 (~5 years dormant)
**Repository origin:** `git://github.com/ocommaj/unimatrix-zero.git`

---

## Overview

Hailstone is an interactive 3D wreck-diving map of Chuuk (Truk) Lagoon built on Mapbox GL JS v2's 3D terrain/sky/camera APIs with Firebase for user authentication, photo storage, and a wreck-photo gallery with upvoting. The app renders ~30 WWII shipwreck locations as map markers, lets users search wrecks, fly the camera to them, browse and upload dive photos, and manage user profiles. It was embedded on the Dirty Dozen Expeditions commercial dive site and had live users.

---

## Stack

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `firebase` | ^8.2.4 | Auth (anonymous + Google/Twitter/Facebook/email), Firestore DB, Storage |
| `firebaseui` | ^4.7.3 | Pre-built sign-in UI widget (popup flow, anonymous upgrade) |
| `mapbox-gl` | ^2.0.1 | 3D map rendering, sky layer, terrain, camera fly-to, feature querying |
| `gsap` | ^3.6.0 | Modal reveal/collapse/replace animations, upvote "+1" float animation |
| `suncalc` | ^1.8.0 | Calculates real sun position for Mapbox sky layer atmosphere rendering |
| `dotenv` | ^8.2.0 | Environment variable loading (unused at runtime -- webpack handles it) |

### Dev Dependencies

| Package | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `webpack` | ^5.6.0 | Bundler | Early Webpack 5 -- current is 5.9x |
| `webpack-cli` | ^4.2.0 | CLI | Current is 5.x |
| `babel-loader` / `@babel/preset-env` | ^8.2.1 / ^7.12.7 | JS transpilation | |
| `node-sass` | ^5.0.0 | SCSS compilation | **DEPRECATED** -- replaced by `sass` (Dart Sass) |
| `sass` | ^1.29.0 | Dart Sass (also present) | Redundant with node-sass |
| `sass-loader` | ^10.1.0 | Webpack SCSS integration | |
| `style-loader` | ^2.0.0 | Inject CSS into DOM | |
| `css-loader` | ^5.0.1 | Resolve CSS imports | |
| `html-webpack-plugin` | ^4.5.0 | HTML template | |
| `compression-webpack-plugin` | ^7.1.2 | Brotli pre-compression | |
| `clean-webpack-plugin` | ^3.0.0 | Dist cleanup | |
| `dotenv-webpack` | ^6.0.0 | Injects env vars at build time | |
| `eslint` | ^7.14.0 | Linting | v7 is EOL; current is v9 |
| `eslint-config-strongloop` | ^2.1.0 | Lint config | Unmaintained |
| `babel-eslint` | ^10.1.0 | ESLint parser | **DEPRECATED** -- replaced by `@babel/eslint-parser` |
| `jest` | ^26.6.3 | Test runner | v26; current is v29. No tests exist. |
| `mini-css-extract-plugin` | ^1.3.8 | Extract CSS to files | **Not used** in webpack config |
| `svg-inline-loader` | ^0.8.2 | Inline SVGs | **Not used** in webpack config |
| `resolve-url-loader` | ^3.1.2 | Resolve relative URLs in SCSS | **Not used** in webpack config |
| `url-loader` | ^4.1.1 | Font loading | Webpack 5 asset modules make this redundant |
| `include-media` | ^1.4.9 | SCSS media query mixin library | |
| `nodemon` | ^2.0.6 | Dev server restart | Not referenced in scripts |

---

## Directory Map

```
hailstone/
  package.json                  # npm project, no pnpm
  webpack.config.js             # Single config, production mode hardcoded
  src/
    index.html                  # Single div#mainMap, Google Fonts preload
    index.js                    # Entry: dynamic imports styles + scripts/index
    assets/
      wreckLocations.json       # GeoJSON FeatureCollection, ~30 wrecks (656 lines)
      hailstonePreview.jpg      # OG image preview
      icons/                    # SVGs: binoculars, camera-add, diveMask, shaka, etc.
    scripts/
      index.js                  # Main orchestrator: loads Firebase, Map, controls
      animations/
        index.js                # GSAP setup: modal + upvote animation factories
        _modal.js               # reveal/collapse/replace timeline animations
        _upvoteGraphic.js       # "+1" float-up animation
      components/
        index.js                # Barrel export: ControlWrapper
        _applauseButton.js      # Upvote shaka button with animation
        _buoyIcon.js            # Inline SVG buoy icon (128x128 embedded)
        _controlToggler.js      # Mobile hamburger-style toggle
        _controlWrapper.js      # Top-level UI: search + user status (responsive)
        _galleryImage.js        # Image wrapper with lazy load + applause button
        _searchBar.js           # Typeahead wreck search with fly-to + modal
        _userStatusBar.js       # Login/username display + click-to-profile
      controllers/
        index.js                # Barrel export
        _urlQueryListener.js    # ?lookup=tos|privacy, ?vesselId= deep linking
      firebase/
        index.js                # Barrel export
        _client.js              # Firebase init, Storage upload, image loading
        _firestoreQueries.js    # CRUD: users, wreckGalleries, image records, upvotes
        _userManager.js         # Auth: anonymous, Google/Twitter/Facebook/email, profile parsing
      mapbox/
        index.js                # Barrel export
        _flyCamera.js           # Camera fly-to with Promise-based moveend
        _formatMap.js           # Initial config, 3D sky layer, sun position, bounds
        _loadMap.js             # Map constructor, event binding, token assignment
        _mapEvents.js           # Click (open wreck modal) + mousemove (cursor style)
      modals/
        index.js                # Barrel: UserModal, SiteInfoModal, WreckModal
        _customDropdown.js      # Accessible custom select with keyboard nav
        _firebaseAuthUIContainer.js  # Auth UI container element
        _modalBase.js           # Base modal: GSAP animations, auth UI slot, reveal/remove/replace
        _modalContentSwitcher.js     # Front/back/tertiary content flip button
        _modalGallery.js        # Photo gallery content loader
        _modalHeadline.js       # Wreck name + depth/length subheads
        _uploadForm.js          # Image upload: file picker, dropdown, submit, progress bar
        _userModal.js           # User modal: login UI or profile view
        _wreckGallery.js        # Wreck gallery modal: headline + gallery + upload + auth
        SiteInfo/
          index.js              # Barrel export
          _siteInfoModal.js     # About modal: privacy + TOS
          _privacyPolicy.js     # Privacy policy HTML blob (~46K tokens)
          _termsOfService.js    # TOS HTML blob
        UserProfile/
          index.js              # Barrel export
          _detailInfoSection.js # Contact, first/last name fields
          _displayInfoSection.js # Profile picture + display name
          _profileButtons.js    # Edit/Save/Logout with toggle logic
          _profileField.js      # Reusable label + value + input field
          _profilePicture.js    # Profile pic with upload, fallback icon
          _uploadsGallery.js    # User's uploaded photos grid
    styles/
      main.scss                 # Root stylesheet
      abstracts/
        _index.scss, _colors.scss, _fonts.scss, _variables.scss
      base/
        _index.scss, _resets.scss, _forms.scss
      components/
        _buoyIcon.scss, _controlToggler.scss, _controlWrapper.scss,
        _customDropdown.scss, _galleryImage.scss, _imageUploadForm.scss,
        _modals.scss, _postApplauseButton.scss, _searchBar.scss,
        _siteInfoModal.scss, _switchModalContentButton.scss,
        _userProfileEdits.scss, _userProfileView.scss, _userStatusBar.scss
      thirdParty/
        _firebaseUI.scss, _mapboxOverrides.scss
      utils/
        _index.scss, _mixins.scss
```

**Total:** ~1,350 lines of JS (excluding legal blobs), ~1,470 lines of SCSS, 37 source JS files, 20 SCSS files.

---

## Entry Points

| Entry | Path | Role |
|-------|------|------|
| Webpack default | `src/index.js` | Dynamic imports `styles/main.scss`, `mapbox-gl.css`, then lazy-loads `scripts/index` |
| HTML template | `src/index.html` | Single `<div id="mainMap">`, Google Fonts preload, meta tags |
| Scripts main | `src/scripts/index.js` | Async orchestrator: Firebase -> Map -> URL listener -> Controls |
| Webpack config | `webpack.config.js` | No explicit entry (uses default `src/index.js`), outputs `dist/[name].[contenthash].js` |

The commented-out multi-entry configuration in webpack.config.js (lines 9-13) suggests an earlier architecture that was consolidated into a single entry with dynamic imports.

---

## Architecture Patterns

### 1. Factory Functions (primary pattern)

Every module exports a factory function that creates DOM elements imperatively. No classes, no prototypes (except `FirebaseAuthUIContainer` which uses `new` + `this`).

```javascript
// Typical pattern -- every component is a factory
export default function SearchBar() {
  const searchBar = document.createElement('form');
  // ... imperative DOM construction
  return { searchBar };
}
```

### 2. Heavy Window Global State

The app uses `window.*` as a global state bus. **20 window mutations** across 11 files:

| Global | Set in | Read in | Purpose |
|--------|--------|---------|---------|
| `window.wreckFeatures` | scripts/index.js | _searchBar.js | GeoJSON features array |
| `window.firebaseClient` | _client.js | _userManager.js, _searchBar.js, _uploadForm.js, _profileButtons.js, _profilePicture.js, _uploadsGallery.js, _modalGallery.js | Firebase API facade |
| `window.user` | _userManager.js | _client.js, _uploadForm.js, _applauseButton.js | Firebase auth user |
| `window.userData` | _firestoreQueries.js, _userManager.js, _profileButtons.js | _userStatusBar.js, _modalGallery.js, _userModal.js, _profilePicture.js | Firestore user record |
| `window.updateUserStatusBar` | scripts/index.js | _firestoreQueries.js, _userManager.js | UI refresh callback |
| `window.activeModal` | 6 files | _mapEvents.js, _urlQueryListener.js, _searchBar.js, _userStatusBar.js, _modalContentSwitcher.js, _uploadForm.js | Singleton modal reference |
| `window.mapCanvas` | _loadMap.js | _searchBar.js | Map camera API |
| `window.launchAuthUI` | _wreckGallery.js | _uploadForm.js | Auth trigger |
| `window.hideAuthUI` | _wreckGallery.js, _userModal.js | _userManager.js | Auth hide trigger |

### 3. Dynamic Imports with Webpack Magic Comments

```javascript
// Entry point uses prefetch/preload hints
import(/* webpackPrefetch: true */'./styles/main.scss');
import(/* webpackPreload: true */'./scripts')
  .then(({ default: main }) => main());
```

### 4. Imperative DOM Construction

All UI is built with `document.createElement` chains. No templating, no virtual DOM, no JSX. Every component manually creates elements, sets classes, appends children, and wires event listeners.

```javascript
// Example: 15 createElement calls in a single component
const searchBar = document.createElement('form');
const searchInput = document.createElement('input');
searchInput.id = INPUT_ID;
searchInput.type = 'text';
searchInput.addEventListener('input', doSearchOnInput);
```

### 5. GSAP Timeline Animations

Animations use GSAP timeline chaining with factory pattern:

```javascript
function _reveal(gsap, { modal, fromPoint }) {
  const tl = gsap.timeline({ defaults: tlDefaults })
    .from(modal, { x: deltaX, y: deltaY, width: 0 })
    .to(modal, { height: windowHeight - offset, opacity: 1 }, '<')
    .from(modal.children, { opacity: 0 });
}
```

### 6. Underscore-Prefixed Private Convention

All "private" functions use `_` prefix convention (e.g., `_getImageRecords`, `_anonymousLogin`). Public API is returned from factory closure.

---

## Data Flows

### Firebase Initialization

```
FirebaseClient() called in scripts/index.js
  -> firebase.initializeApp(firebaseConfig)  // env vars via dotenv-webpack
  -> firebase.firestore()                    // Firestore instance
  -> FirestoreQueries(db)                    // Query facade
  -> UserManager(authenticator, authProviders)
  -> window.firebaseClient = { ... }         // Expose to global
```

### Authentication Flow

```
1. App starts -> anonymousLogin() if no current user
2. User clicks profile button -> UserModal opens
3. If no userData -> shows FirebaseUI auth widget
4. Auth providers: Google, Twitter, Facebook, Email/Password
5. Anonymous upgrade: autoUpgradeAnonymousUsers: true
6. On success -> createUserRecord() writes to Firestore 'users/' collection
7. onIdTokenChanged listener updates window.user + window.userData
8. Profile parser normalizes data from each provider
```

### Firestore Schema

```
Collections:
  users/
    {uid}/
      uid, providerId, email, displayName, givenName, familyName,
      pictureURL, appHostedPictureURL, username,
      uploadRecords: [{ wreckId, imgId }],
      upvotedImages: [imgId]

  wreckGalleries/
    {wreckId}/
      images/
        {imgId}/
          storagePath, wreckId, uploadedBy, timeCreated,
          imageCaption, cameraDetails, diveOperators, upvotes (number)
```

### Photo Upload Pipeline

```
1. User selects file in UploadForm
2. Validates user is authenticated (not anonymous)
3. Constructs storagePath: publicAssets/wrecks/{wreckId}/{filename}
4. firebase.storage().ref(storagePath).put(userFile)
5. On progress: updates <progress> bar
6. On complete: reads metadata for timeCreated
7. Creates Firestore image record in wreckGalleries/{wreckId}/images/
8. Updates user's uploadRecords array via arrayUnion
9. Calls refreshModal -> flips content back to gallery view
```

### Profile Picture Pipeline

```
1. User clicks profile pic in edit mode
2. Hidden file input triggers
3. Validates file < 1MB
4. Shows local preview via URL.createObjectURL
5. Uploads to publicAssets/userProfileImages/{uid}/{filename}
6. Stores storagePath in userData.appHostedPictureURL
7. On load: fetches download URL via getDownloadURL()
```

### Mapbox Configuration

```
- Access token: process.env.MB_TOKEN (injected at build time)
- Style URL: process.env.MB_STYLE
- Bounds: Chuuk Lagoon [[151.38, 7.12], [152.07, 7.73]]
- Zoom range: 11-16
- 3D sky layer with SunCalc-computed sun position
- Responsive initial camera: wide vs narrow based on screen aspect
- Deep link support: ?vesselId= flies to specific wreck
```

---

## Tech Debt Inventory

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| 1 | **Window global state bus** | HIGH | 20 mutations across 11 files. `window.firebaseClient`, `window.user`, `window.userData`, `window.activeModal`, `window.mapCanvas`, `window.wreckFeatures`, `window.updateUserStatusBar`, `window.launchAuthUI`, `window.hideAuthUI`. Makes testing impossible, creates hidden coupling. |
| 2 | **Firebase v8 (compat SDK)** | HIGH | Firebase v8 uses the legacy namespaced API. Current is v10+ with modular/tree-shakeable imports. The compat SDK is significantly larger (~300KB vs ~30KB for auth). |
| 3 | **No TypeScript** | HIGH | Zero type safety. Every function parameter is untyped. Factory return shapes are implicit. |
| 4 | **No tests** | HIGH | Jest configured but `--passWithNoTests`. Zero test files. |
| 5 | **node-sass dependency** | HIGH | Deprecated and has native binary compilation issues. `sass` (Dart Sass) is also installed but node-sass takes precedence. |
| 6 | **API keys in env vars without rotation** | MEDIUM | Firebase config and Mapbox token injected via dotenv-webpack. Firebase API key is semi-public by design, but MB_TOKEN and MB_STYLE have no documented rotation strategy. |
| 7 | **No Firestore security rules in repo** | MEDIUM | No `firestore.rules` file. Rules must be configured in Firebase console. No way to audit or version-control access patterns. |
| 8 | **Unused dev dependencies** | MEDIUM | `mini-css-extract-plugin`, `svg-inline-loader`, `resolve-url-loader`, `nodemon` -- installed but not used in webpack config or scripts. |
| 9 | **Privacy policy as 46K-token JS string** | MEDIUM | `_privacyPolicy.js` is a massive HTML string in a JS export. Should be a static HTML file or fetched at runtime. |
| 10 | **ESLint v7 + babel-eslint** | MEDIUM | Both deprecated. babel-eslint replaced by @babel/eslint-parser. ESLint v7 is EOL. |
| 11 | **Deprecated Webpack patterns** | LOW | `url-loader` for fonts when Webpack 5 has native asset modules. Brotli compression config uses deprecated `[path].[name].[hash].[ext]` template. |
| 12 | **Inconsistent error handling** | MEDIUM | Most errors are `console.error(err)` with no user feedback. `_signOut` resolves before signOut completes (race condition). Upload errors silently fail. |
| 13 | **innerHTML for user content** | MEDIUM | `fieldValue.innerHTML = fieldContent` in ProfileField could be XSS if user data contains HTML. Should use `textContent`. |
| 14 | **Event listener leaks** | LOW | `_modalContentSwitcher.js` removes/adds event listeners on toggle but never cleans up on modal removal. Search bar adds document-level click listener on every instantiation. |
| 15 | **No accessibility** | MEDIUM | Modal has no focus trap, no ARIA roles for dialog, no escape-to-close. Custom dropdown has keyboard nav but no ARIA attributes. Search results have no ARIA live region. |
| 16 | **Hardcoded mobile breakpoint** | LOW | `window.innerWidth <= 428` used once, not responsive to orientation change. |
| 17 | **Redundant flyCamera call** | LOW | `_searchBar.js` line 151: `flyMap` assigned but never used (uses `flyCamera` from destructuring instead). |
| 18 | **Empty function stubs** | LOW | `handleAppleSignIn` is empty. `parseAppleProfile` returns nothing. Dead code. |
| 19 | **`var` usage** | LOW | `_userManager.js` uses `var anonymousUser` and `var cred`. Should be `const`/`let`. |
| 20 | **Repository URL mismatch** | LOW | package.json points to `ocommaj/unimatrix-zero.git`, not `hailstone`. |

---

## Modernization Assessment

### File-by-File Complexity

| File | Lines | TS Complexity | Rationale |
|------|-------|---------------|-----------|
| `src/index.js` | 5 | LOW | Simple dynamic imports. Add type for `main()`. |
| `src/scripts/index.js` | 22 | MEDIUM | Window globals need replacement with DI/context. |
| `src/scripts/firebase/_client.js` | 137 | HIGH | Firebase v8 -> v10 modular migration. Window globals. Complex upload flow. Closure-based API surface needs interface definition. |
| `src/scripts/firebase/_firestoreQueries.js` | 118 | HIGH | Every query needs typed Firestore generics. Window mutations. Promise anti-patterns. |
| `src/scripts/firebase/_userManager.js` | 200 | HIGH | 4 auth provider profile parsers need union types. `new _loginUI` constructor pattern. FirebaseUI typings are minimal. Window globals. |
| `src/scripts/mapbox/_loadMap.js` | 26 | MEDIUM | Mapbox GL JS types exist. Window global for camera API. |
| `src/scripts/mapbox/_formatMap.js` | 137 | MEDIUM | Complex nested functions. SunCalc types needed. Mapbox layer config typing. |
| `src/scripts/mapbox/_flyCamera.js` | 27 | LOW | Simple. Needs FlyToOptions type. |
| `src/scripts/mapbox/_mapEvents.js` | 47 | LOW | Mapbox event types are well-documented. Window global read. |
| `src/scripts/animations/index.js` | 7 | LOW | Just wiring. |
| `src/scripts/animations/_modal.js` | 49 | LOW | GSAP has good TS types. Pure animation logic. |
| `src/scripts/animations/_upvoteGraphic.js` | 13 | LOW | Trivial. |
| `src/scripts/components/_controlWrapper.js` | 48 | LOW | Simple DOM factory. Window read. |
| `src/scripts/components/_controlToggler.js` | 25 | LOW | Trivial toggle. |
| `src/scripts/components/_userStatusBar.js` | 77 | MEDIUM | Window globals, DOM querying by ID, modal launch logic. |
| `src/scripts/components/_searchBar.js` | 226 | HIGH | Regex search, keyboard navigation, fly-to orchestration, modal launch. Many window reads. Largest component. |
| `src/scripts/components/_buoyIcon.js` | 41 | LOW | Inline SVG. Should become an SVG file import. |
| `src/scripts/components/_applauseButton.js` | 57 | MEDIUM | Window globals for auth check and upvote. |
| `src/scripts/components/_galleryImage.js` | 26 | LOW | Simple factory. |
| `src/scripts/controllers/_urlQueryListener.js` | 43 | LOW | URL parsing, modal launch. |
| `src/scripts/modals/_modalBase.js` | 59 | MEDIUM | Base modal needs generic typing for auth slot. GSAP integration. |
| `src/scripts/modals/_modalContentSwitcher.js` | 64 | MEDIUM | Event listener swap pattern needs careful typing. |
| `src/scripts/modals/_modalGallery.js` | 49 | LOW | Window reads. Straightforward. |
| `src/scripts/modals/_modalHeadline.js` | 35 | LOW | Pure DOM construction. |
| `src/scripts/modals/_wreckGallery.js` | 55 | MEDIUM | Orchestrates gallery + upload + auth. Window globals. |
| `src/scripts/modals/_uploadForm.js` | 195 | HIGH | File upload, Firestore writes, progress tracking, form validation. Window globals. Inline submit handler with complex cleanup. |
| `src/scripts/modals/_userModal.js` | 44 | MEDIUM | Conditional rendering based on auth state. |
| `src/scripts/modals/_customDropdown.js` | 132 | MEDIUM | Custom select with keyboard nav, state management. Needs generic option typing. |
| `src/scripts/modals/_firebaseAuthUIContainer.js` | 15 | LOW | Uses `this` (constructor function). Small. |
| `src/scripts/modals/SiteInfo/_siteInfoModal.js` | 36 | LOW | Simple composition. |
| `src/scripts/modals/SiteInfo/_privacyPolicy.js` | ~800+ | LOW | Just a big HTML string. Extract to static file. |
| `src/scripts/modals/SiteInfo/_termsOfService.js` | 55 | LOW | Same -- HTML string. |
| `src/scripts/modals/UserProfile/_userProfileView.js` | 44 | LOW | Composition of sub-components. |
| `src/scripts/modals/UserProfile/_displayInfoSection.js` | 24 | LOW | Simple. |
| `src/scripts/modals/UserProfile/_detailInfoSection.js` | 48 | MEDIUM | Module-level config mutation (`primaryContactConfig.fieldContent = ...`). |
| `src/scripts/modals/UserProfile/_profileButtons.js` | 105 | MEDIUM | Edit/save toggle, submit with DOM reads, window globals. |
| `src/scripts/modals/UserProfile/_profileField.js` | 44 | LOW | Reusable. Needs config interface. |
| `src/scripts/modals/UserProfile/_profilePicture.js` | 119 | MEDIUM | File upload, objectURL, Firebase storage. Window globals. |
| `src/scripts/modals/UserProfile/_uploadsGallery.js` | 61 | LOW | Reduce/sort of upload records. Window read. |

**Summary:** 6 HIGH, 13 MEDIUM, 18 LOW

---

## Recommendations (prioritized for TypeScript migration)

### Phase 1: Foundation (do first)

1. **Replace window globals with a typed AppContext module.** Create a singleton context (`AppContext.ts`) with typed properties for `firebaseClient`, `user`, `userData`, `activeModal`, `mapCanvas`, `wreckFeatures`. Every file that reads/writes `window.*` gets refactored to import from this module. This is the single highest-impact change -- it unblocks type safety everywhere.

2. **Migrate Firebase v8 -> v10 modular SDK.** The entire `firebase/` directory must be rewritten. Use `getAuth()`, `getFirestore()`, `getStorage()` instead of `firebase.auth()` etc. This is not just a type change -- it is an API rewrite. Tree shaking will cut bundle size by ~200KB.

3. **Add `tsconfig.json` and rename files to `.ts`.** Start with `strict: false`, enable strictness incrementally. Add `@types/mapbox-gl`, GSAP types (built-in), `suncalc` types.

4. **Remove deprecated deps.** Delete `node-sass`, `babel-eslint`, `url-loader`, `svg-inline-loader`, `resolve-url-loader`, `nodemon`, `mini-css-extract-plugin`. Replace ESLint v7 config with v9 flat config + `@typescript-eslint`.

### Phase 2: Type Safety

5. **Define core interfaces.** `WreckFeature` (from GeoJSON), `UserData`, `ImageRecord`, `FirebaseClientAPI`, `ModalInstance`, `MapCanvasAPI`. The wreckLocations.json provides the schema.

6. **Type all factory return values.** Every factory function (ModalBase, SearchBar, ControlWrapper, etc.) should have an explicit return type interface.

7. **Type Firestore queries with generics.** `collection<UserData>('users')`, `collection<ImageRecord>('wreckGalleries/...')`.

### Phase 3: Architecture Improvements

8. **Extract privacy policy and TOS to static HTML files.** Import as raw strings or fetch at runtime. Removes ~46K tokens from the JS bundle.

9. **Replace innerHTML with textContent where user data is rendered.** Fix XSS vector in `_profileField.js` and `_userStatusBar.js`.

10. **Add Firestore security rules file.** Version-control access patterns alongside the app code.

11. **Add focus trap and ARIA attributes to modals.** Required for accessibility compliance.

12. **Replace imperative DOM with a lightweight template approach** (optional). Consider lit-html or a simple `h()` helper if not migrating to React. The current createElement chains are verbose but functional.

### Phase 4: Build Modernization

13. **Consider Vite over Webpack.** Vite handles TS, SCSS, asset imports, and HMR out of the box with zero config. The webpack.config.js is simple enough that migration would be straightforward.

14. **Add vitest.** Replace jest (which has zero tests anyway). Add tests for Firestore query logic, search matching, profile parsing, and camera fly-to.

15. **Set up CI** with type checking, linting, and (eventually) tests.

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Firebase v8 -> v10 breaks all firebase/ code | HIGH | Rewrite firebase/ directory first, test manually against live Firestore |
| Mapbox GL JS v2 typing gaps | LOW | @types/mapbox-gl is well-maintained; v2 features (sky, terrain) are typed |
| GSAP commercial license | LOW | Free for non-commercial; verify license status for any commercial use |
| FirebaseUI has poor TS support | MEDIUM | Consider replacing with custom auth UI during migration |
| Window global removal cascades through every file | HIGH | Do this first as Phase 1 -- every other change depends on it |
