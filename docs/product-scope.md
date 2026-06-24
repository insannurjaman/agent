# Product Scope — V1

## What's in V1

A **read-only prototype** of the Quick Agent System, built as a single-page app with static mock data. All screens render realistic sample data — no backend, no persistence, no live Claude integration.

### Screens (7 nav items + 1 dev-only)

| Route | Screen | Status |
|-------|--------|--------|
| `/chat` | Chat Workspace (default) | Shipped |
| `/overview` | Overview (loop diagram) | Shipped |
| `/findings` | Findings & Open Questions | Shipped |
| `/experiments` | Experiments & Reports | Shipped |
| `/search` | Faceted Search | Shipped |
| `/graph` | Knowledge Graph | Shipped |
| `/lineage` | Lineage (supersedes chain) | Shipped |
| `/design` | Design System (dev only) | Dev-only |

### Core features

- **Chat Workspace** — three-panel resizable layout on desktop, drawer-based on tablet. Transcript, file explorer, artifact viewer. 3 mock sessions (running, completed, failed).
- **Findings & Questions** — tabbed table/card list, search, filter by confidence/status, expandable rows, inspector panel.
- **Experiments & Reports** — sidebar list + markdown report viewer, status badges, stale-data indicators.
- **Faceted Search** — multi-mode search (topic, facet, neighbors, experiment), result cards, inspector overlay.
- **Knowledge Graph** — force-directed and radial layouts, neighborhood/global toggle, interactive SVG with pan/zoom.
- **Lineage** — supersedes chain visualization, timeline view, inspector panel.
- **Overview** — 5-phase loop diagram, quick-start cards.

### Responsive breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 768px | Full-width cards, drawers for panels, hamburger nav |
| Tablet | 768–1279px | Partial sidebar, drawer-based inspectors |
| Desktop | ≥ 1280px | Rail + resizable panels, inline inspectors |

### Theme support

- Dark (Oxide-inspired, default) and Light mode
- Toggle via TopBar
- Orange `#FF3E01` brand accent in dark mode

---

## What's NOT in V1

- **No backend** — all data is static TypeScript, no API calls
- **No persistence** — state resets on page reload
- **No real Claude integration** — transcripts and proposals are mock data
- **No authentication** — `AuthProvider` is a stub
- **No notifications or real-time updates**
- **No user settings or preferences beyond theme**
- **No export or print functionality**
- **No drag-and-drop** (despite react-dnd in dependencies)
- **No command palette** (CommandSheet exists but is not wired to a keyboard shortcut)
- **No onboarding flow or tutorials**

---

## Known Limitations

1. **Static data only** — Adding/editing findings, questions, or experiments requires editing source files directly.
2. **No deep-link persistence** — Search params (`?focus=F-0050`) work for in-session navigation but won't survive a reload.
3. **Graph layout is computed on mount** — Large graphs may re-layout on window resize.
4. **Markdown rendering is basic** — No syntax highlighting, no KaTeX, no image rendering inside markdown.
5. **Mobile overflow risk** — Some dense tables may require horizontal scroll on narrow screens.
6. **Dev-only route** — `/design` only works in development mode (`import.meta.env.DEV`).
7. **Hash router** — URLs use `#` prefix (e.g., `/#/chat`), which may affect analytics and SEO.
8. **Lazy-loaded routes** — Experiments, Search, Graph, Lineage, and Design screens load on demand, causing brief "Loading…" states.
