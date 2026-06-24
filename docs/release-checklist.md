# Release Checklist

Pre-release verification steps for the Quick Agent System V1 prototype.

---

## 1. Build verification

- [ ] `pnpm build` completes with zero errors
- [ ] `dist/` directory contains expected files (index.html, assets/)
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No console errors in browser dev tools

---

## 2. Route verification

- [ ] `/` redirects to `/chat`
- [ ] `/chat` loads ChatWorkspaceScreen (3 panels on desktop)
- [ ] `/findings` loads FindingsScreen with table + cards
- [ ] `/experiments` loads ExperimentsScreen with sidebar + report
- [ ] `/overview` loads OverviewScreen with loop diagram
- [ ] `/search` loads FacetedSearchScreen
- [ ] `/graph` loads KnowledgeGraphScreen with SVG graph
- [ ] `/lineage` loads LineageScreen with supersedes chains
- [ ] Unknown routes redirect to `/chat`
- [ ] `/design` works in dev mode, 404s in production

---

## 3. Responsive layout

### Desktop (≥ 1280px)
- [ ] NavRail visible with 7 nav items
- [ ] Chat workspace shows 3 resizable panels
- [ ] Findings shows full table with all columns
- [ ] Experiments shows sidebar + report side-by-side
- [ ] Inspector panels render inline (not as drawers)

### Tablet (768–1279px)
- [ ] NavRail hidden, hamburger menu visible
- [ ] Chat workspace panels open as drawers
- [ ] Findings shows table on wider screens, cards on narrower
- [ ] Inspector panels open as right-side drawers

### Mobile (< 768px)
- [ ] Full-width card lists, no horizontal overflow
- [ ] All panels/drawers are full-screen overlays
- [ ] Navigation via bottom sheet or drawer
- [ ] Tables replaced with card layouts

---

## 4. Theme

- [ ] Dark mode is default on first load
- [ ] Theme toggle switches between dark and light
- [ ] Brand accent (#FF3E01) visible in dark mode
- [ ] No color contrast issues on key elements
- [ ] Focus indicators visible in both themes

---

## 5. Data integrity

- [ ] Chat sessions load with correct status indicators
- [ ] Findings display with correct confidence levels
- [ ] Superseded findings are visually dimmed
- [ ] Experiments show correct report status (report/exploration-only/missing)
- [ ] Knowledge graph renders all nodes and edges
- [ ] Lineage chains display in correct order (oldest → newest)

---

## 6. Interactions

- [ ] NavRail expand/collapse persists across page loads
- [ ] Search filters results in real-time
- [ ] Tab switching works in FindingsScreen
- [ ] Row expand/collapse works in tables
- [ ] Inspector panels open and close correctly
- [ ] Deep-links work: `?focus=F-0050`, `?tab=findings`
- [ ] Theme toggle persists across page loads
- [ ] Resizable panels adjust without layout breaks

---

## 7. Accessibility

- [ ] Skip-to-content link appears on Tab focus
- [ ] All interactive elements are keyboard-navigable
- [ ] Focus ring visible on all focusable elements
- [ ] Screen reader reads dynamic content updates
- [ ] No horizontal scroll on any viewport size
- [ ] `prefers-reduced-motion` disables animations

---

## 8. Performance

- [ ] Initial load < 3 seconds on 3G
- [ ] Lazy routes load within 2 seconds
- [ ] No layout shift after route transitions
- [ ] Graph SVG renders without jank
- [ ] No memory leaks on repeated navigation

---

## 9. Deployment

- [ ] `BASE_PATH` env var set correctly for GitHub Pages
- [ ] Hash router works with project subdirectory
- [ ] All assets load from correct paths
- [ ] No mixed content warnings (HTTP/HTTPS)
- [ ] 404 page redirects to home (if applicable)

---

## 10. Documentation

- [ ] `docs/product-scope.md` is up to date
- [ ] `docs/architecture.md` matches current codebase
- [ ] `docs/demo-script.md` steps work end-to-end
- [ ] `docs/frontend-handoff.md` covers all conventions
- [ ] `AGENTS.md` reflects current project state
