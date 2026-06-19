# Visual Baseline

This document records the pre-iteration rendering contract for Quick Agent System. Baseline screenshots live beside this file in `docs/baseline/`.

## Reference viewports

- Desktop: `1280 × 720`
- Mobile: `390 × 844`

The Findings screen is the first workflow baseline because it exercises the shell, filters, tabs, semantic badges, dense tables, mobile cards, deep links, and inspectors.

## Baseline assets

- `baseline/findings-desktop.jpg`
- `baseline/findings-mobile.jpg`
- `baseline/design-system-desktop.jpg`
- `baseline/experiments-desktop.jpg`
- `baseline/experiments-mobile.jpg`
- `baseline/experiments-tablet-details.jpg`

Regenerate screenshots only after a deliberate design change and review the diff before replacing the baseline.

## Visual contract

- Dark Oxide-inspired surfaces with no colorful SaaS gradients.
- Crisp one-pixel borders and minimal corner radius.
- Dense but readable information hierarchy.
- Inter for interface text and JetBrains Mono for technical metadata.
- Orange `#ff3e01` is the primary brand color for active navigation, selected states, focus, finding identity, and primary agent actions.
- Green is reserved for success, completed, healthy, connected, resolved, and passed states.
- Cyan/blue is informational, amber is warning/question emphasis, red is error/degraded, and purple is hypothesis/lineage.
- Orange remains precise: thin borders, small markers, focused controls, and low-opacity selected surfaces rather than large saturated panels.
- Desktop keeps technical density and multi-pane context.
- Mobile uses cards, drawers, and full-screen inspectors without page-level horizontal overflow.

## Route regression matrix

| Route | Desktop expectation | Mobile expectation |
| --- | --- | --- |
| Overview | Workflow and documentation panels | Single-column, guidance surfaced early |
| Findings | Dense table and side inspector | Cards and full-screen inspector |
| Experiments | List, report, optional outline | List-first, then report |
| Search | Facet rail, results, inspector | Results-first and full-screen inspector |
| Graph | Controls, canvas, node inspector | Canvas contained; inspector overlays |
| Lineage | Chain rail, timeline, inspector | Timeline and full-screen inspector |
| Chat | Multi-pane workspace | Segmented views and drawers |
| Status | Dense service/status layout | Contained tables and stacked panels |
| Design System | Component specimens | Single-column specimens |

## Verification

For every route and viewport:

- route renders its expected heading
- no browser console errors or warnings
- document width does not exceed viewport width
- navigation remains reachable
- overlays can be closed
- no route or data contract changes occur accidentally
