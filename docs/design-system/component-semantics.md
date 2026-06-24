# Quick Agent System — Design System

## Component Inventory

### Primitives

#### Button (`components/common/Button.tsx`)
Standard button with 5 variants and 4 sizes. Use for all clickable actions.

| Variant | Use Case | Style |
|---------|----------|-------|
| `primary` | High-emphasis actions (e.g. Submit, Confirm) | `bg-brand text-primary-foreground` |
| `secondary` | Default actions (e.g. Open, View) | `border border-border-strong bg-surface-2` |
| `tertiary` | Low-emphasis actions (e.g. Cancel, Back) | `bg-transparent` |
| `ghost` | **Canonical brand action** (e.g. Ask Claude) | `bg-brand-muted text-brand` |
| `destructive` | Destructive actions (e.g. Delete, Remove) | `bg-destructive/10 text-destructive` |

| Size | Height | Use Case |
|------|--------|----------|
| `sm` | 36px | Compact UI, inline actions |
| `md` | 40px | Default, toolbars |
| `lg` | 48px | Primary CTAs, mobile-first |
| `icon` | 40×40 | Icon-only buttons |

**Rules:**
- All buttons include `focus-visible:ring-2` for keyboard navigation
- Ghost variant is the canonical brand action style
- Never use green semantics for brand actions

---

#### IconButton (`components/common/IconButton.tsx`)
Icon-only button wrapper. Requires `label` for accessibility.

```tsx
<IconButton icon={Search} label="Search" />
<IconButton icon={X} label="Close" active={isOpen} />
```

**Rules:**
- Always provide `label` prop (becomes `aria-label`)
- Use `active` prop for toggle states
- Min touch target: 40×40px (`size="md"` default)

---

#### StatusBadge (`components/common/StatusBadge.tsx`)
Multi-purpose badge for status values. 15 tones.

```tsx
<StatusBadge value="open" />
<StatusBadge value="superseded" tone="muted" />
<StatusBadge value="actionable" tone="brand" />
```

**Rules:**
- Auto-maps value to tone via `VALUE_TONE` lookup
- Use for: status, category, edge-type, report-status
- Do NOT use for: priority, confidence (use PriorityBadge/ConfidenceIndicator)

---

#### PriorityBadge (`components/common/PriorityBadge.tsx`)
Separate badge for priority levels only.

```tsx
<PriorityBadge priority="critical" />
<PriorityBadge priority="high" />
```

**Rules:**
- Only accepts: `critical`, `high`, `medium`, `low`
- Always shows dot indicator
- Never use StatusBadge for priority

---

#### ConfidenceIndicator (`components/common/ConfidenceIndicator.tsx`)
Evidence-strength indicator with optional bar meter.

```tsx
<ConfidenceIndicator level="high" />
<ConfidenceIndicator level="medium-high" showBars />
<ConfidenceIndicator level="low" showLabel />
```

**Rules:**
- Color scale: `high→orange`, `medium-high→amber`, `medium→ochre`, `low→gray`
- Never use green for confidence
- `showBars` adds a 4-bar strength meter
- `showLabel` adds descriptive text

---

#### CategoryLabel (`components/common/CategoryLabel.tsx`)
Uppercase monospace label for entity categories.

```tsx
<CategoryLabel category="FACTOR" />
<CategoryLabel category="SCHEMA" />
```

**Rules:**
- Always uppercase, mono, 10px
- Used in: Experiments, Overview, Lineage

---

#### FacetTag (`components/common/FacetTag.tsx`)
`field:value` chip with optional remove button.

```tsx
<FacetTag field="process" value="rolling" />
<FacetTag field="facet" value="temperature" removable onRemove={handleRemove} />
```

**Rules:**
- Use for active facet filters
- `removable` adds × button with `aria-label`

---

#### FilterChip (`components/common/FilterChip.tsx`)
Toggle button for selected filters.

```tsx
<FilterChip selected={isSelected} onToggle={toggle} label="origin" count={5} />
```

**Rules:**
- Use `role="checkbox"` + `aria-checked`
- Min touch target: 44px (`min-h-11`)
- Selected state: `bg-brand-muted text-brand`

---

#### SegmentedControl (`components/common/SegmentedControl.tsx`)
Equal-width tab-like control for view/mode switching.

```tsx
<SegmentedControl
  segments={[
    { id: 'graph', label: 'Graph', icon: <Crosshair /> },
    { id: 'list', label: 'List', icon: <List /> },
  ]}
  value={mode}
  onChange={setMode}
/>
```

**Rules:**
- Each segment `flex-1` for equal width
- Parent `min-h-11` (44px)
- Active segment: `bg-background text-foreground shadow-sm`
- ARIA: `role=tablist` / `role=tab` / `aria-selected`

---

## Semantic Tokens

### Colors

| Token | Dark | Light | Use |
|-------|------|-------|-----|
| `--brand-primary` | `#ff3e01` | `#d43600` | Brand accent, primary actions |
| `--brand-primary-muted` | `rgba(255,62,1,0.1)` | `rgba(212,54,0,0.08)` | Ghost button bg, subtle brand |
| `--confidence-high` | `#ff3e01` | `#d43600` | High confidence indicator |
| `--confidence-medium-high` | `#f3c969` | `#b45309` | Medium-high confidence |
| `--confidence-medium` | `#c9a227` | `#92710c` | Medium confidence |
| `--confidence-low` | `#6f7a76` | `#8a9590` | Low confidence |

### Touch Targets

| Token | Value | Use |
|-------|-------|-----|
| `--tap-sm` | 36px | Compact UI, inline actions |
| `--tap-md` | 40px | Default, toolbars |
| `--tap-lg` | 48px | Primary CTAs, mobile |

### Spacing

| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-6` | 24px |
| `--space-8` | 32px |

---

## Component Mapping by Route

| Route | StatusBadge | PriorityBadge | ConfidenceIndicator | SegmentedControl | Button |
|-------|-------------|---------------|---------------------|------------------|--------|
| Findings | ✓ status/category | ✓ priority | ✓ confidence | — | — |
| Overview | ✓ status | ✓ priority (Open Q card) | — | — | ✓ actions |
| Knowledge Graph | ✓ node types | — | — | ✓ mode/depth/view | ✓ toolbar |
| Faceted Search | ✓ result status | — | — | ✓ search mode | ✓ filter btn |
| Experiments | ✓ report status | — | — | — | ✓ copy/share |
| Lineage | ✓ entity types | — | — | — | ✓ navigation |
| Chat | — | — | — | — | ✓ send/stop |

---

## Accessibility

- All interactive elements include `focus-visible:ring-2`
- All icon buttons require `aria-label`
- SegmentedControl uses `role=tablist` / `role=tab` / `aria-selected`
- FilterChip uses `role=checkbox` / `aria-checked`
- ConfidenceIndicator includes `aria-label` for screen readers
- All tap targets ≥ 36px (sm) or 40px (md)

---

## Do / Don't

### Do
- Use `ghost` variant for brand actions (Ask Claude, nav items)
- Use `secondary` variant for default actions
- Use PriorityBadge for priority, ConfidenceIndicator for confidence
- Use SegmentedControl for view/mode switching
- Use FacetTag for active facet filters
- Include `aria-label` on all icon-only buttons

### Don't
- Use green for confidence indicators
- Use StatusBadge for priority or confidence
- Use filled buttons for brand actions (use ghost)
- Mix button heights in the same toolbar
- Use SegmentedControl for navigation (use Tabs)
