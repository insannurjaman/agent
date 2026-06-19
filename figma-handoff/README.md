# Quick Agent System — Figma Handoff

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Figma plugin manifest |
| `code.js` | Plugin backend — builds components, variables, screens |
| `ui.html` | Plugin UI — build controls |
| `DESIGN-SPEC.md` | Complete design specification document |
| `README.md` | This file |

## How to Use

### Option 1: Figma Plugin (Recommended)

1. Open Figma Desktop
2. Go to **Plugins → Development → Import plugin from manifest**
3. Select `figma-handoff/manifest.json`
4. Open your QAS file (`we1zwuSvhlb6Ztt4R8Maqy`)
5. Run the plugin: **Plugins → Development → QAS Handoff Builder**
6. Click **Build Everything**

The plugin will create:
- 7 variable collections with all tokens
- 10+ component sets with variants
- Route screens at 3 breakpoints
- Foundations color palette

### Option 2: Manual Reference

Use `DESIGN-SPEC.md` as a reference to manually create components in Figma with exact values.

## What Gets Built

### Variable Collections
- **Primitives**: Oxide neutrals, orange brand, green, amber, red, blue, purple
- **Color**: Semantic dark mode tokens
- **Spacing**: Tailwind-compatible numeric scale
- **Radius**: none, sm, md, lg, xl, full
- **Sizing**: Icons, controls, navigation, inspector
- **Typography**: Inter + JetBrains Mono families
- **Opacity**: disabled, muted, overlay, decorative

### Component Library
- Button (4 tones × 3 sizes)
- StatusBadge (7 tones)
- Input (4 states)
- InspectorFrame
- TopBar
- NavRail
- BottomNav
- ScreenHeader
- Card
- EmptyState

### Route Screens (3 breakpoints each)
- Findings
- Experiments
- Search
- Graph
- Lineage
- Chat
- Status
- Overview

## Design Tokens

All values match the running prototype at `src/styles/theme.css`.

### Primary Colors
- Brand: `#ff3e01`
- Success: `#39c289`
- Warning: `#f3c969`
- Error: `#ff6b6b`
- Info: `#6ba6ff`
- Lineage: `#8b7cf6`

### Dark Mode
- Background: `#080a0b`
- Foreground: `#f2f5f3`
- Surface: `#0d1012`
- Border: `#252b30`
