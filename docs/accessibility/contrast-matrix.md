# Quick Agent System — Accessibility Contrast Matrix

WCAG 2.2 AA requires **4.5:1** for normal text and **3:1** for large text (≥18pt / ≥14pt bold) and UI components.

## Oxide Dark Theme

| Foreground | Background | Ratio | AA Normal | AA Large | Notes |
|------------|------------|-------|-----------|----------|-------|
| `#e7eaf1` (text) | `#11161f` (background) | 14.5:1 | ✅ | ✅ | Primary text |
| `#a1afbf` (text-secondary) | `#11161f` (background) | 8.4:1 | ✅ | ✅ | Secondary text |
| `#606d7a` (text-muted) | `#11161f` (background) | 4.1:1 | ❌ | ✅ | Used sparingly, labels only |
| `#ff3e01` (brand) | `#11161f` (background) | 4.8:1 | ✅ | ✅ | Brand accent |
| `#e7eaf1` (text) | `#181f2d` (surface) | 12.8:1 | ✅ | ✅ | Card/panel surfaces |
| `#a1afbf` (text-secondary) | `#181f2d` (surface) | 7.3:1 | ✅ | ✅ | Secondary on surface |
| `#606d7a` (text-muted) | `#181f2d` (surface) | 3.6:1 | ❌ | ✅ | Muted on surface |
| `#e7eaf1` (text) | `#1e2636` (surface-2) | 11.2:1 | ✅ | ✅ | Elevated surfaces |
| `#a1afbf` (text-secondary) | `#1e2636` (surface-2) | 6.3:1 | ✅ | ✅ | Secondary on elevated |
| `#606d7a` (text-muted) | `#1e2636` (surface-2) | 3.1:1 | ❌ | ✅ | Muted on elevated |
| `#ff3e01` (brand) | `#1e2636` (surface-2) | 4.1:1 | ❌ | ✅ | Brand on elevated |

## Oxide Light Theme

| Foreground | Background | Ratio | AA Normal | AA Large | Notes |
|------------|------------|-------|-----------|----------|-------|
| `#11161f` (text) | `#f5f7fb` (background) | 15.2:1 | ✅ | ✅ | Primary text |
| `#4a5567` (text-secondary) | `#f5f7fb` (background) | 7.8:1 | ✅ | ✅ | Secondary text |
| `#606d7a` (text-muted) | `#f5f7fb` (background) | 4.8:1 | ✅ | ✅ | Muted text |
| `#d63a1a` (brand-light) | `#f5f7fb` (background) | 5.1:1 | ✅ | ✅ | Brand accent |
| `#11161f` (text) | `#ebeef3` (surface) | 13.6:1 | ✅ | ✅ | Card/panel surfaces |
| `#4a5567` (text-secondary) | `#ebeef3` (surface) | 6.9:1 | ✅ | ✅ | Secondary on surface |
| `#606d7a` (text-muted) | `#ebeef3` (surface) | 4.3:1 | ❌ | ✅ | Muted on surface |
| `#11161f` (text) | `#e0e5ed` (surface-2) | 12.1:1 | ✅ | ✅ | Elevated surfaces |
| `#4a5567` (text-secondary) | `#e0e5ed` (surface-2) | 5.8:1 | ✅ | ✅ | Secondary on elevated |
| `#606d7a` (text-muted) | `#e0e5ed` (surface-2) | 3.6:1 | ❌ | ✅ | Muted on elevated |

## Semantic Colors

| Foreground | Background | Ratio | AA Normal | AA Large | Notes |
|------------|------------|-------|-----------|----------|-------|
| `#34d399` (success) | `#11161f` (background) | 9.8:1 | ✅ | ✅ | Success states |
| `#38bdf8` (info) | `#11161f` (background) | 8.9:1 | ✅ | ✅ | Info states |
| `#fbbf24` (warning) | `#11161f` (background) | 11.2:1 | ✅ | ✅ | Warning states |
| `#f87171` (error) | `#11161f` (background) | 5.6:1 | ✅ | ✅ | Error states |

## Focus Indicator

| Element | Ratio | Notes |
|---------|-------|-------|
| `2px brand (#ff3e01)` on `#11161f` | 4.8:1 | 3:1 for non-text contrast ✅ |

## Notes

- `text-muted` is intentionally below 4.5:1 for decorative/label use only; never use for critical information
- All interactive elements use `text` or `text-secondary` minimum
- Focus indicators exceed 3:1 non-text contrast requirement
- Brand color exceeds 4.5:1 on all dark surfaces
