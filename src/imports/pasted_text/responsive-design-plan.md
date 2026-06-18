Create a responsive design implementation plan for the existing Quick Agent System prototype.

Do not generate UI yet. First, create a clear responsive feature plan that explains how the existing desktop-first product should adapt to desktop, tablet, and mobile.

Product context:
Quick Agent System is an Oxide-inspired local AI operations console for browsing findings, open questions, experiments, reports, faceted search, knowledge graph, lineage, system status, and Claude-like chat workspace. The product is technical, read-only, local-first, and uses Claude-mediated updates. The visual direction must remain dark, industrial, compact, precise, and console-like.

Current product structure:

1. Overview / System Map
2. Findings & Open Questions
3. Experiments & Reports
4. Faceted Search
5. Knowledge Graph
6. Lineage Trace
7. Chat Workspace
8. System Status
9. Design System / Components

Responsive targets:

* Desktop large: 1440px and above
* Desktop standard: 1280px
* Tablet landscape: 1024px
* Tablet portrait: 834px
* Mobile large: 430px
* Mobile standard: 390px
* Mobile small: 360px

Core principle:
Do not simply shrink the desktop UI. Redesign the layout behavior for each device while preserving the same product logic and visual identity.

Design quality target:
The responsive design should feel like a world-class technical console, not a squeezed desktop dashboard. It must remain easy to scan, usable, and calm on every device.

Visual style must remain:

* Oxide-inspired dark technical console
* Thin borders
* Compact spacing
* Monospace IDs, paths, filenames, timestamps, and logs
* Low-noise color system
* Green for connected/success
* Amber for warning/proposal
* Red for error
* Purple only for Claude-specific primary actions
* No decorative gradients
* No playful illustrations
* No generic AI dashboard style
* No AI slop

Create a responsive plan covering:

1. Global responsive navigation
   Explain how the left rail, top bar, global search, backend status, and settings should adapt.

Desktop:

* Persistent left icon rail
* Top bar with full product name, global search, backend status, settings

Tablet:

* Left rail can stay collapsed icon-only
* Global search may become shorter
* Backend status can become compact pill

Mobile:

* Replace left rail with bottom navigation or top menu drawer
* Product name remains visible
* Global search becomes an icon or compact command button
* Backend status becomes small dot/pill
* Settings stays in top right
* Use safe touch targets minimum 44px

2. Overview / System Map responsive behavior
   Desktop:

* Multi-column layout with Knowledge Loop, Documentation Layers, Repository Snapshot, Active Context, Quick Actions, Module Status, Recent Activity

Tablet:

* Two-column layout
* Right panels stack below or become side cards

Mobile:

* Single-column vertical layout
* Knowledge Loop becomes a vertical stepper
* Documentation Layers become stacked cards
* Repository Snapshot becomes compact metric list
* Quick Actions become full-width buttons
* Recent Activity becomes compact feed

3. Findings & Open Questions responsive behavior
   Desktop:

* Data table + right inspector

Tablet:

* Table remains but fewer visible columns
* Inspector becomes collapsible side drawer or bottom drawer

Mobile:

* Replace dense table with card list
* Each card shows ID, title, status/confidence, priority/category, and key metadata
* Filters open in bottom sheet
* Detail opens as full-screen detail page or bottom sheet
* Keep primary actions:
  Ask Claude
  View Evidence
  View Graph
  View Lineage

4. Experiments & Reports responsive behavior
   Desktop:

* Left experiment list + center report viewer + right TOC/metadata

Tablet:

* Experiment list remains left
* Report viewer main
* TOC becomes collapsible

Mobile:

* Experiment list becomes first screen
* Selecting experiment opens report detail screen
* TOC becomes sticky section selector or bottom sheet
* Related findings/questions appear as collapsible sections
* Report actions stay sticky:
  Ask Claude
  View Graph
  Copy Path

5. Faceted Search responsive behavior
   Desktop:

* Left facet panel + result list + right inspector

Tablet:

* Facets can become collapsible panel
* Inspector becomes drawer

Mobile:

* Facets open as filter bottom sheet
* Results become stacked cards
* Inspector opens full-screen detail
* Selected facets appear as horizontal chips at top

6. Knowledge Graph responsive behavior
   Desktop:

* Full canvas with right inspector

Tablet:

* Graph canvas remains primary
* Inspector becomes collapsible drawer
* Default to Neighborhood View

Mobile:

* Do not show dense global graph by default
* Default to Neighborhood View only
* Use simplified node chain / relationship list
* Graph inspector becomes bottom sheet
* Provide toggle:
  Visual Graph
  Relationship List
* Global View should be marked advanced

7. Lineage Trace responsive behavior
   Desktop:

* Timeline/chain + right inspector

Tablet:

* Timeline remains, inspector collapses

Mobile:

* Use vertical lineage timeline
* Superseded and latest finding cards stacked
* Warning remains visible
* Actions sticky at bottom:
  Go to Latest
  Ask Claude
  View Evidence

8. Chat Workspace responsive behavior
   Desktop:

* Three-pane layout:
  Left sessions/files
  Center Claude chat
  Right artifact viewer

Tablet:

* Two-pane layout:
  Center chat + right artifact viewer
  Left sessions/files becomes collapsible drawer
* Or use tabs:
  Chat
  Files
  Artifact

Mobile:

* Single-pane layout with segmented navigation:
  Chat
  Context
  Artifact
* Chat is default
* Context tab shows attached context, sessions, and files
* Artifact tab shows preview, metadata, timeline
* Composer is sticky at bottom
* Suggested prompts limited to 2–3
* Mode selector becomes dropdown
* Proposal review opens full-screen modal
* Trace mode should be secondary and collapsed by default

9. System Status responsive behavior
   Desktop:

* Services table + right panels + diagnostics

Tablet:

* Services table remains
* Right panels stack below
* Diagnostics full width

Mobile:

* Health summary at top
* Services become status cards
* Repository indexing becomes stacked file rows
* Diagnostics becomes collapsible log viewer
* Degraded state has clear primary action:
  Retry connection

10. Design System responsive requirements
    Plan responsive components:

* App shell
* Top bar
* Left rail
* Bottom nav
* Drawer
* Bottom sheet
* Responsive data table
* Mobile card list
* Inspector drawer
* Modal
* Chat composer
* Artifact viewer
* Graph node
* Lineage card
* Status badge
* Toast
* Empty state
* Loading state
* Error state

11. Interaction rules
    Include:

* Minimum tap target 44px on tablet/mobile
* Avoid horizontal scrolling on mobile except code/log blocks
* Long file paths should wrap or truncate with copy action
* Tables become cards on mobile
* Inspectors become drawers or full-screen pages
* Advanced technical details are progressively disclosed
* Focus Mode should be default for Chat
* Trace Mode should be hidden behind toggle

12. Output expected
    Provide a clear responsive implementation plan with:

* Breakpoints
* Layout behavior per screen
* Navigation behavior
* Component behavior
* Priority screens to generate first
* Risks and constraints
* Recommended responsive frames to create

Do not generate final UI yet. Create the plan first.
