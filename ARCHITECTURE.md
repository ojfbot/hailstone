# Hailstone Architecture Modernization: React + Redux + CSS Modules

Date: 2026-04-03
Status: Proposed
Supersedes: PLAN.md Phase 2 "vanilla AppContext" assumption

---

## Motivation

The original PLAN.md assumes hailstone stays vanilla JS with factory-function DOM construction. This document upgrades the target architecture to **React 18 + Redux Toolkit + CSS Modules** — the same patterns used across the Frame OS ecosystem (cv-builder, blogengine, TripPlanner). The goal is a robustly decomposed, testable, prop-driven application that demonstrates how far the engineering has come since 2021.

---

## Current State → Target State

| Concern | Current (vanilla JS) | Target (React + Redux) |
|---------|---------------------|----------------------|
| **Rendering** | Factory functions returning `HTMLElement` via `document.createElement` | Functional React components with JSX |
| **State** | 20 `window.*` globals across 11 files | Redux Toolkit slices with typed selectors |
| **Props** | N/A (globals read directly) | Pure prop-driven components; connected wrappers for Redux |
| **Styling** | Global SCSS with BEM-ish naming, shared `_colors.scss` / `_variables.scss` | CSS Modules (`.module.scss`) per component, design tokens in `tokens.scss` |
| **Side effects** | Inline Firebase/Mapbox calls inside DOM constructors | Redux async thunks + service layer |
| **Animations** | GSAP timelines inline | GSAP via `useRef` + `useLayoutEffect` hooks |
| **Modals** | Factory functions appending to `document.body`, GSAP reveal/collapse | React portal + `<dialog>` element, Framer Motion or GSAP via hooks |
| **Forms** | Imperative DOM: `input.value`, `addEventListener('submit')` | Controlled components with Redux or local state |
| **Routing** | `window.location.search` parsed manually | React Router (or keep URL params — app is SPA with no real routes) |
| **Map** | Mapbox GL JS initialized in factory function, stored on `window.mapCanvas` | Mapbox GL JS in a `useRef`, exposed via `MapContext` provider |
| **Testing** | Zero tests | Vitest + React Testing Library, >60% coverage |

---

## Redux Store Design

Derived from the 20 `window.*` globals and the actual data flows documented in RECON.md.

### Slices

```
store/
├── authSlice.ts         user authentication state
├── userSlice.ts         user profile data from Firestore
├── mapSlice.ts          map camera state, active wreck focus
├── modalSlice.ts        active modal type + payload
├── gallerySlice.ts      wreck gallery images, upload state
├── searchSlice.ts       search query, matches, active index
└── index.ts             configureStore + typed hooks
```

#### `authSlice.ts`
Replaces: `window.user`

```typescript
interface AuthState {
  user: SerializableUser | null    // uid, displayName, isAnonymous, providerId
  status: 'idle' | 'loading' | 'authenticated' | 'anonymous' | 'error'
  error: string | null
}
```

**Thunks:** `initAuth()`, `signInAnonymous()`, `signOut()`
**Listener:** `onIdTokenChanged` dispatches `setUser` — runs in a `useEffect` at app root

#### `userSlice.ts`
Replaces: `window.userData`, `window.updateUserStatusBar`

```typescript
interface UserState {
  profile: UserProfile | null      // displayName, email, pictureURL, uploadRecords, upvotedImages
  status: 'idle' | 'loading' | 'loaded' | 'error'
}
```

**Thunks:** `fetchUserProfile(uid)`, `updateUserProfile({ uid, updates })`, `uploadProfileImage({ uid, file })`
**Listener:** Firestore `onSnapshot` on `users/{uid}` dispatches `setProfile`

#### `mapSlice.ts`
Replaces: `window.mapCanvas`, `window.wreckFeatures`

```typescript
interface MapState {
  wreckFeatures: WreckFeature[]    // loaded once from JSON at init
  focusedWreckId: string | null    // which wreck the camera is pointed at
  cameraReady: boolean             // map has finished loading
}
```

**Note:** The Mapbox GL JS `Map` instance is NOT in Redux (it's not serializable). It lives in a `MapContext` provider via `useRef`. Redux only tracks *derived* UI state like which wreck is focused.

#### `modalSlice.ts`
Replaces: `window.activeModal`, `window.launchAuthUI`, `window.hideAuthUI`

```typescript
interface ModalState {
  activeModal: ModalDescriptor | null
  // ModalDescriptor = { type: 'wreck' | 'user' | 'siteInfo', wreckId?: string, section?: 'gallery' | 'upload' | 'auth' }
}
```

**Reducers:** `openModal(descriptor)`, `closeModal()`, `switchModalSection(section)`

#### `gallerySlice.ts`
Replaces: inline gallery loading in WreckGalleryModal

```typescript
interface GalleryState {
  images: Record<string, GalleryImage[]>   // keyed by wreckId
  uploadStatus: 'idle' | 'uploading' | 'complete' | 'error'
  uploadProgress: number                    // 0-100
}
```

**Thunks:** `fetchGallery(wreckId)`, `uploadImage({ wreckId, file, metadata })`, `upvoteImage({ wreckId, imageId })`

#### `searchSlice.ts`
Replaces: inline search state in SearchBar factory

```typescript
interface SearchState {
  query: string
  matches: WreckFeature[]
  activeIndex: number
}
```

**Reducers:** `setQuery(text)`, `setActiveIndex(n)`, `clearSearch()`
**Selector:** `selectFilteredMatches` — filters `wreckFeatures` by query (pure, memoized)

---

## Component Tree

Mapped 1:1 from the current factory-function inventory to preserve full feature parity.

```
<App>
├── <MapProvider>                          (MapContext: holds mapboxgl.Map ref)
│   ├── <MapCanvas />                      (mounts Mapbox, handles click/hover events)
│   │                                      Replaces: _loadMap.js, _formatMap.js, _mapEvents.js, _flyCamera.js
│   │
│   ├── <ControlBar>                       (top-right controls container)
│   │   │                                  Replaces: _controlWrapper.js
│   │   ├── <SearchBar />                  Replaces: _searchBar.js
│   │   │   └── <SearchMatch />            (single match row in dropdown)
│   │   ├── <UserStatusButton />           Replaces: _userStatusBar.js
│   │   └── <ControlToggler />             Replaces: _controlToggler.js (mobile only)
│   │
│   └── <ModalPortal>                      (React portal to document.body)
│       ├── <WreckModal wreckId={id}>      Replaces: _wreckGallery.js + _modalBase.js
│       │   ├── <WreckHeader />            (title, depth, length)
│       │   ├── <GalleryGrid />            Replaces: GalleryContent section
│       │   │   └── <GalleryImage />       Replaces: _galleryImage.js
│       │   │       └── <ApplauseButton /> Replaces: _applauseButton.js
│       │   ├── <UploadForm />             Replaces: _uploadForm.js
│       │   │   └── <DiveOperatorSelect /> Replaces: _customDropdown.js
│       │   ├── <AuthContainer />          Replaces: FirebaseAuthUIContainer
│       │   └── <ContentSwitcher />        Replaces: _modalContentSwitcher.js
│       │
│       ├── <UserModal>                    Replaces: _userModal.js
│       │   ├── <AuthContainer />
│       │   └── <UserProfile />            Replaces: _userProfileView.js
│       │       ├── <ProfilePicture />     Replaces: _profilePicture.js
│       │       ├── <ProfileField />       Replaces: _profileField.js (x4: display, email, first, last)
│       │       ├── <UploadsGallery />     Replaces: _uploadsGallery.js
│       │       └── <ProfileActions />     (edit/logout buttons)
│       │
│       └── <SiteInfoModal>               Replaces: SiteInfo/_siteInfoModalContent.js
│           ├── <PrivacyPolicy />          (loads static HTML from /assets/legal/)
│           └── <TermsOfService />
│
└── <StoreProvider store={store}>          (wraps everything)
```

### Component Classification

| Component | Type | Props | Connects to Redux? |
|-----------|------|-------|-------------------|
| `MapCanvas` | Controller | — | Yes (reads `wreckFeatures`, dispatches `focusWreck`, `openModal`) |
| `ControlBar` | Layout | — | No (pure wrapper) |
| `SearchBar` | Connected | — | Yes (reads/writes `searchSlice`) |
| `SearchMatch` | Pure | `feature, isActive, onSelect` | No |
| `UserStatusButton` | Connected | — | Yes (reads `userSlice`, dispatches `openModal`) |
| `ControlToggler` | Pure | `collapsed, onToggle` | No |
| `WreckModal` | Connected | `wreckId` | Yes (reads `modalSlice`, `gallerySlice`) |
| `WreckHeader` | Pure | `title, maxDepth, length, vesselType` | No |
| `GalleryGrid` | Pure | `images, onUpvote` | No |
| `GalleryImage` | Pure | `image, showApplause, onUpvote` | No |
| `ApplauseButton` | Pure | `imageId, upvoted, onUpvote` | No |
| `UploadForm` | Connected | `wreckId` | Yes (dispatches `uploadImage` thunk) |
| `DiveOperatorSelect` | Pure | `value, onChange, options` | No |
| `ContentSwitcher` | Pure | `section, onSwitch` | No |
| `UserModal` | Connected | — | Yes (reads `authSlice`, `userSlice`) |
| `UserProfile` | Connected | — | Yes (reads `userSlice`, dispatches `updateUserProfile`) |
| `ProfilePicture` | Pure | `url, editable, onUpload` | No |
| `ProfileField` | Pure | `label, value, editable, onChange` | No |
| `AuthContainer` | Controller | — | Yes (manages Firebase auth UI lifecycle) |
| `SiteInfoModal` | Pure | `section: 'privacy' \| 'tos'` | No |

**Ratio: 13 pure components, 7 connected.** This matches the Frame ecosystem pattern where shared components are prop-driven and apps wire Redux via thin connected wrappers.

---

## Service Layer

All Firebase and Mapbox side effects live in service modules — never in components.

```
services/
├── firebaseService.ts     initializeApp, auth listeners, Firestore typed converters
├── galleryService.ts      image CRUD, upload with progress, upvote
├── userService.ts         user profile CRUD, profile image upload
├── mapService.ts          flyCamera, query rendered features
└── authService.ts         anonymous login, provider sign-in, sign-out
```

**Pattern:** Services are pure functions that accept typed parameters and return typed results. They call Firebase/Mapbox APIs directly. Redux thunks call services; components never call services directly.

```typescript
// galleryService.ts
export async function fetchGalleryImages(wreckId: string): Promise<GalleryImage[]> {
  const galleryRef = collection(db, 'wreckGalleries', wreckId, 'images')
  const snapshot = await getDocs(galleryRef.withConverter(imageConverter))
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

// gallerySlice.ts
export const fetchGallery = createAsyncThunk('gallery/fetch', async (wreckId: string) => {
  return await fetchGalleryImages(wreckId)
})
```

---

## CSS Modules Architecture

Replaces the current global SCSS (7-1 pattern) with scoped modules.

```
styles/
├── tokens.scss              design tokens: colors, spacing, typography, easing
├── global.scss              resets, font imports, Mapbox/FirebaseUI overrides
└── (component modules live alongside their .tsx files)

components/
├── SearchBar/
│   ├── SearchBar.tsx
│   └── SearchBar.module.scss
├── WreckModal/
│   ├── WreckModal.tsx
│   └── WreckModal.module.scss
```

### Token migration from current SCSS

| Current (`_colors.scss` / `_variables.scss`) | Target (`tokens.scss`) |
|---------------------------------------------|----------------------|
| `$gray-90: #262626` | `--hail-gray-90: #262626` |
| `$gray-80: #393939` | `--hail-gray-80: #393939` |
| `$blue-60: #0f62fe` | `--hail-accent: #0f62fe` |
| `$base-up-1: 1.25rem` | `--hail-space-1: 1.25rem` |
| Big Shoulders Stencil Text | `--hail-font-display: 'Big Shoulders Stencil Text', cursive` |
| Cabin Condensed | `--hail-font-body: 'Cabin Condensed', sans-serif` |

**Modules import tokens:**
```scss
// SearchBar.module.scss
@use '../../styles/tokens' as *;

.wrapper {
  background: var(--hail-gray-90);
  font-family: var(--hail-font-body);
}
```

**Vite handles CSS Modules natively** — any `.module.scss` file exports a typed object of class names.

---

## Mapbox Integration Pattern

Mapbox GL JS `Map` is not serializable and should NOT live in Redux. Use a React Context + ref pattern.

```typescript
// MapContext.tsx
const MapContext = createContext<mapboxgl.Map | null>(null)

export function MapProvider({ children }: { children: ReactNode }) {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  return <MapContext.Provider value={mapRef.current}>{children}</MapContext.Provider>
}

export function useMap() {
  return useContext(MapContext)
}
```

```typescript
// MapCanvas.tsx
export function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const dispatch = useAppDispatch()
  const wreckFeatures = useAppSelector(state => state.map.wreckFeatures)

  useEffect(() => {
    if (!containerRef.current) return
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: import.meta.env.VITE_MB_STYLE,
      // ... camera config from _formatMap.js
    })

    map.on('click', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: WRECK_LAYERS })
      if (features.length) {
        dispatch(openModal({ type: 'wreck', wreckId: features[0].properties.id }))
        dispatch(setFocusedWreck(features[0].properties.id))
      } else {
        dispatch(closeModal())
      }
    })

    return () => map.remove()
  }, [])

  return <div ref={containerRef} className={styles.map} />
}
```

---

## GSAP Animation Pattern

GSAP timelines managed via `useRef` + `useLayoutEffect` to avoid stale closures.

```typescript
// useModalAnimation.ts
export function useModalAnimation(modalRef: RefObject<HTMLElement>, isOpen: boolean) {
  const tl = useRef<gsap.core.Timeline | null>(null)

  useLayoutEffect(() => {
    if (!modalRef.current) return

    if (isOpen) {
      tl.current = gsap.timeline()
        .fromTo(modalRef.current, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.8 })
    } else if (tl.current) {
      tl.current.reverse()
    }

    return () => { tl.current?.kill() }
  }, [isOpen])
}
```

---

## Feature Parity Checklist

Every current behavior mapped to the new architecture. Nothing dropped.

| # | Current Behavior | Source File(s) | React Equivalent | Redux Slice |
|---|-----------------|---------------|-----------------|-------------|
| 1 | Map renders with 3D terrain + sky layer | `_loadMap.js`, `_formatMap.js` | `<MapCanvas />` + `useEffect` init | `mapSlice` (wreckFeatures, cameraReady) |
| 2 | Click wreck marker → open modal | `_mapEvents.js` | `map.on('click')` in MapCanvas dispatches `openModal` | `modalSlice` |
| 3 | Click empty map → close modal | `_mapEvents.js` | Same click handler dispatches `closeModal` | `modalSlice` |
| 4 | Cursor changes on wreck hover | `_mapEvents.js` | `map.on('mousemove')` in MapCanvas | (local to MapCanvas) |
| 5 | Search bar autocomplete | `_searchBar.js` | `<SearchBar />` reads `searchSlice`, dispatches `setQuery` | `searchSlice` |
| 6 | Keyboard nav in search results | `_searchBar.js` | `onKeyDown` in SearchBar dispatches `setActiveIndex` | `searchSlice` |
| 7 | Select search result → fly to wreck + open modal | `_searchBar.js` | Dispatch `flyToWreck` thunk + `openModal` | `mapSlice` + `modalSlice` |
| 8 | User login/signup button | `_userStatusBar.js` | `<UserStatusButton />` reads `userSlice`, dispatches `openModal({ type: 'user' })` | `userSlice` + `modalSlice` |
| 9 | Anonymous auth on startup | `_userManager.js` | `useEffect` in App dispatches `initAuth()` thunk | `authSlice` |
| 10 | Auth state change → update UI | `_userManager.js` | `onIdTokenChanged` listener dispatches `setUser` | `authSlice` |
| 11 | User profile from Firestore | `_firestoreQueries.js` | `fetchUserProfile` thunk called on auth change | `userSlice` |
| 12 | Wreck gallery loads images | `_firestoreQueries.js` | `fetchGallery(wreckId)` thunk on modal open | `gallerySlice` |
| 13 | Photo upload with progress | `_uploadForm.js` | `<UploadForm />` dispatches `uploadImage` thunk with `onProgress` callback | `gallerySlice` |
| 14 | Upvote image (applause button) | `_applauseButton.js` | `<ApplauseButton onClick={() => dispatch(upvoteImage(...))} />` | `gallerySlice` |
| 15 | Upvote requires auth | `_applauseButton.js` | If `auth.isAnonymous`, dispatch `openModal({ type: 'user' })` first | `authSlice` + `modalSlice` |
| 16 | Modal reveal animation (GSAP) | `animations/_modal.js` | `useModalAnimation` hook with `useLayoutEffect` | (local to modal) |
| 17 | Modal content flip (gallery ↔ upload) | `_modalContentSwitcher.js` | `<ContentSwitcher section={section} />` + `switchModalSection` | `modalSlice.section` |
| 18 | User profile edit mode | `_userProfileView.js` | `<UserProfile />` with local `editing` state, dispatches `updateUserProfile` on save | `userSlice` |
| 19 | Profile picture upload | `_profilePicture.js` | `<ProfilePicture onUpload={file => dispatch(uploadProfileImage(...))} />` | `userSlice` |
| 20 | Custom dropdown (dive operators) | `_customDropdown.js` | `<DiveOperatorSelect />` with keyboard nav, `aria-expanded`, `role="listbox"` | (local state) |
| 21 | Mobile control toggler | `_controlToggler.js` | `<ControlToggler />` with `collapsed` local state | (local state) |
| 22 | Mobile click-outside to collapse | `_controlWrapper.js` | `useEffect` with document click listener | (local to ControlBar) |
| 23 | URL params: `?vesselId=X` → focus wreck | `_formatMap.js`, `_urlQueryListener.js` | `useSearchParams` or `useEffect` reading `location.search` | `mapSlice` + `modalSlice` |
| 24 | URL params: `?lookup=tos` → site info modal | `_urlQueryListener.js` | Same — dispatch `openModal({ type: 'siteInfo', section: 'tos' })` | `modalSlice` |
| 25 | Privacy policy / TOS (static HTML) | `SiteInfo/*.js` | `<SiteInfoModal />` loads from `/assets/legal/*.html` via fetch | — |
| 26 | Sun position for 3D sky | `_formatMap.js` (SunCalc) | Same SunCalc call in MapCanvas `useEffect` | — |
| 27 | Mapbox attribution accessibility | `_formatMap.js` | Same DOM patching in MapCanvas `useEffect` after map load | — |

**27 behaviors preserved. Zero features dropped.**

---

## Migration Phases (Updated)

The original PLAN.md phases 1 and 3 are unchanged. Phases 2, 4, and 5 are replaced.

| Phase | PLAN.md (original) | ARCHITECTURE.md (updated) |
|-------|-------------------|--------------------------|
| 1 | Vite + Biome + tsconfig | **Unchanged** |
| 2 | `AppContext` module replacing window globals | **React + Redux + CSS Modules scaffold** |
| 3 | Firebase v10 modular rewrite | **Unchanged** (but services now return typed data for thunks) |
| 4 | Mechanical .js → .ts rename | **Component-by-component React rewrite** (bottom-up: pure components first, then connected, then controllers) |
| 5 | strict:true + tests + hardening | **Unchanged** (but tests use React Testing Library) |

### Phase 2 (Updated): React + Redux + CSS Modules Scaffold

1. Add React 18, ReactDOM, Redux Toolkit, react-redux to deps
2. Create `store/` with all 6 slices (typed, empty reducers)
3. Create `store/index.ts` with `configureStore`, typed hooks (`useAppDispatch`, `useAppSelector`)
4. Create `styles/tokens.scss` migrating design tokens from `_colors.scss` + `_variables.scss`
5. Create `styles/global.scss` with resets, font imports, Mapbox/FirebaseUI overrides
6. Create `MapContext.tsx` provider
7. Create `App.tsx` entry point wrapping `StoreProvider` + `MapProvider`
8. Update `src/index.html` to mount React (`<div id="root">`)
9. Update `vite.config.ts` for React (`@vitejs/plugin-react`)
10. All existing factory-function JS still works alongside React — coexistence during migration

### Phase 4 (Updated): Component-by-Component React Rewrite

Convert in this order (pure → connected → controllers):

| Batch | Components | Why this order |
|-------|-----------|---------------|
| 1 | `SearchMatch`, `ControlToggler`, `BuoyIcon` | Simplest pure components, zero deps |
| 2 | `ProfileField`, `ProfilePicture`, `DiveOperatorSelect`, `ContentSwitcher` | Pure components used inside modals |
| 3 | `GalleryImage`, `ApplauseButton`, `GalleryGrid` | Pure gallery components |
| 4 | `WreckHeader`, `UploadForm` | Connected to gallerySlice |
| 5 | `SearchBar`, `UserStatusButton`, `ControlBar` | Connected to searchSlice, userSlice |
| 6 | `WreckModal`, `UserModal`, `UserProfile`, `SiteInfoModal` | Full modal components with portal + animation |
| 7 | `MapCanvas`, `AuthContainer` | Controller components with side effects |
| 8 | `App` entry point | Wire everything together, delete factory functions |

Each batch: write component + CSS module + tests. Delete the corresponding factory function. Verify feature parity.

---

## Directory Structure (Final)

```
src/
├── index.html
├── main.tsx                       React entry point
├── App.tsx                        Root component (providers + layout)
├── store/
│   ├── index.ts                   configureStore + typed hooks
│   ├── authSlice.ts
│   ├── userSlice.ts
│   ├── mapSlice.ts
│   ├── modalSlice.ts
│   ├── gallerySlice.ts
│   └── searchSlice.ts
├── services/
│   ├── firebaseService.ts
│   ├── authService.ts
│   ├── userService.ts
│   ├── galleryService.ts
│   └── mapService.ts
├── components/
│   ├── MapCanvas/
│   │   ├── MapCanvas.tsx
│   │   ├── MapCanvas.module.scss
│   │   └── MapContext.tsx
│   ├── ControlBar/
│   │   ├── ControlBar.tsx
│   │   ├── ControlBar.module.scss
│   │   ├── SearchBar.tsx
│   │   ├── SearchBar.module.scss
│   │   ├── SearchMatch.tsx
│   │   ├── UserStatusButton.tsx
│   │   ├── UserStatusButton.module.scss
│   │   └── ControlToggler.tsx
│   ├── WreckModal/
│   │   ├── WreckModal.tsx
│   │   ├── WreckModal.module.scss
│   │   ├── WreckHeader.tsx
│   │   ├── GalleryGrid.tsx
│   │   ├── GalleryGrid.module.scss
│   │   ├── GalleryImage.tsx
│   │   ├── GalleryImage.module.scss
│   │   ├── ApplauseButton.tsx
│   │   ├── UploadForm.tsx
│   │   ├── UploadForm.module.scss
│   │   ├── DiveOperatorSelect.tsx
│   │   ├── ContentSwitcher.tsx
│   │   └── AuthContainer.tsx
│   ├── UserModal/
│   │   ├── UserModal.tsx
│   │   ├── UserModal.module.scss
│   │   ├── UserProfile.tsx
│   │   ├── UserProfile.module.scss
│   │   ├── ProfilePicture.tsx
│   │   ├── ProfileField.tsx
│   │   ├── ProfileField.module.scss
│   │   └── UploadsGallery.tsx
│   ├── SiteInfoModal/
│   │   ├── SiteInfoModal.tsx
│   │   └── SiteInfoModal.module.scss
│   └── shared/
│       ├── ModalPortal.tsx
│       └── BuoyIcon.tsx
├── hooks/
│   ├── useModalAnimation.ts       GSAP timeline management
│   ├── useUpvoteAnimation.ts      +1 float animation
│   ├── useClickOutside.ts         click-outside detection
│   └── useFocusTrap.ts            modal focus trap
├── types/
│   └── index.ts                   all shared interfaces
├── styles/
│   ├── tokens.scss                CSS custom properties (design tokens)
│   └── global.scss                resets, fonts, third-party overrides
├── assets/
│   ├── icons/                     SVG icons (binoculars, diveMask, shaka, buoy, etc.)
│   ├── legal/                     privacy.html, tos.html (static)
│   └── wreckLocations.json        GeoJSON wreck data
└── env.d.ts                       Vite env type declarations
```

---

## Verification

After each phase:
1. `pnpm dev` — app starts, map renders, all 27 behaviors work
2. `pnpm build` — production build succeeds with no errors
3. `pnpm type-check` — `tsc --noEmit` passes
4. `pnpm test` — all tests pass (Phase 5 adds >60% coverage)
5. Manual walkthrough: search wreck → fly to wreck → open modal → view gallery → upload photo → upvote → edit profile → sign out
