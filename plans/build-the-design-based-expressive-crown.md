# Sidebar (NavRail) — World-class polish

## Context
The user selected `<NavRail />` in `src/app/components/shell/AppShell.tsx` and asked to fix the sidebar's UI/UX to a world-class standard (active state + expand/collapse already exist but feel rough). The selected element is only the usage tag; the actual sidebar implementation is `src/app/components/shell/NavRail.tsx`. All changes are confined to **`NavRail.tsx`** — no other files — but that is outside the literal selection, so this needs user confirmation.

## Issues in the current NavRail
1. **Icon jump on toggle** — collapsed items use `size-10 justify-center`, expanded use `px-2.5`, so icons shift horizontally when expanding/collapsing (no shared icon column).
2. **Flat list of 9 items** — no grouping/hierarchy; hard to scan, not "industries-grade".
3. **Active state is minimal** — only a thin teal bar; lacks a refined filled pill + icon tint.
4. **Collapse control placement** — a top "Collapse" button competes with nav items; world-class pattern pins it to the footer.
5. **No focus-visible ring**, labels pop in abruptly, tap targets are 40px (sub-44px).

## Approach (all within `NavRail.tsx`)
- **Shared icon column:** every row is `h-11` (44px) with a fixed `w-9` centered icon lead, so the icon x-position is identical in collapsed and expanded states → smooth, no jump. Rail widths stay `w-14` collapsed / `w-60` expanded with `transition-[width]`.
- **Grouped navigation** (defined locally in NavRail by referencing `navItems` `to` values — no edit to `navItems.ts`):
  - **Knowledge** — Overview, Findings & Questions, Experiments & Reports, Faceted Search, Knowledge Graph, Lineage
  - **Workspace** — Chat Workspace
  - **System** — System Status, Design System
  Expanded: small uppercase mono muted section headers with top spacing. Collapsed: a thin `border-border-subtle` divider between groups instead of headers.
- **Refined active state:** `bg-surface-2` filled pill + rounded, left teal accent bar, icon tinted `text-teal`, label `text-text`; inactive `text-text-muted` → hover `bg-surface-2/60 text-text-secondary`. Driven by `NavLink` `isActive` (keeps `aria-current`).
- **Label transition:** render labels with `opacity`/`translate-x` fade so they ease in when expanding (kept cheap with CSS).
- **Footer collapse toggle:** pinned at bottom via `mt-auto`, full-width with `ChevronsLeft` + "Collapse" when expanded, centered `ChevronsRight` when collapsed; `aria-label`, `title`, and `localStorage` persistence retained.
- **A11y/craft:** `focus-visible:ring-1 ring-teal/50 ring-offset-0`, 44px targets, tooltips shown only when collapsed (labels visible otherwise), `prefers-reduced-motion` respected by keeping transitions subtle.
- Keep the existing Oxide tokens (surface/border-subtle/teal/text-muted) — no new colors, no gradients.

## Critical file
- `src/app/components/shell/NavRail.tsx` (only). Reuses `navItems` (`shell/navItems.ts`), `cn` (`ui/utils`), and the shadcn `Tooltip` already imported.

## Verification
Dev server hot-reloads. At ≥md width:
- Toggle collapse/expand: icons stay perfectly aligned (no horizontal jump); width animates; choice persists across reload.
- Groups render with section headers when expanded and dividers when collapsed.
- Active route shows the filled pill + teal accent + teal icon; hovering inactive items shows the subtle hover bg; keyboard Tab shows a focus ring.
- Collapsed: hovering an item shows its tooltip; expanded: no tooltips, labels visible.
- Mobile (<md) unaffected (rail hidden, bottom nav unchanged).
