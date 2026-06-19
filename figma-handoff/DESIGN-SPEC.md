# Quick Agent System — Design Specification

## Overview

This document provides the complete design specification for the Quick Agent System prototype. Use it alongside the Figma file for precise implementation values.

---

## 1. Color System

### 1.1 Primitives

#### Oxide Neutrals
| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| oxide-50 | `#f2f5f3` | 242, 245, 243 | Primary text |
| oxide-100 | `#d2d9d3` | 210, 217, 211 | Secondary text |
| oxide-200 | `#a9b2ab` | 169, 178, 171 | Muted text |
| oxide-300 | `#6f7a76` | 111, 122, 118 | Disabled text |
| oxide-400 | `#4e5854` | 78, 88, 84 | Borders |
| oxide-500 | `#374039` | 55, 64, 57 | Strong borders |
| oxide-600 | `#252b2a` | 37, 43, 42 | Elevated surfaces |
| oxide-700 | `#191f1c` | 25, 31, 28 | Card backgrounds |
| oxide-800 | `#121614` | 18, 22, 20 | Surface |
| oxide-900 | `#0d100f` | 13, 16, 15 | Panel backgrounds |
| oxide-950 | `#080a09` | 8, 10, 9 | Page background |
| oxide-1000 | `#050605` | 5, 6, 5 | Deepest black |

#### Orange Brand Scale
| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| orange-50 | `#fff2ef` | 255, 242, 239 | Brand tint light |
| orange-100 | `#ffe3d4` | 255, 227, 212 | Brand tint |
| orange-200 | `#ffcab1` | 255, 202, 177 | Brand light |
| orange-300 | `#ffae79` | 255, 174, 121 | Brand medium |
| orange-400 | `#ff924b` | 255, 146, 75 | Brand |
| orange-500 | `#ff3e01` | 255, 62, 1 | **Primary brand** |
| orange-600 | `#e63700` | 230, 55, 0 | Brand hover |
| orange-700 | `#b02900` | 176, 41, 0 | Brand pressed |
| orange-800 | `#7a1b00` | 122, 27, 0 | Brand dark |
| orange-900 | `#440f00` | 68, 15, 0 | Brand darkest |

#### Success (Green)
| Token | Hex | Usage |
|-------|-----|-------|
| green-50 | `#e0f7eb` | Success tint |
| green-100 | `#b1ead1` | Success light |
| green-200 | `#82ddb3` | Success medium |
| green-300 | `#53d095` | Success |
| green-400 | `#39c289` | **Success primary** |
| green-500 | `#25b988` | Success dark |

#### Warning (Amber)
| Token | Hex | Usage |
|-------|-----|-------|
| amber-50 | `#fef6d1` | Warning tint |
| amber-100 | `#fdeba6` | Warning light |
| amber-200 | `#fce07b` | Warning medium |
| amber-300 | `#f3c969` | **Warning primary** |
| amber-400 | `#edb95c` | Warning dark |

#### Error (Red)
| Token | Hex | Usage |
|-------|-----|-------|
| red-50 | `#ff0a0a` | Error tint |
| red-100 | `#ff3838` | Error light |
| red-200 | `#ff6b6b` | **Error primary** |
| red-300 | `#ff6b6b` | Error medium |
| red-400 | `#ff4a4a` | Error dark |
| red-500 | `#ff6b6b` | Error darkest |

#### Information (Blue)
| Token | Hex | Usage |
|-------|-----|-------|
| blue-50 | `#e8f0ff` | Info tint |
| blue-100 | `#c7deff` | Info light |
| blue-200 | `#a6ccff` | Info medium |
| blue-300 | `#6ba6ff` | **Info primary** |
| blue-400 | `#6ba6ff` | Info dark |

#### Lineage (Purple)
| Token | Hex | Usage |
|-------|-----|-------|
| purple-50 | `#f2edff` | Lineage tint |
| purple-100 | `#e0d8ff` | Lineage light |
| purple-200 | `#c7bef6` | Lineage medium |
| purple-300 | `#a699ee` | **Lineage primary** |
| purple-400 | `#8b7cf6` | Lineage dark |
| purple-500 | `#7a6bde` | Lineage darkest |

### 1.2 Semantic Colors (Dark Mode)

| Token | Value | CSS Variable |
|-------|-------|--------------|
| background | `#080a0b` | `var(--background)` |
| foreground | `#f2f5f3` | `var(--foreground)` |
| surface | `#0d1012` | `var(--surface)` |
| surface-2 | `#12161a` | `var(--surface-2)` |
| elevated | `#171c20` | `var(--elevated)` |
| primary | `#ff3e01` | `var(--primary)` |
| primary-foreground | `#080a0b` | `var(--primary-foreground)` |
| secondary | `#12161a` | `var(--secondary)` |
| muted | `#12161a` | `var(--muted)` |
| muted-foreground | `#6f7a76` | `var(--muted-foreground)` |
| accent | `#1a0e0a` | `var(--accent)` |
| destructive | `#ff6b6b` | `var(--destructive)` |
| border | `#252b30` | `var(--border)` |
| input | `#252b30` | `var(--input)` |
| ring | `#ff3e01` | `var(--ring)` |
| sidebar | `#0d1012` | `var(--sidebar)` |

### 1.3 Chart Colors

| Token | Value | CSS Variable |
|-------|-------|--------------|
| chart-1 | `#ff3e01` | `var(--chart-1)` |
| chart-2 | `#2dd4bf` | `var(--chart-2)` |
| chart-3 | `#f3c969` | `var(--chart-3)` |
| chart-4 | `#8b7cf6` | `var(--chart-4)` |
| chart-5 | `#ff6b6b` | `var(--chart-5)` |

---

## 2. Typography

### 2.1 Font Families

| Family | Fallbacks | Usage |
|--------|-----------|-------|
| Inter | `ui-sans-serif, system-ui, sans-serif` | Body text, labels, UI |
| JetBrains Mono | `ui-monospace, SFMono-Regular, monospace` | IDs, code, timestamps, labels |

### 2.2 Type Scale

| Name | Size | Line Height | Weight | Font | Usage |
|------|------|-------------|--------|------|-------|
| 2xs | 10px | 1.5 | 400 | JetBrains Mono | Kicker labels, status dots |
| xs | 12px | 1.5 | 400 | JetBrains Mono | Micro metadata, secondary labels |
| sm | 13px | 1.5 | 400 | Inter | Body text, table text |
| base | 14px | 1.5 | 400 | Inter | Default body, form labels |
| md | 15px | 1.5 | 500 | Inter | Inspector headings, panel titles |
| lg | 16px | 1.5 | 500 | Inter | H3 report headings |
| xl | 18px | 1.5 | 500 | Inter | Screen titles |
| 2xl | 21px | 1.5 | 500 | Inter | Report main titles |

### 2.3 Monospace Usage Patterns

```css
/* Finding/Question IDs */
font-family: 'JetBrains Mono', monospace;
font-size: 12px;
font-weight: 400;

/* Status labels */
font-family: 'JetBrains Mono', monospace;
font-size: 11px;
font-weight: 500;

/* Timestamps */
font-family: 'JetBrains Mono', monospace;
font-size: 10px;
font-weight: 400;
```

---

## 3. Spacing

### 3.1 Tailwind-Compatible Scale

| Token | Pixels | CSS |
|-------|--------|-----|
| 0 | 0px | `0` |
| 0.5 | 2px | `0.125rem` |
| 1 | 4px | `0.25rem` |
| 1.5 | 6px | `0.375rem` |
| 2 | 8px | `0.5rem` |
| 2.5 | 10px | `0.625rem` |
| 3 | 12px | `0.75rem` |
| 3.5 | 14px | `0.875rem` |
| 4 | 16px | `1rem` |
| 5 | 20px | `1.25rem` |
| 6 | 24px | `1.5rem` |
| 7 | 28px | `1.75rem` |
| 8 | 32px | `2rem` |
| 9 | 36px | `2.25rem` |
| 10 | 40px | `2.5rem` |
| 11 | 44px | `2.75rem` |
| 12 | 48px | `3rem` |
| 14 | 56px | `3.5rem` |
| 16 | 64px | `4rem` |
| 20 | 80px | `5rem` |
| 24 | 96px | `6rem` |

### 3.2 Common Patterns

```css
/* Component internal padding */
padding: 12px 16px;  /* p-3 p-4 */

/* Card padding */
padding: 16px;       /* p-4 */

/* Section spacing */
gap: 16px;            /* gap-4 */

/* Table row height */
height: 44px;         /* h-11 */

/* Inspector padding */
padding: 16px 16px 24px 16px;
```

---

## 4. Border Radius

| Token | Pixels | CSS Variable | Usage |
|-------|--------|--------------|-------|
| none | 0px | `--radius-none` | Sharp edges |
| sm | 2px | `--radius-sm` | Buttons, inputs, cards |
| md | 4px | `--radius-md` | Default radius |
| lg | 6px | `--radius-lg` | Slightly rounded |
| xl | 8px | `--radius-xl` | Dropdowns, popovers |
| full | 9999px | `--radius-full` | Pills, badges, status dots |

### Radius Usage

```css
/* Oxide aesthetic: minimal radius */
border-radius: 2px;   /* Most components */
border-radius: 4px;   /* Cards, containers */
border-radius: 9999px; /* Status pills, badges */
```

---

## 5. Sizing

### 5.1 Icon Sizes

| Name | Pixels | Usage |
|------|--------|-------|
| icon-sm | 16px | Inline icons, nav icons |
| icon-md | 18px | Standard icons |
| icon-lg | 20px | Primary action icons |
| icon-xl | 22px | Feature icons |

### 5.2 Control Sizes

| Name | Pixels | Usage |
|------|--------|-------|
| control-h | 36px | Standard inputs, buttons |
| control-h-lg | 40px | Large buttons, CTAs |
| input-h | 36px | Form inputs |
| touch-target | 44px | Mobile tap targets (minimum) |

### 5.3 Layout Sizes

| Name | Pixels | Usage |
|------|--------|-------|
| nav-rail-collapsed | 56px | Collapsed nav rail width |
| nav-rail-expanded | 240px | Expanded nav rail width |
| bottom-nav-h | 56px | Mobile bottom nav height |
| inspector-w | 380px | Right inspector panel |
| inspector-w-lg | 400px | Large inspector panel |
| topbar-h | 52px | Global header height |

---

## 6. Component Specifications

### 6.1 Button

| Property | Value |
|----------|-------|
| Height (sm) | 32px |
| Height (md) | 36px |
| Height (lg) | 40px |
| Padding | 0 16px |
| Border radius | 4px |
| Font size | 12-14px |
| Font weight | Medium (500) |
| Font family | Inter |

**Variants:**
- `primary`: Orange fill (#ff3e01), dark text
- `secondary`: Surface fill (#12161a), light text, border
- `ghost`: Transparent, light text
- `destructive`: Red fill (#ff6b6b), dark text

### 6.2 StatusBadge

| Property | Value |
|----------|-------|
| Height | 24px |
| Padding | 0 8px |
| Border radius | 4px |
| Dot size | 6px |
| Font size | 11px |
| Font family | JetBrains Mono |

**Tones:**
- success, warning, error, info, brand, lineage, neutral

### 6.3 Input

| Property | Value |
|----------|-------|
| Height | 36px |
| Padding | 0 12px |
| Border radius | 4px |
| Border color | #252b30 |
| Background | #12161a |
| Font size | 13px |
| Font family | Inter |

**States:** default, focused, error, disabled

### 6.4 InspectorFrame

| Property | Value |
|----------|-------|
| Width (desktop) | 380px |
| Width (large) | 400px |
| Background | #0d1012 |
| Border | 1px solid #252b30 |
| Header height | 48px |
| Padding | 16px |

### 6.5 TopBar

| Property | Value |
|----------|-------|
| Height | 52px |
| Background | #0d1012 |
| Border | 1px solid #252b30 (bottom) |
| Padding | 0 16px |
| Logo font | JetBrains Mono Bold, #ff3e01 |

### 6.6 NavRail

| Property | Value |
|----------|-------|
| Width (collapsed) | 56px |
| Width (expanded) | 240px |
| Background | #0d1012 |
| Border | 1px solid #252b30 (right) |
| Item size | 40x40px |
| Item radius | 4px |
| Active color | #ff3e01 |

### 6.7 BottomNav

| Property | Value |
|----------|-------|
| Height | 56px |
| Background | #0d1012 |
| Border | 1px solid #252b30 (top) |
| Item count | 5 + More |
| Safe area | `env(safe-area-inset-bottom)` |

### 6.8 Card

| Property | Value |
|----------|-------|
| Background | #0d1012 |
| Border | 1px solid #252b30 |
| Border radius | 4px |
| Padding | 16px |
| Gap | 12px |

### 6.9 EmptyState

| Property | Value |
|----------|-------|
| Icon size | 48x48px |
| Icon radius | 8px |
| Icon background | #12161a |
| Title font | Inter Medium 15px |
| Hint font | Inter Regular 13px |
| Hint color | #6f7a76 |

---

## 7. Responsive Breakpoints

| Alias | Tailwind | Pixel Range | Behavior |
|-------|----------|-------------|----------|
| Mobile | `< md` | < 768px | Single pane, cards, bottom nav |
| Tablet | `md` to `< xl` | 768px - 1279px | Two-pane, nav rail, drawers |
| Desktop | `xl` and above | ≥ 1280px | Three-pane, sidebars, full nav |

### 7.1 Responsive Patterns

**Tables → Cards:**
- Desktop (lg+): Dense table rows
- Tablet/Mobile: Card layout with same data

**Inspectors → Overlays:**
- Desktop (lg+): Static right panel
- Mobile: Fixed overlay (`inset-0 z-50`)

**Side Panels → Drawers:**
- Desktop (xl+): Persistent sidebar
- Tablet: Slide-over drawer
- Mobile: Full-screen or bottom sheet

**Navigation:**
- Desktop: Expanded nav rail (240px)
- Tablet: Collapsed nav rail (56px)
- Mobile: Bottom nav bar

---

## 8. Route Specifications

### 8.1 Findings

**Desktop (1440×900):**
- Left: NavRail (56px)
- Center: Tab bar + Findings table
- Right: Inspector (380px)

**Tablet (900×900):**
- Left: NavRail (56px)
- Center: Card list
- Right: Inspector overlay on selection

**Mobile (390×844):**
- Top: TopBar
- Center: Card list
- Bottom: BottomNav
- Overlay: Inspector on selection

**States:**
- All / Findings / Questions tabs
- Active filters (confidence, status, actionable)
- Search results and no-result state
- Normal, selected, expanded, superseded rows

### 8.2 Experiments

**Desktop (1440×900):**
- Left: NavRail (56px)
- Center-Left: Experiment list (300px)
- Center-Right: Report viewer
- Right: Details sidebar (xl+)

**Tablet (900×900):**
- List/Report toggle with back button
- Details as drawer

**Mobile (390×844):**
- List view or report view (not both)
- Back navigation
- Details as bottom sheet

### 8.3 Search

**Desktop (1440×900):**
- Left: NavRail (56px)
- Center-Left: Facet panel (240px)
- Center-Right: Results list
- Right: Inspector (380px)

**States:**
- Initial guidance state
- Topic / Facet / Neighbors / Experiment modes
- Selected facets with accordion
- No matches state

### 8.4 Graph

**Desktop (1440×900):**
- Left: NavRail (56px)
- Center: SVG graph canvas with minimap
- Right: Node inspector (380px)

**Modes:**
- Neighborhood (radial layout, depth controls)
- Global (force-directed layout)
- Dense edge warning state

### 8.5 Lineage

**Desktop (1440×900):**
- Left: NavRail (56px)
- Center-Left: Chain list (240px)
- Center: Timeline visualization
- Right: Detail inspector (380px)

**States:**
- Default supersedes chain
- Historical finding selected
- Latest finding selected
- Current/latest version emphasis

### 8.6 Chat

**Desktop (1440×900):**
- Left: Session explorer (280px)
- Center: Chat stream
- Right: Artifact viewer (380px)

**Tablet (900×900):**
- Two-pane: Chat + Artifact
- Sessions as drawer

**Mobile (390×844):**
- Tabbed: Chat / Context / Artifact
- SegmentedControl for switching

**States:**
- Running, completed, failed sessions
- Connected, connecting, disconnected relay
- New session modal
- Context selection
- Composer modes (idle, streaming)
- Proposal states (idle, pending, completed, failed)

### 8.7 Status

**Desktop (1440×900):**
- Left: NavRail (56px)
- Center: Health summary + services table
- Right: Diagnostics panel (xl+)

**States:**
- Operational / Degraded systems
- Backend offline error
- Service selected with details drawer
- Loading states (re-index, reload, test)
- Toast notifications (success, warning, error, info)
- Diagnostics with severity/service filters

### 8.8 Overview

**Desktop (1440×900):**
- Full-width knowledge loop diagram
- Documentation layers
- Module status table
- Current work section
- Repo snapshot
- Quick actions
- Recent activity

---

## 9. Interactions

### 9.1 Navigation Flows

- Findings → Experiments (via finding's related experiments)
- Findings → Graph (via finding node selection)
- Findings → Lineage (via supersedes chain)
- Experiments → Findings (via related findings)
- Graph → any screen (via node selection + inspector action)
- Lineage → Findings (via chain item selection)

### 9.2 Overlay Interactions

- Inspector open/close (click row → open, click × → close)
- Drawer slide-in/out (mobile menu, session explorer)
- Modal open/close (new session, confirm actions)
- Dropdown menu (row actions, context menu)

### 9.3 Mobile Navigation

- BottomNav tap → route change
- More → NavDrawer slide-in
- Back button → previous screen
- SegmentedControl → tab switch (Chat)

---

## 10. Accessibility

### 10.1 Focus Visibility

```css
/* Orange focus ring */
outline: 2px solid var(--brand-primary);
outline-offset: 2px;
```

### 10.2 Touch Targets

All interactive elements must be at least **44×44px** on mobile.

### 10.3 Contrast

- Primary text on background: 15.4:1 ✓
- Secondary text on background: 4.7:1 ✓
- Muted text on background: 2.9:1 (decorative only)
- Orange on dark: 4.6:1 ✓

### 10.4 Screen Reader

- All images have alt text
- Interactive elements have aria-labels
- Status badges announce state changes
- Tab order follows visual layout

---

## 11. CSS Variable Reference

```css
:root {
  /* Primitives */
  --oxide-50: #f2f5f3;
  --oxide-1000: #050605;
  --orange-500: #ff3e01;
  --green-400: #39c289;
  --amber-300: #f3c969;
  --red-200: #ff6b6b;
  --blue-300: #6ba6ff;
  --purple-400: #8b7cf6;

  /* Semantic */
  --background: #080a0b;
  --foreground: #f2f5f3;
  --surface: #0d1012;
  --primary: #ff3e01;
  --muted: #12161a;
  --border: #252b30;
  --ring: #ff3e01;

  /* Spacing */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-4: 16px;
  --spacing-6: 24px;

  /* Radius */
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 6px;
  --radius-xl: 8px;

  /* Typography */
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

---

## 12. Source Code References

| Component | Source File |
|-----------|------------|
| AppShell | `src/app/components/shell/AppShell.tsx` |
| TopBar | `src/app/components/shell/TopBar.tsx` |
| NavRail | `src/app/components/shell/NavRail.tsx` |
| BottomNav | `src/app/components/shell/BottomNav.tsx` |
| NavDrawer | `src/app/components/shell/NavDrawer.tsx` |
| StatusBadge | `src/app/components/common/StatusBadge.tsx` |
| EmptyState | `src/app/components/common/EmptyState.tsx` |
| InspectorFrame | `src/app/components/common/InspectorFrame.tsx` |
| FindingsScreen | `src/app/components/findings/FindingsScreen.tsx` |
| ExperimentsScreen | `src/app/components/experiments/ExperimentsScreen.tsx` |
| KnowledgeGraphScreen | `src/app/components/graph/KnowledgeGraphScreen.tsx` |
| LineageScreen | `src/app/components/lineage/LineageScreen.tsx` |
| FacetedSearchScreen | `src/app/components/search/FacetedSearchScreen.tsx` |
| ChatWorkspaceScreen | `src/app/components/chat/ChatWorkspaceScreen.tsx` |
| SystemStatusScreen | `src/app/components/status/SystemStatusScreen.tsx` |
| OverviewScreen | `src/app/components/overview/OverviewScreen.tsx` |
| Theme CSS | `src/styles/theme.css` |
| Fonts CSS | `src/styles/fonts.css` |
