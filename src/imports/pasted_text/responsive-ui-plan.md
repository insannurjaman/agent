Now generate the responsive UI based on the approved responsive plan.

Do not redesign the product from scratch. Keep the existing Quick Agent System visual direction, information architecture, and Oxide-inspired technical console style.

Create high-fidelity responsive frames for desktop, tablet, and mobile.

Create these viewport sizes:

* Desktop: 1440px width
* Tablet: 834px width
* Mobile: 390px width

For each major screen, create responsive variants:

1. Overview / System Map
2. Findings & Open Questions
3. Experiments & Reports
4. Faceted Search
5. Knowledge Graph
6. Lineage Trace
7. Chat Workspace
8. System Status

General visual requirements:

* Dark industrial Oxide-inspired console
* Precise thin borders
* Compact but readable layout
* Monospace for IDs, paths, filenames, timestamps, logs
* Low-noise color system
* Green for success/connected
* Amber for warnings/proposals
* Red for errors
* Teal for links/system references
* Purple only for Claude-specific primary action
* No decorative gradients
* No playful illustration
* No generic dashboard cards
* No AI slop

Global responsive app shell:
Desktop:

* Persistent top bar
* Persistent left icon rail
* Full global search
* Full backend status pill

Tablet:

* Persistent top bar
* Left rail can stay icon-only
* Search becomes shorter
* Backend status compact

Mobile:

* Top bar with logo, compact product name, search icon, backend dot, settings
* Navigation becomes bottom nav or drawer
* Use mobile-friendly touch targets
* No squeezed desktop panels

Desktop layout behavior:
Use the full multi-pane layouts:

* Chat: Sessions/Files + Chat + Artifact
* Reports: Experiment list + Report viewer + TOC
* Findings: Table + Inspector
* Graph: Canvas + Inspector
* Search: Facets + Results + Inspector

Tablet layout behavior:
Use two-pane or collapsible-drawer layouts:

* Side panels become drawers where needed
* Inspectors can become right drawer
* Keep primary content readable
* Avoid cramped three-column layouts

Mobile layout behavior:
Use single-pane task-focused flows:

* Tables become cards
* Inspectors become full-screen detail or bottom sheet
* Side panels become drawers
* Graph defaults to Neighborhood View or Relationship List
* Chat uses segmented tabs:
  Chat
  Context
  Artifact
* Composer is sticky at bottom
* Keep only the most important actions visible

Screen-specific requirements:

1. Overview / System Map
   Desktop:

* Keep Knowledge Loop, Documentation Layers, Current Work, Repository Snapshot, Active Context, Quick Actions, Module Status, Recent Activity

Tablet:

* Two-column layout
* Right panels stack underneath when needed

Mobile:

* Single-column
* Knowledge Loop becomes vertical stepper
* Current Work at top
* Quick Actions full-width buttons
* Recent Activity as compact feed

2. Findings & Open Questions
   Desktop:

* Dense table + right inspector

Tablet:

* Table with fewer columns
* Inspector drawer

Mobile:

* Card list
* Filter bottom sheet
* Detail full-screen page
* Each card shows:
  ID
  title
  type
  confidence/status
  category/priority
  evidence/related
* Sticky bottom action in detail:
  Ask Claude

3. Experiments & Reports
   Desktop:

* Left experiment list + report viewer + right TOC

Tablet:

* Experiment list + report viewer
* TOC collapsible

Mobile:

* Experiment list screen
* Report detail screen after selection
* TOC as section dropdown
* Sticky actions:
  Ask Claude
  View Graph
  Copy Path

4. Faceted Search
   Desktop:

* Left facets + results + inspector

Tablet:

* Facets collapsible
* Inspector drawer

Mobile:

* Search input top
* Selected facet chips
* Filter bottom sheet
* Results as cards
* Detail as full-screen view

5. Knowledge Graph
   Desktop:

* Canvas + inspector
* Default Neighborhood View

Tablet:

* Canvas + collapsible inspector

Mobile:

* Default Relationship List
* Optional Visual Graph
* Inspector bottom sheet
* Global View marked advanced
* No dense graph as default

6. Lineage Trace
   Desktop:

* Horizontal/branch lineage + inspector

Tablet:

* Timeline + drawer

Mobile:

* Vertical timeline
* Superseded warning prominent
* Latest valid finding clearly highlighted
* Sticky actions:
  Go to Latest
  Ask Claude
  View Evidence

7. Chat Workspace
   Desktop:

* Three-pane layout:
  Sessions/Files
  Claude chat
  Artifact viewer

Tablet:

* Chat + Artifact
* Sessions/Files as drawer
* Focus Mode default

Mobile:

* Segmented tabs:
  Chat
  Context
  Artifact
* Chat is default
* Context tab includes sessions, files, attached context
* Artifact tab includes preview, metadata, timeline
* Composer sticky bottom
* Mode selector as dropdown
* Suggested prompts max 2 visible + More actions
* Proposal review full-screen modal
* Trace Mode hidden behind toggle

8. System Status
   Desktop:

* Health strip
* Local services table
* Repository indexing
* Claude Relay
* Watcher
* Diagnostics

Tablet:

* Services table top
* Panels stack below

Mobile:

* Health summary
* Services as cards
* Repository files as stacked rows
* Diagnostics collapsible
* Degraded state with Retry Connection as primary action

Responsive component requirements:
Create or update components for:

* Responsive top bar
* Desktop left rail
* Mobile bottom navigation / drawer
* Responsive table
* Mobile card row
* Inspector drawer
* Bottom sheet
* Chat composer
* Context chips
* Artifact viewer
* Status badges
* Toasts
* Loading states
* Empty states
* Error states
* Degraded backend state

Important mobile UX rules:

* No horizontal layout squeezing
* No tiny text under 12px
* Minimum tap target 44px
* Keep actions obvious
* Reduce visible metadata
* Use progressive disclosure
* Hide advanced/debug/prototype controls
* Use drawers and bottom sheets for secondary information
* Use clear back navigation between list/detail

Output:
Generate polished high-fidelity responsive frames for desktop, tablet, and mobile.
Maintain consistency with the existing design system.
Make the UI feel production-ready, compact, clean, and easy to use across all device sizes.
