# Frontend Handoff

Notes for developers working on the Quick Agent System codebase.

## Project structure

```
src/
├── main.tsx                     # Entry point
├── app/
│   ├── App.tsx                  # Router + ThemeProvider + AuthProvider
│   ├── data/                    # Static mock data + types
│   │   ├── types.ts             # Core data model types
│   │   ├── findings.ts          # Finding rows
│   │   ├── openQuestions.ts     # OpenQuestion rows
│   │   ├── experiments.ts       # Experiment rows + markdown
│   │   ├── edges.ts             # Graph edges + node helpers
│   │   ├── chat.ts              # Chat sessions + bundles
│   │   ├── tagTaxonomy.ts       # Facet dimensions
│   │   └── index.ts             # Re-exports + lookup helpers
│   └── components/
│       ├── shell/               # AppShell, NavRail, TopBar, etc.
│       ├── common/              # Shared primitives
│       ├── responsive/          # Breakpoint + drawer system
│       ├── ui/                  # shadcn components (do not edit directly)
│       ├── chat/                # Chat workspace screen
│       ├── findings/            # Findings + questions screen
│       ├── experiments/         # Experiments + reports screen
│       ├── search/              # Faceted search screen
│       ├── graph/               # Knowledge graph screen
│       ├── lineage/             # Lineage screen
│       ├── overview/            # Overview screen
│       └── designsystem/        # Design system (dev-only)
├── styles/
│   ├── theme.css                # Oxide palette + shadcn re-mapping
│   ├── tailwind.css             # Tailwind v4 imports
│   ├── fonts.css                # Font definitions
│   └── globals.css              # Global styles
└── assets/                      # Static assets (SVGs, etc.)
```

---

## Conventions

### Component patterns

- **Functional components only** — no class components
- **Named exports** for screens, default exports for lazy loading
- **Barrel exports** via `index.ts` files where appropriate
- Component files: PascalCase (e.g., `FindingsScreen.tsx`)
- Utility files: camelCase (e.g., `useBreakpoint.ts`)

### State management

- **Local state only** — `useState`, `useReducer` within components
- No global state library (Redux, Zustand, etc.)
- `NavContext` is the only shared context (for `openNav`/`closeNav`)
- URL search params used for deep-link state (`?focus=F-0050`, `?tab=findings`)

### Styling

- **Tailwind CSS v4** — all styling via utility classes
- **No CSS modules** — single global theme file at `src/styles/theme.css`
- Use `cn()` utility from `src/app/components/ui/utils.ts` for conditional classes
- Use Oxide palette tokens: `text-text`, `text-text-secondary`, `text-text-muted`, `bg-surface`, `bg-surface-2`, `bg-elevated`, `border-border-subtle`, `border-border-strong`
- Brand accent: `text-brand`, `bg-brand`, `border-brand-border`
- Status colors: `text-success`, `text-amber`, `text-error`, `text-info`, `text-lineage`
- **No custom CSS** unless absolutely necessary — prefer Tailwind utilities

### Icons

- Use `lucide-react` exclusively
- Standard size: `className="size-4"` or `className="size-5"`
- Consistent stroke width: `strokeWidth={1.75}` for nav icons, default for others

### shadcn components

- Located in `src/app/components/ui/`
- Generated via shadcn CLI — **do not hand-edit**
- Import from `../ui/component-name` path
- Key components: `Button`, `Badge`, `Dialog`, `Drawer`, `DropdownMenu`, `Select`, `Tooltip`, `ResizablePanel`

---

## Responsive system

Three breakpoints defined in `useBreakpoint.ts`:

| Breakpoint | Width | Tailwind class |
|------------|-------|----------------|
| `mobile` | < 768px | `md:hidden` / `hidden md:flex` |
| `tablet` | 768–1279px | `xl:hidden` / `hidden xl:flex` |
| `desktop` | ≥ 1280px | `xl:flex` |

### Patterns

- **Tables → Cards:** Use `hidden lg:table` for tables, `flex flex-col lg:hidden` for card lists
- **Side panels → Drawers:** Use `ResponsiveInspectorOverlay` for inspector panels
- **NavRail → NavDrawer:** Rail visible on `md+`, drawer on mobile
- **Resizable panels → Drawers:** Chat workspace uses `ResizablePanelGroup` on desktop, drawers on tablet/mobile

---

## Adding a new screen

1. Create component in `src/app/components/<screen>/`
2. Add route in `src/app/App.tsx` (lazy load for non-critical screens)
3. Add nav item in `src/app/components/shell/navItems.ts`
4. Use `ScreenHeader` from `../common/primitives` for consistent header
5. Use `cn()` for conditional Tailwind classes
6. Test at all three breakpoints

---

## Data model

All data is static TypeScript in `src/app/data/`. Key types:

```typescript
interface Finding {
  id: string;          // F-NNNN
  category: FindingCategory;
  confidence: Confidence;
  facets: string[];
  supersedes?: string;
  supersededBy?: string;
  actionable: boolean;
}

interface OpenQuestion {
  id: string;          // Q-NNNN
  status: QuestionStatus;
  priority: Priority;
  facets: string[];
}

interface Experiment {
  slug: string;        // experiments/YYYY-MM-DD_slug
  reportStatus: ReportStatus;
  readme: string;      // markdown
  report?: string;     // markdown
}
```

### Lookup helpers

- `getFindingById(id)` / `getQuestionById(id)` / `getExperimentBySlug(slug)`
- `getLatestVersion(id)` — follows supersededBy chain to latest
- `getSupersedesChain(id)` — full chain oldest → newest
- `findById(id)` — generic lookup

---

## Accessibility

- Global `:focus-visible` ring: `2px solid var(--brand-primary-ring)`
- Skip-to-content link in AppShell
- Route focus management (focus moves to heading after navigation)
- `aria-label`, `aria-expanded`, `aria-selected` on interactive elements
- Screen reader live regions for dynamic content
- Contrast matrix documented in `docs/accessibility/contrast-matrix.md`
- Respects `prefers-reduced-motion`

---

## Build & run

```bash
pnpm dev       # Vite dev server
pnpm build     # Production build
```

No lint or typecheck scripts are defined. Run `npx tsc --noEmit` manually if needed.

---

## Common pitfalls

1. **Hash router** — URLs start with `#` (e.g., `/#/chat`)
2. **Lazy routes** — Experiments, Search, Graph, Lineage show "Loading…" on first visit
3. **Dev-only route** — `/design` only works with `import.meta.env.DEV`
4. **Theme persistence** — Theme state comes from `next-themes`, not localStorage directly
5. **NavRail expand state** — Stored in `localStorage` key `qas.navrail.expanded`
6. **Figma asset resolver** — `figma:asset/` imports resolve to `src/assets/`
