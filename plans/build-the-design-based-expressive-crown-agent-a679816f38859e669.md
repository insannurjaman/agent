# Quick Agent System — Component Architecture & Implementation Plan

Oxide-console-styled, dark, read-only analytical knowledge console. React 18 + Tailwind v4 + shadcn/Radix + react-router 7 + lucide-react. No markdown library installed.

This build delivers: persistent app shell (top bar + left icon rail, 8 sections) + two fully polished MVP-1 screens (Findings & Open Questions table viewer; Experiment List + REPORT viewer) + 6 lightweight stub routes.

---

## 1. Theming strategy (do this first, it underpins everything)

`src/styles/theme.css` ships shadcn light/dark oklch tokens with `@theme inline` mapping `--color-*` -> `--*`. Do NOT rewrite or delete those mappings (every shadcn component depends on them). Instead:

**a) Force dark globally.** App is dark-only. In `App.tsx`, render the whole tree inside a wrapper with `className="dark"` (the `.dark` selector in theme.css then activates). Simpler and avoids `next-themes`. Alternatively add `dark` to `<html>` — but a wrapper div is cleanest given the Make entrypoint controls the root.

**b) Override shadcn dark tokens with the Oxide palette + add new palette vars.** Append a new block to `theme.css` (this is the ONE existing file we edit for theming). Inside an additional `.dark` rule placed AFTER the existing `.dark` block (later wins), remap the semantic shadcn tokens to Oxide values so all shadcn components inherit the look:
   - `--background: #080A0B; --card: #0D1012; --popover: #12161A;`
   - `--secondary: #12161A; --muted: #12161A; --accent: #171C20;`
   - `--border: #252B30; --input: #252B30; --ring: #2DD4BF;`
   - `--foreground: #F2F5F3; --muted-foreground: #6F7A76; --secondary-foreground/--accent-foreground/--popover-foreground/--card-foreground: #F2F5F3;`
   - `--primary: #171C20; --primary-foreground: #F2F5F3;` (avoid bright primary; Oxide is low-noise)
   - `--destructive: #FF6B6B;`
   - `--radius: 0.25rem;` (minimal radius — Oxide is sharp)

**c) Add the raw Oxide palette as first-class custom vars** in the same `.dark` block AND expose them to Tailwind utilities via `@theme inline` additions, so we can write `bg-surface-2`, `text-text-muted`, `border-border-strong`, `text-green`, etc.:
   - In `.dark`: `--bg/--surface/--surface-2/--elevated/--border-subtle/--border-strong/--text/--text-secondary/--text-muted/--green/--teal/--amber/--red/--blue/--purple` set to the exact hex values from the brief.
   - In `@theme inline` (append, do not remove existing): map them to color utilities, e.g. `--color-surface: var(--surface); --color-surface-2: var(--surface-2); --color-elevated: var(--elevated); --color-border-subtle: var(--border-subtle); --color-border-strong: var(--border-strong); --color-text: var(--text); --color-text-secondary: var(--text-secondary); --color-text-muted: var(--text-muted); --color-green: var(--green); --color-teal: var(--teal); --color-amber: var(--amber); --color-red: var(--red); --color-blue: var(--blue); --color-purple: var(--purple);`
   - This generates `bg-*`, `text-*`, `border-*` utilities for each. shadcn components untouched; our custom components use these directly.

**d) Fonts.** `src/styles/fonts.css` is currently empty (only place fonts may go). Add Google Fonts `@import` for Inter and JetBrains Mono at the very top (imports must precede other rules). Then in `@theme inline` in theme.css add `--font-sans: "Inter", system-ui, sans-serif;` and `--font-mono: "JetBrains Mono", monospace;` so `font-sans`/`font-mono` utilities resolve. Set body to Inter via the base layer (theme.css `body` rule already exists — add `font-family: var(--font-sans)` there, or rely on Tailwind default which reads `--font-sans`). Use `font-mono` utility class on all IDs/paths/timestamps.

Net: shadcn keeps working in dark; our components get the precise Oxide palette as named utilities.

---

## 2. Routing & shell layout

Use **react-router 7** with a `createBrowserRouter` + nested routes (layout route pattern). Keep it inside `App.tsx` (default export) wrapping everything.

**`src/app/App.tsx`** (default export):
- Wraps tree in `<div className="dark min-h-screen bg-background text-text font-sans">`.
- Creates the router and renders `<RouterProvider>`.
- Single layout route renders `<AppShell/>` (which contains `<Outlet/>`); children are the 8 section routes.

Route table (path -> element):
- `/` -> redirect to `/findings` (Findings is the priority MVP screen; or `/overview` stub — recommend `/findings`).
- `/overview` -> `OverviewStub`
- `/findings` -> `FindingsScreen`  (FULL)
- `/experiments` -> `ExperimentsScreen` (FULL); also `/experiments/:slug` so a selected experiment is URL-addressable.
- `/search` -> `SearchStub`
- `/graph` -> `GraphStub`
- `/lineage` -> `LineageStub`
- `/chat` -> `ChatStub`
- `/status` -> `StatusStub`
- `/design` -> `DesignSystemStub`

Note: this is a Make/Figma environment with a custom entrypoint (`__figma__entrypoint__.ts`). `createBrowserRouter` should work; if the sandbox preview has base-path issues, fall back to `createHashRouter` (same API). Recommend trying browser router first, hash router as the documented fallback.

**`src/app/components/shell/AppShell.tsx`** — responsibilities:
- CSS grid: top bar (fixed height ~48px) across the top; below it a row with the icon rail (fixed ~56px wide) + main `<Outlet/>` area. Full viewport height, no body scroll; inner panels scroll.
- Renders `<TopBar/>` and `<NavRail/>`, then `<main className="overflow-hidden">` with `<Outlet/>`.

**`src/app/components/shell/TopBar.tsx`**:
- Left: small abstract logo mark (inline SVG, a simple geometric glyph — NOT a copied Oxide logo), "Quick Agent System" (never truncates — `whitespace-nowrap`), version "v0.1.0" in `font-mono text-text-muted`.
- Center: command/search `Input` (shadcn) full-width, placeholder "Search findings, open questions, experiments, reports…", with a leading `Search` lucide icon. Non-functional shell-level (decorative for now) or wired to navigate to /search later.
- Right: `BackendStatusPill` + settings icon button (ghost).
- Surfaces: `bg-surface` with `border-b border-border-subtle`.

**`src/app/components/shell/NavRail.tsx`**:
- Vertical icon list, 8 entries, each a `NavLink` to its route, wrapped in shadcn `Tooltip` (right-side) showing the label.
- lucide icons: Overview=`LayoutGrid`, Findings & Questions=`ListChecks`, Experiments & Reports=`FlaskConical`, Faceted Search=`Search`, Knowledge Graph=`Share2`, Lineage=`GitBranch`, Chat Workspace=`MessagesSquare`, System Status=`Activity`. (Design System reachable via a small footer icon `Palette` at rail bottom.)
- Active state via `NavLink` `isActive`: subtle left accent line (`border-l-2 border-teal`) + slightly elevated bg (`bg-surface-2`) + icon `text-text`; inactive icon `text-text-muted`. No glow, no purple block.
- Rail surface `bg-bg border-r border-border-subtle`.

**`src/app/components/shell/BackendStatusPill.tsx`**:
- Green dot (`bg-green`) + mono text "Backend connected · indexed 2m ago". Pill = `bg-surface-2 border border-border-subtle rounded-sm px-2 py-1`. Data from a constant in the data module (so it is consistent and easy to flip to "offline" demo state).

A `src/app/components/shell/navItems.ts` exports the nav config array (icon, label, path) consumed by both NavRail and potentially a future command palette.

---

## 3. Shared primitives (build once, reuse across both MVP screens + future)

Directory `src/app/components/common/`:

- **`StatusBadge.tsx`** — central badge component. A `cva`-based or lookup-map wrapper around shadcn `Badge` (variant="outline") that maps a semantic value to a palette color (text + subtle border + faint bg tint). Single source of truth for ALL badge color rules in the brief:
  - finding category: factor/schema/data-quality/process/hypothesis/anomaly-pattern/method
  - finding confidence: high(green)/medium(teal)/medium-high(green)/low(amber)/superseded(muted gray)
  - OQ status: open(blue)/resolved(green)/in-progress(teal)/partial-progress(amber)
  - OQ priority: high(red)/medium(amber)/low(text-muted)
  - experiment report status: REPORT available(green)/Exploration Only(blue)/Missing REPORT(amber)/Outdated data(red)
  - graph edge types (for later): origin/cite/report-use/supersedes/conflict-suspected/resolve-partial
  Export typed maps so screens just pass `<StatusBadge kind="confidence" value="high" />`.
- **`MonoId.tsx`** — renders an F-ID/Q-ID/slug/path in `font-mono`, optional `to` for cross-link (renders `Link`), tabular look, copy-on-click optional.
- **`MetaRow.tsx`** — uppercase micro-label (`text-text-muted text-[11px] tracking-wide uppercase`) + value, used by inspectors (STATUS, SOURCE, PATH, CONFIDENCE, FACETS, EVIDENCE, SUPERSEDES, ACTIONABLE, LAST INDEXED).
- **`InspectorPanel.tsx`** — right-side panel shell: header (title + close), scrollable body, footer/action group. Both MVP screens reuse it; sections passed as children.
- **`AskClaudeActions.tsx`** — renders the read-only "Ask Claude to…" action buttons (purple-accent secondary buttons, used sparingly per brief). No edit/delete/save/resolve buttons anywhere. Buttons are visual + optional toast via `sonner`; they do not mutate data.
- **`ScreenHeader.tsx`** — title + subtitle block, consistent across screens.
- **`StubScreen.tsx`** — reusable "coming soon" placeholder: takes title, subtitle, MVP-phase tag, and a short list of intended capabilities (pulled from the brief). Used by all 6 stub routes so they feel intentional, not blank (anti-AI-slop: no generic "coming soon" copy — use real brief terminology). Renders inside the shell with `ScreenHeader`.
- **`FacetChips.tsx`** — small mono tag chips for facets, reused by table cells and inspectors.
- **`EmptyState.tsx`** — typed empty/loading/error states with the brief's exact copy ("No matching findings, open questions, or experiments.", "Failed to load knowledge file", etc.). Used by both screens.

---

## 4. Screen 2 — Findings & Open Questions (FULL)

Directory `src/app/components/findings/`:

- **`FindingsScreen.tsx`** (route element) — owns all UI state with `useState`/`useMemo` (no backend): active type tab, search string, filter selections, sort key, selected row id, expanded row ids. Lays out: `ScreenHeader` + `FindingsToolbar` (sticky) + a two-column flex: table region (flex-1, scrolls) + `InspectorPanel` (fixed ~360px, only when a row is selected; otherwise a "No item selected" empty state). Derives the filtered+sorted+merged row list via memo. Handles the brief's states (no matches, selected-item-hidden-by-filters warning, superseded warning).
- **`FindingsToolbar.tsx`** — search `Input`; type `Tabs` (All / Findings / Open Questions); filter `Select`/`DropdownMenu` controls (Category, Status, Confidence, Priority, Area, Facets, Actionable — show/hide the relevant ones depending on active tab); sort `Select` (Date / Confidence / Priority). All controlled via props/callbacks from the screen.
- **`FindingsTable.tsx`** — dense table using shadcn `table.tsx`. Sticky header (`sticky top-0 bg-surface z-10`). Renders different column sets per type tab:
  - Findings cols: ID, TITLE, CATEGORY, CONFIDENCE, FACETS, ACTIONABLE, EVIDENCE, SUPERSEDES, DATE.
  - Open Questions cols: ID, TITLE, STATUS, PRIORITY, AREA, FACETS, RAISED BY, RELATED, RAISED DATE.
  - "All" tab: a unified column set (ID, TITLE, TYPE, CATEGORY/AREA, STATUS/CONFIDENCE, FACETS, DATE) — keep it readable, minimal truncation (wide title col, `min-w`).
  - Uppercase micro-label headers, mono IDs, hover state (`hover:bg-surface-2`), selected row (`bg-elevated` + left accent), row click selects + opens inspector, expand chevron toggles an expanded sub-row.
  - **Superseded rows**: `opacity-60 text-text-muted`, a "Superseded" `StatusBadge`, inline "Go to Latest Version" `Link` (to /lineage or the latest F-ID), and "View Lineage" in the row action menu.
  - Row action menu: shadcn `DropdownMenu` (kebab) with read-only actions (View Evidence, View in Graph, View Lineage, Ask Claude…).
- **`FindingsTableRow.tsx`** (optional split) — single row + its expandable detail row (summary/detail text). Keeps `FindingsTable` readable.
- **`FindingInspector.tsx`** — inspector body for a Finding: MetaRows (ID, Category, Confidence, Tags, Facets, Evidence path as MonoId, Supersedes/superseded-by, Actionable), Summary block, Related open questions list (cross-links), then `AskClaudeActions` (View Evidence Report, View Node in Graph, View Lineage, Ask Claude about this finding).
- **`QuestionInspector.tsx`** — inspector body for an Open Question: Status, Priority, Area, Detail, Raised by, Related findings/experiments (cross-links), an update-history timeline if the detail string contains "| Date:" (parse and render chronologically), then actions (View Related Finding, View Node in Graph, Ask Claude to update this question).
- `FindingsScreen` picks the right inspector body based on selected row type and renders it inside the shared `InspectorPanel`.

Cross-links (F-ID/Q-ID/experiment slug) use `Link`/`MonoId` pointing at the relevant route (table filter, /graph, /lineage, /experiments/:slug). Stub routes accept these links gracefully.

---

## 5. Screen 3 — Experiment List + REPORT Viewer (FULL)

Directory `src/app/components/experiments/`:

- **`ExperimentsScreen.tsx`** (route element, also handles `:slug`) — three-pane flex: `ExperimentList` (left, ~320px, scrolls), `ReportViewer` (center, flex-1, scrolls), `ReportOutlinePanel` (right, ~300px). Reads `:slug` param to pick the active experiment (default to first/most recent). Selecting an item navigates to `/experiments/:slug`. Handles states: README-only / Exploration Only / Report not found / image-failed / outdated-data warning.
- **`ExperimentList.tsx`** — compact rows in descending date order. Each row: experiment slug (mono), title, top-3 conclusions (extracted from README — pre-extracted in the data module), freshness indicators (parquet_mtime, row_counts, date_range as small mono meta), REPORT status `StatusBadge` (REPORT available / Exploration Only / Missing REPORT), last modified, related findings count. Active row highlighted with left accent.
- **`ReportViewer.tsx`** — document-style reader. Metadata header strip (SOURCE, REPORT PATH, README PATH as MonoId, FIGURES count, RELATED FINDINGS, DATA FRESHNESS, LAST INDEXED) using `MetaRow`. Below it renders the markdown body via the custom `Markdown` renderer. Resolves relative image paths against the experiment's outputs dir (map slug -> base path; figures provided in data as resolvable URLs or `ImageWithFallback`). For Exploration-Only experiments, renders README instead with an "Exploration Only" banner (not an error). For missing report, an `EmptyState` ("Report not found") — but still show README if present.
- **`ReportOutlinePanel.tsx`** — right panel: "On this page" TOC (auto-generated from headings emitted by the markdown renderer; smooth-scroll/anchor links), Related findings, Related open questions, Figures thumbnails, Freshness indicators, and `AskClaudeActions` (View in Graph, Open Evidence, Copy Path, Ask Claude about this report).

### Markdown rendering — recommendation: lightweight custom renderer (no library)

No markdown lib is installed and adding one is undesirable for a Make project. Build **`src/app/components/experiments/Markdown.tsx`** — a small, line-based renderer covering the subset reports actually use:
- Headings (`#`..`####`) — emit elements WITH generated `id` slugs and push `{id, text, level}` into a headings collector (via a callback/ref or by returning headings alongside JSX) so `ReportOutlinePanel` can build the TOC. Recommend: a `parseMarkdown(src)` helper in `src/app/components/experiments/markdown.ts` that returns `{ blocks, headings }`; `Markdown.tsx` renders `blocks`, and the screen passes `headings` to the outline panel.
- Paragraphs, unordered/ordered lists, fenced code blocks (```), inline code (`), bold/italic, links, blockquotes, horizontal rules, images (`![alt](path)` -> `ImageWithFallback` with relative-path resolution), and simple GFM pipe tables (the reports use the four-axis structure: Phenomenon / Variables / Mechanism / Countermeasures — often a table).
- Inline post-processing: detect F-ID/Q-ID patterns (`/F-\d{4}/`, `/Q-\d{4}/`) in text and wrap them as cross-link `Link`s to the findings table / graph / lineage.
- Style with the Oxide palette: mono for code, `text-text-secondary` body, headings in `text-text`, technical "field report" feel (not blog). Keep prose tight.

This is ~150-250 lines, dependency-free, fully controllable, and lets us own the F-ID/Q-ID linking and relative-image behavior the brief requires (a generic markdown lib would not do those without plugins). Document this choice in code comments.

---

## 6. Stub screens (6 lightweight routes)

Each is a one-file component in `src/app/components/stubs/` that renders `StubScreen` with real brief-derived content (title, subtitle, MVP phase, intended capabilities list). No fake charts, no blank areas.
- `OverviewStub.tsx` (MVP-?, "System Map" — loop steps + L0-L3 doc layers + repo status counts as a teaser list)
- `SearchStub.tsx` (MVP-2 Faceted Search — 6 facet dimensions listed)
- `GraphStub.tsx` (MVP-2 Knowledge Graph — 3 node types, 499 edges)
- `LineageStub.tsx` (Supersedes trace)
- `ChatStub.tsx` (MVP-3, note "Chat is one mode, not the whole product")
- `StatusStub.tsx` (System Status — list the monitored subsystems)
- `DesignSystemStub.tsx` (could optionally render the StatusBadge gallery + color tokens since those primitives already exist — a cheap real win, but keep minimal for this build)

---

## 7. Mock data module — `src/app/data/`

All realistic, brief-accurate, typed. No fake/inconsistent entities. Files:

- **`types.ts`** — TypeScript interfaces matching CSV columns exactly:
  - `Finding { id; date; category; tags: string[]; title; summary; evidence; confidence; supersedes; supersededBy?; actionable: boolean; facets: string[]; relatedQuestions?: string[] }`
  - `OpenQuestion { id; raisedDate; priority; status; area; title; detail; raisedBy; related: string[]; facets: string[] }`
  - `Experiment { slug; title; date; conclusions: string[]; reportStatus: 'report'|'exploration'|'missing'; reportPath?; readmePath; reportMarkdown?; readmeMarkdown; figures: {name; path}[]; relatedFindings: string[]; freshness: { parquetMtime; rowCounts; dateRange }; lastModified; outdated?: boolean }`
  - enums/union types for category, confidence, status, priority, edgeType, facet dimensions.
- **`findings.ts`** — ~12-16 `Finding` rows with real IDs `F-0001`…, realistic titles/summaries/evidence paths (`experiments/2026-06-08_anomaly_check/REPORT.md`), at least 2 superseded (with `supersededBy`) to exercise the gray treatment + lineage link, varied categories/confidence/facets, `actionable` mix.
- **`openQuestions.ts`** — ~10-14 `OpenQuestion` rows, real IDs `Q-0001`…, varied status/priority/area, at least one `detail` containing `"| Date:"` segments to drive the update-history timeline.
- **`experiments.ts`** — ~6-8 `Experiment` records including `2026-06-08_anomaly_check` (full REPORT), at least one Exploration-Only (README only, no report), one Missing REPORT, one with `outdated: true`. Report/README markdown stored as template-literal strings using the four-axis structure (Phenomenon/Variables/Mechanism/Countermeasures), embedded F-ID/Q-ID references, a pipe table, a fenced code block, and `![figure](outputs/figures/bend_rate.png)` relative images.
- **`tagTaxonomy.ts`** — the 6 facet dimensions + ~40 controlled vocabulary terms (Process, Equipment Variables, Phenomena, Quality Labels, Methods, Data Quality). Drives facet filters and chips.
- **`repoStatus.ts`** — backend status + repo counts (findings 79 rows, open_questions 47, edges 499, 18 experiments, 106 PNGs, 2 HTML, "indexed 2m ago"). Used by TopBar pill, Overview/Status stubs.
- **`index.ts`** — re-exports + small selector helpers (`getExperimentBySlug`, `getLatestVersion(findingId)`, `findById`) so screens stay thin.

Figures: reference real-looking relative paths; in the viewer use `figma/ImageWithFallback.tsx` (already present) so missing images degrade gracefully (satisfies "Image failed to load" state) — or point figure paths at Unsplash/placeholder URLs for visible polish. Recommend `ImageWithFallback` with a small set of real chart-like placeholder image URLs.

---

## 8. Build sequence

1. Theming: edit `fonts.css` (Google Fonts import) + append Oxide `.dark` overrides, raw palette vars, and `@theme inline` color/font mappings in `theme.css`. Set `App.tsx` wrapper to `dark`.
2. Data module (`src/app/data/*`) — types first, then realistic rows. Everything downstream depends on it.
3. Common primitives (`StatusBadge`, `MonoId`, `MetaRow`, `InspectorPanel`, `AskClaudeActions`, `ScreenHeader`, `StubScreen`, `EmptyState`, `FacetChips`).
4. Shell (`AppShell`, `TopBar`, `NavRail`, `BackendStatusPill`, `navItems`) + router wiring in `App.tsx` with stub routes so navigation works end-to-end early.
5. Findings screen (table → toolbar → inspectors → states).
6. Markdown renderer + Experiments screen (list → viewer → outline).
7. Fill stub content, polish spacing/borders/states, verify no body scroll and sticky headers.

---

## 9. Key decisions / trade-offs
- **Dark-only via wrapper `dark` class** rather than `next-themes` — fewer moving parts; app has no light mode.
- **Override semantic shadcn tokens AND add named palette utilities** — keeps shadcn components on-theme while giving custom components exact control. We only edit `theme.css`/`fonts.css`, never the `ui/` components.
- **Custom markdown renderer over a library** — none installed; we need F-ID/Q-ID auto-linking, relative image resolution, and TOC extraction that off-the-shelf renderers don't provide without plugins. Scoped to the markdown subset reports use.
- **URL-addressable selection** for experiments (`:slug`); findings selection kept in component state (table is single-screen, deep-linking less critical) — can be promoted to query params later.
- **react-router `createBrowserRouter`** with `createHashRouter` as documented fallback for the sandbox preview.

---

## Critical Files for Implementation
- /workspaces/default/code/src/app/App.tsx (router + dark wrapper, default export)
- /workspaces/default/code/src/styles/theme.css (append Oxide palette + token overrides + @theme inline mappings; do not break existing shadcn tokens)
- /workspaces/default/code/src/app/data/index.ts (and findings.ts / openQuestions.ts / experiments.ts / types.ts — mock data backbone)
- /workspaces/default/code/src/app/components/findings/FindingsScreen.tsx (MVP-1 screen 1)
- /workspaces/default/code/src/app/components/experiments/ExperimentsScreen.tsx (MVP-1 screen 2 + Markdown renderer)
