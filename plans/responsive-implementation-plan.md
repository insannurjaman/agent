# Quick Agent System — Responsive Implementation Plan

> Planning document only. No UI is generated here. This defines how the desktop-first
> console adapts to tablet and mobile while preserving the Oxide dark/industrial identity,
> the read-only + Claude-mediated model, and the existing product logic.

## 0. Breakpoints

Tailwind v4 defaults map cleanly to the device targets; we standardize on these tokens and
add one custom `xs` for small phones.

| Token | Min width | Device target | Layout regime |
| --- | --- | --- | --- |
| (base) | 0 | Mobile small/standard (360 / 390) | single column, bottom nav, sheets |
| `xs` (custom) | 430 | Mobile large | single column, roomier |
| `md` | 768 | Tablet portrait (834) | 2-column, collapsible side panels |
| `lg` | 1024 | Tablet landscape | 2-column + drawer inspectors |
| `xl` | 1280 | Desktop standard | full multi-pane |
| `2xl` | 1536 | Desktop large (1440 sits just below; treat 1280+ as full desktop) | full multi-pane, max content widths |

Rules of thumb: **< md = mobile**, **md–lg = tablet**, **≥ xl = desktop**. The current screens
are built desktop-first with `xl:grid-cols-[…]` already in places (Overview `xl:grid-cols-[1fr_320px]`,
System Status `xl:grid-cols-[1fr_360px]`), so the work is to add the **mobile/tablet base layouts** beneath those, not to rewrite desktop.

Add a tiny `useBreakpoint()` hook (matchMedia on `768`/`1280`) for the few JS-driven cases
(pane→tab switching in Chat, table→cards in Findings, drawer vs. inline inspector). Prefer pure
CSS (Tailwind responsive utilities) wherever layout alone changes.

## 1. Global responsive navigation (`shell/`)
- **Desktop (≥xl):** unchanged — persistent `NavRail` (icon rail + tooltips), `TopBar` with full product name, full global search, backend status pill, settings.
- **Tablet (md–lg):** keep the icon-only `NavRail` (it is already icon-only, so no change); shorten the global search to a flex-min input; backend status collapses to a compact pill (dot + "indexed 2m ago", drop the "Backend connected ·" prefix below `lg`).
- **Mobile (<md):** hide `NavRail`; introduce a **bottom navigation bar** (`BottomNav`, fixed, `safe-area-inset-bottom`, 44px targets) with the 5 primary destinations (Overview, Findings, Experiments, Graph, Chat) and a "More" entry opening a **top menu drawer** for the rest (Search, Lineage, System Status, Design System). TopBar keeps the product name + version, global search collapses to a **search icon → full-screen command sheet**, backend status becomes a small colored dot (tap → System Status), settings stays top-right.
- New components: `BottomNav`, `NavDrawer` (slide-over), `CommandSheet` (search). `AppShell` switches between `NavRail`+`Outlet` (≥md) and `Outlet`+`BottomNav` (<md).

## 2. Overview / System Map (`overview/OverviewScreen.tsx`)
- **Desktop:** current multi-column (`xl:grid-cols-[1fr_320px]`) — unchanged.
- **Tablet:** collapse to 2-column; the right column (Current Work, Repository Snapshot, Active Context, Quick Actions) drops **below** the main column as full-width side cards (`grid-cols-1 lg:grid-cols-[1fr_300px]`).
- **Mobile:** single column, ordered for guidance: **Current Work + Recommended Next Step first**, then Repository Snapshot (compact metric list), Quick Actions (full-width buttons), Knowledge Loop as a **vertical stepper** (phase label → stacked step rows, no horizontal chevrons), Documentation Layers as stacked cards, Module Status as stacked rows, Recent Activity as a compact feed. The phase connectors become vertical.

## 3. Findings & Open Questions (`findings/FindingsScreen.tsx`, `Inspectors.tsx`)
- **Desktop:** table + right inspector — unchanged.
- **Tablet:** keep the table but hide lower-priority columns (Facets, Evidence, Supersedes / Raised By, Related) via `hidden lg:table-cell`; the inspector becomes a **right slide-over drawer** instead of an inline column.
- **Mobile:** replace the table with a **card list** — each card: mono ID, dominant title, status/confidence + priority/category badges, one metadata line. Toolbar filters move into a **filter bottom sheet** (trigger button shows active-filter count); type tabs (All/Findings/Questions) stay as a segmented control. Selecting a card opens a **full-screen detail** reusing the inspector content, with the primary action **Ask Claude** pinned and View Evidence / View Graph / View Lineage as secondary. Keep the "Select a row…" helper only on ≥md.
- Reuse the existing `FindingInspector`/`QuestionInspector` bodies inside the drawer/full-screen container (no content fork).

## 4. Experiments & Reports (`experiments/ExperimentsScreen.tsx`)
- **Desktop:** left list + center report + right TOC/metadata — unchanged.
- **Tablet:** keep left list + center report; TOC/metadata becomes a **collapsible right drawer** (toggle in the report header).
- **Mobile:** **list-first** — the experiment list is the screen; tapping opens a report detail screen (back affordance). TOC becomes a **sticky section selector** (horizontal scroll chips) or bottom sheet; Related findings/questions and Figures become collapsible sections. Report actions (Ask Claude / View Graph / Copy Path) sticky at the bottom.

## 5. Faceted Search (`search/FacetedSearchScreen.tsx`)
- **Desktop:** left facets + results + right inspector — unchanged.
- **Tablet:** facets become a collapsible left panel; inspector becomes a right drawer.
- **Mobile:** facets open in a **filter bottom sheet**; selected facets show as a **horizontal chip row** pinned at top; results are stacked cards; selecting opens a full-screen result detail. Mode selector (Topic/Facet/Neighbors/Experiment) becomes a dropdown on mobile.

## 6. Knowledge Graph (`graph/KnowledgeGraphScreen.tsx`)
- **Desktop:** full canvas + right inspector — unchanged (already defaults to Neighborhood).
- **Tablet:** canvas primary; inspector becomes a collapsible right drawer; Neighborhood stays default.
- **Mobile:** never render the dense Global graph by default. Default to **Neighborhood**, and add a **Visual Graph / Relationship List** toggle — the Relationship List renders the focused node + grouped incident edges (Related findings / questions / origin experiment / supersedes+conflict) as a tappable list (cheaper and legible on small screens). Node inspector becomes a **bottom sheet**. Global View is gated behind an "Advanced" affordance with the existing dense-graph helper text. The SVG canvas must use `touch-action: none` already in place; ensure pan/zoom works with one finger and pinch.

## 7. Lineage Trace (`lineage/LineageScreen.tsx`)
- **Desktop:** chain + right inspector — unchanged.
- **Tablet:** timeline remains; inspector collapses to a drawer.
- **Mobile:** **vertical lineage timeline**; superseded and latest finding cards stacked; the "Historical record — do not use as latest conclusion" warning stays visible; actions (Go to Latest / Ask Claude / View Evidence) sticky at the bottom.

## 8. Chat Workspace (`chat/*`) — highest-effort screen
- **Desktop:** three panes (Sessions/Files · Chat · Artifact) — unchanged.
- **Tablet:** two panes (Chat + Artifact); the left Sessions/Files pane (already tabbed `SessionExplorerPane`) becomes a **collapsible left drawer** toggled from the chat header.
- **Mobile:** single pane with a **segmented control: Chat · Context · Artifact** (Chat default).
  - **Chat:** transcript + sticky bottom composer; suggested prompts limited to 2–3 + More actions; mode selector stays a dropdown (already is); Trace mode secondary and collapsed (Focus default — already the default).
  - **Context:** the `SessionExplorerPane` content (attached context, sessions, files) hosted in this tab.
  - **Artifact:** the `ArtifactViewer` (preview / metadata / timeline).
  - Proposal review opens as a **full-screen modal** (the existing `ProposalReviewDrawer` rendered full-bleed below md).
  - The dev/prototype state popover stays hidden (Settings gear) on all sizes.

## 9. System Status (`status/SystemStatusScreen.tsx`)
- **Desktop:** services table + right panels + diagnostics — unchanged (`xl:grid-cols-[1fr_360px]`).
- **Tablet:** services table full width; right panels (Claude Relay, Watcher) stack below; diagnostics full width.
- **Mobile:** Health summary strip at top (wraps to rows); services become **status cards** (service, status badge, endpoint, latency); the service detail **drawer becomes a bottom sheet**; repository indexing as stacked file rows; diagnostics as a collapsible log viewer with the severity/service filters in a compact row; degraded state surfaces **Retry connection** as the clear primary action; toasts anchor to a mobile-safe top position.

## 10. Design System — responsive component specs (`designsystem/DesignSystemScreen.tsx`)
Document responsive variants/specimens for: **AppShell** (rail vs bottom-nav), **TopBar** (full vs compact), **NavRail**, **BottomNav**, **NavDrawer**, **BottomSheet**, **ResponsiveDataTable** (table↔cards), **MobileCardList**, **InspectorDrawer** (right drawer / bottom sheet / full-screen), **Modal**, **ChatComposer** (sticky mobile), **ArtifactViewer** (tabbed mobile), **GraphNode**, **LineageCard**, **StatusBadge** (unchanged — already compact), **Toast** (desktop top-right → mobile top-center), **EmptyState**, **LoadingState**, **ErrorState**. Each entry notes its desktop form and its <md adaptation.

## 11. Interaction rules (global)
- Minimum **44px** tap targets on <lg (pad icon buttons, nav items, row actions).
- **No horizontal scrolling on mobile** except inside code/log blocks (`overflow-x-auto` on `<pre>` only).
- Long file paths/IDs: `break-all` or middle-truncate with a copy action; never force page-level overflow.
- Tables → cards below md; inspectors → drawers (md–lg) → full-screen pages (<md).
- Progressive disclosure: advanced/technical detail (Trace mode, Global graph, full metadata, expanded tool events) is collapsed by default and opt-in.
- **Focus Mode is the Chat default; Trace is behind the toggle** (already implemented — preserve on mobile).
- Respect `prefers-reduced-motion`; keep transitions subtle (consistent with the calm console tone).
- Honor safe-area insets for bottom nav / sticky composer.

## 12. Output: rollout

**Priority order (generate first → last):**
1. Global shell (BottomNav, NavDrawer, CommandSheet, AppShell switch) + `useBreakpoint` — unblocks every screen.
2. Findings (table→cards + filter sheet + detail) — most-used data screen.
3. Chat Workspace (segmented Chat/Context/Artifact + sticky composer + full-screen proposal review) — highest complexity, highest value.
4. Overview (single-column guidance order + vertical stepper).
5. Experiments (list-first + report detail).
6. System Status (status cards + bottom-sheet service detail).
7. Faceted Search, Knowledge Graph (Relationship List), Lineage.
8. Design System responsive specimens.

**Shared infrastructure to build once and reuse:** `useBreakpoint`, `BottomSheet`, `Drawer`, `ResponsiveInspector` wrapper (chooses inline column / right drawer / bottom sheet / full-screen by breakpoint), `MobileCardList` row, `SegmentedControl`. Reuse existing `ScreenHeader`, `StatusBadge`, `MonoId`, `MetaRow`, `EmptyState`, and the existing inspector bodies — do not fork content per breakpoint.

**Risks & constraints:**
- **Knowledge Graph** SVG pan/zoom + force layout is the hardest to make touch-friendly; the Relationship List fallback de-risks mobile and should ship as the mobile default.
- **Chat three-pane → single-pane** requires lifting pane visibility into state; ensure session-consistency (already centralized in `ChatWorkspaceScreen`) is preserved when panes become tabs.
- **Dense tables** (Findings, Services, Diagnostics) must fully convert to cards below md — partial column-hiding alone will still overflow at 360px.
- Avoid regressing desktop: add base/`md`/`lg` classes beneath existing `xl:` rules; do not change `xl+` layouts.
- Keep bundle/runtime light — prefer CSS responsive utilities over JS breakpoint branching except where structure (panes/tabs, table/cards) genuinely differs.
- The dev/prototype state switcher must remain hidden across all breakpoints.

**Recommended responsive frames to create (for design review):**
- Global: TopBar compact, BottomNav, NavDrawer, CommandSheet (mobile).
- Findings: card list, filter bottom sheet, full-screen detail (mobile); table with hidden columns + inspector drawer (tablet).
- Chat: Chat/Context/Artifact segmented tabs + sticky composer + full-screen proposal review (mobile); two-pane + left drawer (tablet).
- Overview: single-column with vertical Knowledge Loop stepper (mobile).
- Experiments: list-first + report detail + sticky actions (mobile).
- System Status: status cards + bottom-sheet service detail + degraded Retry (mobile).
- Knowledge Graph: Neighborhood Relationship-List view + node bottom sheet (mobile).
- Lineage: vertical timeline + sticky actions (mobile).
