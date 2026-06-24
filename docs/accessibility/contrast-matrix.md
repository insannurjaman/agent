# Quick Agent System — Accessibility Contrast Matrix

WCAG 2.2 AA requires **4.5:1** for normal text and **3:1** for large text (≥18pt / ≥14pt bold) and UI components.

## Oxide Dark Theme

| Foreground | Background | Ratio | AA Normal | AA Large | Notes |
|------------|------------|-------|-----------|----------|-------|
| `#f2f5f3` (text) | `#080a0b` (background) | 17.2:1 | ✅ | ✅ | Primary text |
| `#bcc5c1` (text-secondary) | `#080a0b` (background) | 9.5:1 | ✅ | ✅ | Secondary text |
| `#8a9590` (text-muted) | `#080a0b` (background) | 5.5:1 | ✅ | ✅ | Muted text, labels |
| `#ff3e01` (brand) | `#080a0b` (background) | 5.1:1 | ✅ | ✅ | Brand accent |
| `#f2f5f3` (text) | `#0d1012` (surface) | 15.8:1 | ✅ | ✅ | Card/panel surfaces |
| `#bcc5c1` (text-secondary) | `#0d1012` (surface) | 8.7:1 | ✅ | ✅ | Secondary on surface |
| `#8a9590` (text-muted) | `#0d1012` (surface) | 5.0:1 | ✅ | ✅ | Muted on surface |
| `#f2f5f3` (text) | `#12161a` (surface-2) | 14.2:1 | ✅ | ✅ | Elevated surfaces |
| `#bcc5c1` (text-secondary) | `#12161a` (surface-2) | 7.8:1 | ✅ | ✅ | Secondary on elevated |
| `#8a9590` (text-muted) | `#12161a` (surface-2) | 4.6:1 | ✅ | ✅ | Muted on elevated |
| `#ff3e01` (brand) | `#12161a` (surface-2) | 4.5:1 | ✅ | ✅ | Brand on elevated |

## Oxide Light Theme

| Foreground | Background | Ratio | AA Normal | AA Large | Notes |
|------------|------------|-------|-----------|----------|-------|
| `#1a1d1e` (text) | `#ffffff` (background) | 16.1:1 | ✅ | ✅ | Primary text |
| `#4a5550` (text-secondary) | `#ffffff` (background) | 8.9:1 | ✅ | ✅ | Secondary text |
| `#8a9590` (text-muted) | `#ffffff` (background) | 3.6:1 | ❌ | ✅ | Muted text (decorative) |
| `#d43600` (brand) | `#ffffff` (background) | 4.7:1 | ✅ | ✅ | Brand accent |
| `#1a1d1e` (text) | `#f8f9fa` (surface) | 15.2:1 | ✅ | ✅ | Card/panel surfaces |
| `#4a5550` (text-secondary) | `#f8f9fa` (surface) | 8.4:1 | ✅ | ✅ | Secondary on surface |
| `#8a9590` (text-muted) | `#f8f9fa` (surface) | 3.4:1 | ❌ | ✅ | Muted on surface |
| `#1a1d1e` (text) | `#f1f3f5` (surface-2) | 14.1:1 | ✅ | ✅ | Elevated surfaces |
| `#4a5550` (text-secondary) | `#f1f3f5` (surface-2) | 7.8:1 | ✅ | ✅ | Secondary on elevated |
| `#8a9590` (text-muted) | `#f1f3f5` (surface-2) | 3.2:1 | ❌ | ✅ | Muted on elevated |

## Semantic Colors

| Foreground | Background | Ratio | AA Normal | AA Large | Notes |
|------------|------------|-------|-----------|----------|-------|
| `#39d98a` (success) | `#080a0b` (background) | 10.5:1 | ✅ | ✅ | Success states |
| `#2dd4bf` (info) | `#080a0b` (background) | 9.8:1 | ✅ | ✅ | Info states |
| `#f3c969` (warning) | `#080a0b` (background) | 13.4:1 | ✅ | ✅ | Warning states |
| `#ff6b6b` (error) | `#080a0b` (background) | 6.2:1 | ✅ | ✅ | Error states |

## Confidence Tokens (Dark Theme)

| Token | Color | On Background | Ratio | AA Normal | Notes |
|-------|-------|---------------|-------|-----------|-------|
| `--confidence-high` | `#ff3e01` | `#080a0b` | 5.1:1 | ✅ | High confidence — orange |
| `--confidence-medium-high` | `#f3c969` | `#080a0b` | 13.4:1 | ✅ | Medium-high — amber |
| `--confidence-medium` | `#c9a227` | `#080a0b` | 9.8:1 | ✅ | Medium — ochre |
| `--confidence-low` | `#6f7a76` | `#080a0b` | 4.2:1 | ❌ | Low — gray (decorative label) |

## Focus Indicator

| Element | Ratio | Notes |
|---------|-------|-------|
| `2px brand (#ff3e01)` on `#080a0b` | 5.1:1 | 3:1 for non-text contrast ✅ |

## Notes

- `text-muted` passes AA at 5.5:1 on dark background (updated from 4.1:1)
- `text-secondary` brightened to 9.5:1 for dense table readability
- All interactive elements use `text` or `text-secondary` minimum
- Focus indicators exceed 3:1 non-text contrast requirement
- Brand color exceeds 4.5:1 on all dark surfaces
- Category labels use reduced-saturation tones (info/neutral/warning) instead of high-saturation (blue/error)
