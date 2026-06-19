# Quick Agent System

Quick Agent System is a local frontend prototype exported from Figma Make. It presents a dense, Oxide-inspired agent console for browsing findings, open questions, experiments, knowledge relationships, lineage, chat sessions, and system status.

The prototype is intentionally static: all product data and operational states are mocked in the frontend. It does not connect to a backend, repository watcher, indexer, Claude relay, or filesystem service.

## Run locally

Requirements:

- Node.js 18 or newer
- npm

```bash
npm install
npm run dev
```

Vite prints the local URL, normally `http://localhost:5173`. The app uses hash routing, so routes appear as `/#/findings`, `/#/chat`, and similar URLs.

Create a production build with:

```bash
npm run build
```

There is currently no automated test or lint command. For design iterations, the minimum verification is a production build plus desktop and mobile route smoke tests.

## Public deployment

The prototype is configured for GitHub Pages at:

```text
https://insannurjaman.github.io/agent/
```

Deployment runs automatically from `.github/workflows/deploy-pages.yml` whenever `main` is pushed. The workflow installs dependencies, builds with the `/agent/` repository base path, and publishes `dist`.

Repository setup required once on GitHub:

1. Open **Settings → Pages**.
2. Under **Build and deployment**, select **GitHub Actions** as the source.
3. Ensure the repository visibility permits Pages for the current GitHub plan.
4. Push the deployment workflow and application changes to `main`.

The application uses hash routing, so public deep links such as `https://insannurjaman.github.io/agent/#/graph` work without server rewrite rules.

## Routes

| Route | Screen | Purpose |
| --- | --- | --- |
| `/` | Redirect | Opens Findings |
| `/overview` | Overview | System workflow, knowledge layers, modules, and activity |
| `/findings` | Findings & Open Questions | Filterable knowledge table/cards with detail inspectors |
| `/experiments/*` | Experiments & Reports | Experiment list, Markdown report viewer, and metadata |
| `/search` | Faceted Search | Cross-entity search using the controlled taxonomy |
| `/graph` | Knowledge Graph | Interactive relationship graph and node inspector |
| `/lineage` | Lineage | Supersedes chains and latest-valid-finding trace |
| `/chat` | Chat Workspace | Mock agent sessions, events, context, proposals, and artifacts |
| `/status` | System Status | Simulated service, index, watcher, and log states |
| `/design` | Design System | Existing component and interaction specimens |

Routes are defined in `src/app/App.tsx`. Navigation labels and icons are defined in `src/app/components/shell/navItems.ts`.

## Project structure

```text
src/
  app/
    components/
      common/        Shared product primitives and actions
      responsive/    Breakpoint, drawer, sheet, and overlay utilities
      shell/         Top bar, navigation rail/drawer, and application shell
      ui/            Figma Make / shadcn / Radix primitives
      <feature>/     Route-level screens and feature-specific components
    data/            Typed static data, graph helpers, and chat fixtures
    App.tsx           Hash router and route composition
  styles/
    index.css         Style entrypoint and import order
    fonts.css         Inter and JetBrains Mono definitions
    tailwind.css      Tailwind v4 source configuration
    theme.css         Semantic tokens and Oxide dark-theme mapping
  main.tsx            React entrypoint
```

Prefer existing shared and UI components before adding new primitives. Keep feature-specific behavior inside its feature folder until it is genuinely reused.

## Data model

All data is local TypeScript under `src/app/data`.

- `types.ts` defines findings, questions, experiments, facets, and repository status.
- `findings.ts`, `openQuestions.ts`, and `experiments.ts` contain representative mock records.
- `edges.ts` contains curated and deterministic generated graph data.
- `chat.ts` contains mock sessions, event streams, proposals, artifacts, and file trees.
- `tagTaxonomy.ts` contains the controlled facet vocabulary.
- `index.ts` exports data and lookup/lineage helpers.

Displayed totals can intentionally be larger than the representative arrays. They simulate a fuller indexed repository and are not expected to equal the number of fixture records.

## Theme ownership

`src/styles/index.css` controls stylesheet order:

1. `fonts.css`
2. `tailwind.css`
3. `theme.css`

The active interface is always dark. `theme.css` maps shadcn semantic variables onto the Quick Agent System Oxide palette:

- near-black background and layered technical surfaces
- crisp subtle/strong borders
- minimal radius
- Inter for interface copy
- JetBrains Mono for identifiers, paths, metadata, and terminal details
- precise orange brand accents with restrained semantic colors for status and graph meaning

Quick Agent System uses `#ff3e01` as its primary brand color. Orange owns primary actions, active navigation, selected states, focus rings, finding identity, and key agent-action emphasis. It should appear as a precise marker, thin border, small tinted surface, or focused control—not as a large saturated panel.

Green is reserved for success, completed, healthy, connected, passed, resolved, and registered states. Cyan/blue remains informational, amber is warning/question emphasis, red is error/degraded, and purple is reserved for hypothesis and lineage/supersedes meaning.

The brand scale is defined in `theme.css` through `--brand-primary`, hover, muted, border, ring, glow, and surface tokens. Components should consume the semantic Tailwind utilities (`brand`, `success`, `info`, `warning`, `error`, and `lineage`) rather than introducing new raw colors.

`default_shadcn_theme.css` is retained as exported reference material. The application imports `src/styles/theme.css`, not that root file.

## Responsive conventions

- `md` introduces the navigation rail; smaller screens use bottom navigation and a navigation drawer.
- Dense findings tables become cards below `lg`.
- Inspectors use the shared responsive overlay wrapper and become full-screen detail views below `lg`.
- Experiments use list-first navigation on mobile.
- Chat uses mobile tabs and drawers rather than preserving the desktop multi-pane layout.
- Wide technical tables may scroll inside their own container, but the page itself must not horizontally overflow.
- Preserve `min-w-0`, `min-h-0`, and explicit overflow boundaries in nested flex layouts.

The current visual baseline and regression matrix are documented in `docs/visual-baseline.md`.

## Prototype limitations

- Backend, indexing, graph loading, repository watching, relay connectivity, file delivery, latency, logs, and write confirmations are simulated UI states.
- Actions update local React state only and reset on reload.
- No authentication, persistence, filesystem writes, API calls, or backend dependencies are present.
- Google Fonts are loaded from the network when available and fall back to system fonts otherwise.
- The production bundle is currently a single large JavaScript chunk. Code splitting and dependency pruning are deferred until visual behavior stabilizes.
- `src/imports/pasted_text`, `plans`, and `guidelines` contain export/reference material; they are not the active product specification.

## Safe iteration checklist

For each design iteration:

1. Keep all existing routes and screens unless removal is explicitly requested.
2. Preserve the typed data interfaces and frontend-only behavior.
3. Reuse semantic theme tokens and shared components.
4. Run `npm run build`.
5. Smoke-test all nine routes at desktop and mobile widths.
6. Check inspectors, drawers, deep links, card/table switching, console errors, and page-level horizontal overflow.
