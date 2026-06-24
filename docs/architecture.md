# Architecture

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Build | Vite | 6.3.5 |
| Framework | React | 18.3.1 |
| Routing | React Router (Hash) | 7.13.0 |
| Styling | Tailwind CSS v4 | 4.1.12 |
| Components | shadcn/Radix UI | Various |
| Icons | lucide-react | 0.487.0 |
| Animation | motion | 12.23.24 |
| Theme | next-themes | 0.4.6 |
| Language | TypeScript | — |

### Key dependencies

- `react-resizable-panels` — Chat workspace split panes
- `react-hook-form` + `react-day-picker` — Form primitives
- `recharts` — Chart components
- `sonner` — Toast notifications
- `cmdk` — Command palette (not yet wired)
- `embla-carousel-react` — Carousel (used in UI primitives)
- `vaul` — Drawer component
- `react-dnd` — Drag and drop (available but unused in V1)

---

## Route Structure

```
/ (AppShell)
├── / (redirect → /chat)
├── /chat         → ChatWorkspaceScreen
├── /findings     → FindingsScreen
├── /experiments/* → ExperimentsScreen (lazy)
├── /overview     → OverviewScreen
├── /search       → FacetedSearchScreen (lazy)
├── /graph        → KnowledgeGraphScreen (lazy)
├── /lineage      → LineageScreen (lazy)
├── /design       → DesignSystemScreen (lazy, dev-only)
└── * (redirect → /chat)
```

Router: `createHashRouter` — all URLs prefixed with `#`.

---

## Component Hierarchy

```
App
├── ThemeProvider (next-themes, default dark)
│   └── AuthProvider (stub)
│       └── RouterProvider
│           └── AppShell
│               ├── TopBar
│               │   ├── SystemLogo (SVG)
│               │   ├── ThemeToggle
│               │   └── ProfileMenu
│               ├── NavRail (desktop/tablet only, collapsible)
│               ├── <Outlet /> (routed screen)
│               └── NavDrawer (mobile, full-screen overlay)
```

### Shell components (`src/app/components/shell/`)

| Component | Purpose |
|-----------|---------|
| `AppShell` | Root layout: TopBar + NavRail + Outlet + NavDrawer |
| `TopBar` | Global header: logo, theme toggle, profile menu |
| `NavRail` | Collapsible icon rail (desktop), persists expand state to localStorage |
| `NavDrawer` | Mobile overlay navigation |
| `NavContext` | React context for `openNav`/`closeNav` callbacks |
| `CommandSheet` | Command palette (unused in V1) |
| `BackendStatusPill` | Status indicator (unused in V1) |
| `ThemeToggle` | Dark/light switch |
| `ProfileMenu` | User avatar + dropdown |
| `RouteErrorBoundary` | Per-route error boundary |

### Common components (`src/app/components/common/`)

| Component | Purpose |
|-----------|---------|
| `ScreenHeader` | Consistent page header with title + subtitle |
| `StatusBadge` | Colored dot + label for status/confidence/category |
| `EmptyState` | Placeholder for empty lists |
| `FilterSelect` | Dropdown filter with label |
| `InspectorFrame` | Side panel frame for detail views |
| `MonoId` | Monospace ID display (F-NNNN, Q-NNNN) |
| `AskClaudeActions` | Claude action buttons (nav, ask, etc.) |

### Responsive system (`src/app/components/responsive/`)

| Component | Purpose |
|-----------|---------|
| `useBreakpoint()` | Returns `'mobile'` / `'tablet'` / `'desktop'` based on window width |
| `Drawer` | Side panel overlay (left/right) |
| `BottomSheet` | Bottom sheet overlay |
| `ResponsiveInspectorOverlay` | Inspector that becomes Drawer on small screens |
| `SegmentedControl` | Mobile-friendly tab bar |

---

## Data Model

All data lives in `src/app/data/` as static TypeScript. No runtime fetching.

### Types (`types.ts`)

```
Finding          — id, title, category, confidence, facets, supersedes chain
OpenQuestion     — id, title, priority, status, area, facets
Experiment       — slug, title, conclusions, reportStatus, freshness, figures
FacetDimension   — id, label, terms
RepoStatus       — aggregate counts
```

### Data files

| File | Contents |
|------|----------|
| `findings.ts` | 14 mock Finding rows |
| `openQuestions.ts` | Mock OpenQuestion rows |
| `experiments.ts` | 7 mock Experiment rows with full markdown |
| `edges.ts` | ~50 graph edges (origin, supersedes, cite, relates, etc.) |
| `tagTaxonomy.ts` | Facet dimension definitions |
| `chat.ts` | 3 ChatSessions with full SessionBundles (transcript, artifacts, tree, timeline) |
| `auth.tsx` | AuthProvider stub |
| `repoStatus.ts` | Aggregate counts |

### Key helpers (`index.ts`)

- `getFindingById(id)` / `getQuestionById(id)` / `getExperimentBySlug(slug)`
- `getLatestVersion(id)` — follows supersededBy chain
- `getSupersedesChain(id)` — returns ordered chain (oldest → newest)
- `getLineageRoots()` — findings that start a supersedes chain
- `findById(id)` — generic lookup across all entity types

---

## Theme System

CSS custom properties in `src/styles/theme.css`:

- Light and dark palettes defined in `:root` and `.dark`
- Oxide-inspired dark palette: `--surface: #0d1012`, `--brand-primary: #ff3e01`
- shadcn semantic tokens re-mapped to custom palette
- Tailwind v4 `@theme inline` blocks expose tokens as utility classes
- Motion tokens: `--duration-fast`, `--duration-normal`, `--duration-slow`
- Respects `prefers-reduced-motion`

### Accent colors (dark mode)

| Token | Value | Use |
|-------|-------|-----|
| `--brand-primary` | `#ff3e01` | Primary actions, active nav, links |
| `--green` | `#39d98a` | Success, active states |
| `--amber` | `#f3c969` | Warnings, open questions |
| `--error` | `#ff6b6b` | Errors, destructive actions |
| `--lineage` | `#8b7cf6` | Lineage/purple accent |
