# Component Mapping — Figma → React

## How to Use This Document

Each component in the Figma file maps to a specific React component. Use this to:
1. Find the React implementation when implementing from Figma
2. Understand component props and variants
3. Locate responsive behavior logic

---

## Shell Components

### TopBar
| Property | Figma | React |
|----------|-------|-------|
| Component | `TopBar` | `src/app/components/shell/TopBar.tsx` |
| Height | 52px | `h-[52px]` |
| Background | `#0d1012` | `bg-surface` |
| Border | bottom 1px | `border-b border-border-subtle` |

**Variants:**
- Desktop: Full search bar visible
- Mobile: Search icon only, green dot status

### NavRail
| Property | Figma | React |
|----------|-------|-------|
| Component | `NavRail` | `src/app/components/shell/NavRail.tsx` |
| Width (collapsed) | 56px | `w-[56px]` |
| Width (expanded) | 240px | `w-[240px]` |
| Background | `#0d1012` | `bg-surface` |
| Border | right 1px | `border-r border-border-subtle` |

**States:**
- Expanded: Labels visible, full width
- Collapsed: Icons only, tooltips on hover
- Mobile: Hidden (replaced by BottomNav)

**Persistence:** `localStorage` key `nav-rail-collapsed`

### BottomNav
| Property | Figma | React |
|----------|-------|-------|
| Component | `BottomNav` | `src/app/components/shell/BottomNav.tsx` |
| Height | 56px | `h-[56px]` |
| Items | 5 + More | 5 routes + NavDrawer trigger |
| Safe area | iOS | `pb-[env(safe-area-inset-bottom)]` |

### NavDrawer
| Property | Figma | React |
|----------|-------|-------|
| Component | `NavDrawer` | `src/app/components/shell/NavDrawer.tsx` |
| Width | 280px | `w-[280px]` |
| Trigger | "More" in BottomNav | `onClick` handler |

---

## Common Primitives

### StatusBadge
| Property | Figma | React |
|----------|-------|-------|
| Component | `StatusBadge` | `src/app/components/common/StatusBadge.tsx` |
| Height | 24px | `h-6` |
| Dot | 6px circle | `w-1.5 h-1.5 rounded-full` |
| Font | JetBrains Mono 11px | `font-mono text-[11px]` |

**Tones (14 total):**
| Tone | Border | Background | Text | Dot |
|------|--------|------------|------|-----|
| success | green-400 | green-50 | green-400 | green-400 |
| warning | amber-300 | amber-50 | amber-300 | amber-300 |
| error | red-200 | red-50 | red-200 | red-200 |
| info | blue-300 | blue-50 | blue-300 | blue-300 |
| brand | orange-500 | orange-50 | orange-500 | orange-500 |
| lineage | purple-400 | purple-50 | purple-400 | purple-400 |
| neutral | oxide-200 | oxide-900 | oxide-200 | oxide-200 |

**Value Mapping:**
```typescript
// StatusBadge.tsx - getToneFromValue()
"high" → success
"medium" → warning
"low" → error
"superseded" → neutral
"actionable" → brand
// ... 14 total mappings
```

### MonoId
| Property | Figma | React |
|----------|-------|-------|
| Component | `MonoId` | `src/app/components/common/primitives.tsx` |
| Font | JetBrains Mono 12px | `font-mono text-xs` |
| Color | oxide-200 | `text-text-secondary` |

**Usage:** Finding IDs (`F-0001`), Question IDs (`Q-0003`), experiment slugs

### MetaRow
| Property | Figma | React |
|----------|-------|-------|
| Component | `MetaRow` | `src/app/components/common/primitives.tsx` |
| Label | Uppercase mono 10px | `font-mono text-[10px] uppercase` |
| Value | Regular 13px | `text-[13px]` |

### ScreenHeader
| Property | Figma | React |
|----------|-------|-------|
| Component | `ScreenHeader` | `src/app/components/common/primitives.tsx` |
| Height | 56px | `h-14` |
| Title | Inter Medium 18px | `text-xl font-medium` |
| Padding | 0 24px | `px-6` |

### InspectorFrame
| Property | Figma | React |
|----------|-------|-------|
| Component | `InspectorFrame` | `src/app/components/common/InspectorFrame.tsx` |
| Width (desktop) | 380px | `w-[380px]` |
| Width (large) | 400px | `lg:w-[400px]` |
| Background | `#0d1012` | `bg-surface` |
| Header height | 48px | `h-12` |

### EmptyState
| Property | Figma | React |
|----------|-------|-------|
| Component | `EmptyState` | `src/app/components/common/EmptyState.tsx` |
| Icon size | 48x48px | `w-12 h-12` |
| Title | Inter Medium 15px | `text-[15px] font-medium` |
| Hint | Inter Regular 13px | `text-[13px] text-text-muted` |

### FilterSelect
| Property | Figma | React |
|----------|-------|-------|
| Component | `FilterSelect` | `src/app/components/common/FilterSelect.tsx` |
| Height | 36px | `h-9` |
| Background | `#12161a` | `bg-surface-2` |
| Border | 1px solid `#252b30` | `border border-border-subtle` |

### AskClaudeButton
| Property | Figma | React |
|----------|-------|-------|
| Component | `AskClaudeButton` | `src/app/components/common/AskClaudeActions.tsx` |
| Background | `#ff3e01` | `bg-brand-primary` |
| Text | `#080a0b` | `text-background` |

---

## Screen Components

### FindingsScreen
| Property | Figma | React |
|----------|-------|-------|
| Component | `FindingsScreen` | `src/app/components/findings/FindingsScreen.tsx` |
| Inspector | `FindingInspector` | `src/app/components/findings/Inspectors.tsx` |

**Layout:**
- Desktop: NavRail + Content (tabs + table) + Inspector
- Tablet: NavRail + Content (cards) + Inspector overlay
- Mobile: TopBar + Content (cards) + BottomNav + Inspector overlay

**Responsive:**
- Table (lg+): `hidden lg:table` — dense table rows
- Cards (< lg): `lg:hidden` — card layout
- Inspector: `ResponsiveInspectorOverlay`

### ExperimentsScreen
| Property | Figma | React |
|----------|-------|-------|
| Component | `ExperimentsScreen` | `src/app/components/experiments/ExperimentsScreen.tsx` |
| Markdown | `Markdown` | `src/app/components/experiments/markdown.tsx` |

**Layout:**
- Desktop: NavRail + List (300px) + Report + Details sidebar (xl+)
- Tablet: NavRail + List/Report toggle + Details drawer
- Mobile: TopBar + List or Report + Back button + Details drawer

### FacetedSearchScreen
| Property | Figma | React |
|----------|-------|-------|
| Component | `FacetedSearchScreen` | `src/app/components/search/FacetedSearchScreen.tsx` |

**Layout:**
- Desktop: NavRail + Facet panel (240px) + Results + Inspector
- Tablet: NavRail + Results + Inspector overlay
- Mobile: TopBar + Results + BottomNav + Inspector overlay

**Modes:** topic, facet, neighbors, experiment

### KnowledgeGraphScreen
| Property | Figma | React |
|----------|-------|-------|
| Component | `KnowledgeGraphScreen` | `src/app/components/graph/KnowledgeGraphScreen.tsx` |
| Layout | `radialLayout`, `forceLayout` | `src/app/components/graph/layout.ts` |

**Layout:**
- Desktop: NavRail + SVG canvas + Minimap + Inspector (380px)
- Tablet: NavRail + SVG canvas + Inspector overlay
- Mobile: TopBar + SVG canvas + BottomNav + Bottom sheet inspector

**Modes:** neighborhood (radial), global (force-directed)

### LineageScreen
| Property | Figma | React |
|----------|-------|-------|
| Component | `LineageScreen` | `src/app/components/lineage/LineageScreen.tsx` |

**Layout:**
- Desktop: NavRail + Chain list (240px) + Timeline + Inspector
- Tablet: NavRail + Timeline + Inspector overlay
- Mobile: TopBar + Timeline + BottomNav + Inspector overlay

### ChatWorkspaceScreen
| Property | Figma | React |
|----------|-------|-------|
| Component | `ChatWorkspaceScreen` | `src/app/components/chat/ChatWorkspaceScreen.tsx` |
| Stream | `ChatStream` | `src/app/components/chat/ChatStream.tsx` |
| Events | `ChatEventView`, `ActivityGroup`, `ProposalGroup` | `src/app/components/chat/ChatEvents.tsx` |
| Artifacts | `ArtifactViewer` | `src/app/components/chat/ArtifactViewer.tsx` |
| Sessions | `SessionExplorerPane` | `src/app/components/chat/SessionExplorerPane.tsx` |
| New Session | `NewChatModal` | `src/app/components/chat/NewChatModal.tsx` |
| Proposals | `ProposalReviewDrawer` | `src/app/components/chat/ProposalReviewDrawer.tsx` |

**Layout:**
- Desktop: Session explorer (280px) + Chat stream + Artifact viewer (380px)
- Tablet: Two-pane (Chat + Artifact), sessions in Drawer
- Mobile: SegmentedControl (Chat/Context/Artifact)

**Session States:** running, completed, failed
**Relay States:** connected, connecting, disconnected, not-configured

### SystemStatusScreen
| Property | Figma | React |
|----------|-------|-------|
| Component | `SystemStatusScreen` | `src/app/components/status/SystemStatusScreen.tsx` |

**Layout:**
- Desktop: NavRail + Health grid + Services table + Diagnostics (xl+)
- Tablet: NavRail + Health grid + Services table
- Mobile: TopBar + Health cards + BottomNav

### OverviewScreen
| Property | Figma | React |
|----------|-------|-------|
| Component | `OverviewScreen` | `src/app/components/overview/OverviewScreen.tsx` |

**Layout:** Full-width content with knowledge loop diagram, module status, current work, repo snapshot, quick actions, recent activity.

---

## Responsive Utilities

### useBreakpoint
| Property | Figma | React |
|----------|-------|-------|
| Hook | — | `src/app/components/responsive/useBreakpoint.ts` |
| Returns | `mobile` / `tablet` / `desktop` | Based on `window.innerWidth` |
| Breakpoints | 768px / 1280px | `< md` / `md–xl` / `≥ xl` |

### ResponsiveInspectorOverlay
| Property | Figma | React |
|----------|-------|-------|
| Component | — | `src/app/components/responsive/ResponsiveInspectorOverlay.tsx` |
| Desktop (lg+) | Static flex panel | `lg:static lg:flex` |
| Mobile | Fixed overlay | `fixed inset-0 z-50` |

### Drawer
| Property | Figma | React |
|----------|-------|-------|
| Component | — | `src/app/components/responsive/Drawer.tsx` |
| Width | Configurable | `w-[280px]` default |
| Direction | left / right | `direction` prop |

### BottomSheet
| Property | Figma | React |
|----------|-------|-------|
| Component | — | `src/app/components/responsive/BottomSheet.tsx` |
| Trigger | Mobile only | `md:hidden` |
| Grab bar | 40×4px | `w-10 h-1 rounded-full` |

### SegmentedControl
| Property | Figma | React |
|----------|-------|-------|
| Component | — | `src/app/components/responsive/SegmentedControl.tsx` |
| Usage | Chat mobile tabs | Chat / Context / Artifact |

---

## UI Library (shadcn)

The prototype uses 40 shadcn components but only actively uses:

| Component | Usage |
|-----------|-------|
| `DropdownMenu` | FindingsScreen row actions |
| `Tooltip` / `TooltipContent` | NavRail collapsed labels |
| `cn()` | Class merging (clsx + tailwind-merge) |

Available but unused: accordion, alert, alert-dialog, avatar, badge, button, calendar, card, checkbox, command, dialog, drawer, form, input, label, popover, progress, radio-group, scroll-area, select, separator, sheet, skeleton, switch, table, tabs, textarea, toggle, tooltip.

---

## Data Types

### Finding
```typescript
{
  id: string;           // "F-0001"
  date: string;
  category: string;     // 7 types
  tags: string[];
  title: string;
  summary: string;
  evidence: string;
  confidence: string;   // "high" | "medium" | "low" | "unvalidated" | "superseded"
  supersedes?: string;
  supersededBy?: string;
  actionable: boolean;
  facets: Record<string, string[]>;
  relatedQuestions?: string[];
}
```

### OpenQuestion
```typescript
{
  id: string;           // "Q-0003"
  raisedDate: string;
  priority: string;
  status: string;       // "open" | "investigating" | "resolved" | "wontfix"
  area: string;
  title: string;
  detail: string;
  raisedBy: string;
  related: string[];
  facets: Record<string, string[]>;
}
```

### Experiment
```typescript
{
  slug: string;
  title: string;
  date: string;
  conclusions: string[];
  reportStatus: string; // "standard" | "readme-only" | "missing" | "schema"
  outdated?: boolean;
  lastModified: string;
  relatedFindings: string[];
  relatedQuestions?: string[];
  freshness: string;
  figures: string[];
  readme: string;
  report?: string;
}
```

### ChatSession
```typescript
{
  id: string;
  title: string;
  slug: string;
  status: string;       // "running" | "completed" | "failed"
  lastUpdated: string;
}
```
