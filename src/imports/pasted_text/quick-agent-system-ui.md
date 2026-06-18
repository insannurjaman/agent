Create a complete high-fidelity desktop web application UI for “Quick Agent System”.

This is not a generic AI dashboard. This is not a SaaS admin template. This is not a playful AI assistant app.

Quick Agent System is a local, read-only, analytical knowledge operations console for browsing and understanding knowledge accumulated by an agent system. It connects to a thin backend that reads files from an existing repository and returns JSON. The frontend must help users browse findings, open questions, experiments, reports, graph relationships, facets, lineage, and eventually Claude Code chat sessions.

Use the uploaded project brief as the source of truth.

Core product definition:
Quick Agent System is a loop-based analytical knowledge system. Agents and skills operate over:

* knowledge/ as the machine-readable fact database
* experiments/ as the experiment log and report repository
* doc/ as curated documentation
* CLAUDE.md as manually promoted critical knowledge

The frontend is primarily read-only. Do not design direct CSV editing. Registration and updates of knowledge/issues happen through Claude chat, not direct table editing.

Important project logic:

* MVP-1 should prioritize Findings / Open Questions Table Viewer and Experiment List + REPORT Viewer.
* MVP-2 should add Faceted Search and Knowledge Graph Viewer.
* MVP-3 should add Chat + Artifact + Experiment Explorer because Claude Code stream integration is the heaviest implementation.
* Chat is important, but do not make the entire product look like a generic chatbot.
* The primary practical graph view is a neighborhood focus view, not only a huge decorative global graph.

Visual direction:
Make the app look and feel extremely close to Oxide Computer’s website and console-style design language:

* Infrastructure-grade
* Industrial
* Technical
* Dark
* Console-like
* Precise
* Low-noise
* Grid-based
* High trust
* Operator-focused
* Serious enterprise tooling
* Sharp data hierarchy
* No generic SaaS feeling
* No “AI slop”
* No decorative AI gradients
* No fake glowing neon dashboard
* No playful cards or illustrations

Use Oxide-style design principles:

* Dark industrial surfaces
* Thin exact borders
* Dense but readable tables
* Console-like navigation
* ASCII/grid/dot-matrix texture only where useful
* Monospace for IDs, filenames, paths, logs, timestamps, and graph labels
* Small uppercase metadata labels
* Utility-first UI
* Minimal radius
* Subtle state color
* Clear resource hierarchy
* Calm confident typography
* Precise spacing and alignment

Do not copy Oxide logos, proprietary assets, or brand names. Use the visual language and product-console feeling only.

Design tokens:

* Background: #080A0B
* Main surface: #0D1012
* Secondary surface: #12161A
* Elevated surface: #171C20
* Border subtle: #252B30
* Border strong: #343C43
* Text primary: #F2F5F3
* Text secondary: #A9B2AF
* Text muted: #6F7A76
* System green: #39D98A
* Teal accent: #2DD4BF
* Amber warning: #F3C969
* Red danger: #FF6B6B
* Info blue: #6BA6FF
* Purple accent: #8B7CF6, use very sparingly only for AI-specific interaction or major “Open in Workspace” style navigation action

Typography:

* Use a clean sans-serif like Inter, Geist, or similar.
* Use JetBrains Mono, Geist Mono, or IBM Plex Mono for technical values.
* Use mono for:

  * F-IDs
  * Q-IDs
  * experiment slugs
  * file paths
  * filenames
  * command snippets
  * logs
  * timestamps
  * hash values
  * graph node labels
* Use uppercase micro-labels for metadata:
  STATUS, SOURCE, PATH, CONFIDENCE, FACETS, EVIDENCE, SUPERSEDES, ACTIONABLE, LAST INDEXED

Global app shell:
Create a persistent shell at 1440px desktop width.
Top bar:

* Left: small abstract system logo, “Quick Agent System”, version “v0.1.0”
* Center: command/search input with “Search findings, open questions, experiments, reports…”
* Right: backend status pill and settings
* Backend status:
  “Backend connected · indexed 2m ago”
  with green dot
* Product name must never be cropped.

Left rail navigation:
Use a compact Oxide-like icon rail with tooltips:

* Overview
* Findings & Questions
* Experiments & Reports
* Faceted Search
* Knowledge Graph
* Lineage
* Chat Workspace
* System Status

Active nav:

* Use subtle left accent line
* No large purple block
* No glowing active state

Primary screens to create:

1. Overview / System Map
2. Findings & Open Questions
3. Experiment List + REPORT Viewer
4. Faceted Search
5. Knowledge Graph
6. Lineage / Supersedes Trace
7. Chat + Artifact + Experiment Explorer
8. System Status
9. Design System / Components

============================================================
SCREEN 1 — OVERVIEW / SYSTEM MAP
================================

Purpose:
Help users understand the system loop and documentation layers.

Layout:

* Left rail navigation
* Main content with technical system overview
* Right side: compact repository status panel

Content:
Title:
“Quick Agent System”

Subtitle:
“Read-only analytical knowledge console for findings, open questions, experiments, reports, and graph relationships.”

Show the core loop as a precise horizontal or vertical technical flow:

1. Question
2. Review Existing Knowledge
3. Create Experiment Directory
4. Write Code + Execute
5. Validation
6. Convert into Knowledge
   6'. Convert into Remaining Issues
   6.5 Shared Report
7. Promotion — User Confirmation Required

Use small rectangular nodes, thin connector lines, and subtle status markers. No playful illustrations.

Show documentation layers:
L0 — CLAUDE.md
Critical promoted knowledge, manually updated

L1 — doc/*.md
Curated workflows, glossary, deep table-specific knowledge

L2 — knowledge/*.csv + recipes/
Machine-readable fact database

L3 — experiments/<slug>/
Experiment logs, README, REPORT, code, figures

Show repository status:
knowledge/findings.csv — 79 rows
knowledge/open_questions.csv — 47 rows
knowledge/knowledge_graph_edges.csv — 499 edges
experiments/ — 18 experiments + _template
PNG figures — 106
HTML artifacts — 2

Style:
Make this feel like a system console summary, not a dashboard with marketing cards.

============================================================
SCREEN 2 — FINDINGS & OPEN QUESTIONS TABLE VIEWER
=================================================

This is MVP-1 and one of the most important screens.

Purpose:
List, filter, inspect, and cross-link accumulated knowledge findings and unresolved issues.

Data sources:
Findings:
knowledge/findings.csv
Columns:
id, date, category, tags, title, summary, evidence, confidence, supersedes, actionable, facets

Open Questions:
knowledge/open_questions.csv
Columns:
id, raised_date, priority, status, area, title, detail, raised_by, related, facets

Tag labels:
knowledge/tag_taxonomy.csv
40 controlled vocabulary terms

Layout:

* Header: “Findings & Open Questions”
* Subtitle: “Browse accumulated findings and unresolved issues from knowledge/*.csv.”
* Top toolbar:
  Search
  Type tabs: All, Findings, Open Questions
  Filter by Category / Status / Confidence / Priority / Area / Facets / Actionable
  Sort by Date / Confidence / Priority
* Main table
* Right inspector panel

Table behavior:

* Dense but readable
* Sticky header
* Wide title column
* No excessive truncation
* Mono IDs
* Source/evidence links
* Expandable rows for long summary/detail
* Row hover state
* Selected row state
* Row action menu

Findings columns:
ID
TITLE
CATEGORY
CONFIDENCE
FACETS
ACTIONABLE
EVIDENCE
SUPERSEDES
DATE

Open Questions columns:
ID
TITLE
STATUS
PRIORITY
AREA
FACETS
RAISED BY
RELATED
RAISED DATE

Badge color rules:
Findings category:
factor, schema, data-quality, process, hypothesis, anomaly-pattern, method

Finding confidence:
high, medium, low, medium-high, superseded

For confidence=superseded:

* Display the row as grayed out
* Add “Superseded” badge
* Add “Go to Latest Version” link
* Add “View Lineage” action
  This is critical because old findings remain as historical records.

Open Question status:
open, resolved, in-progress, partial-progress

Open Question priority:
high, medium, low

Right inspector for Finding:

* Finding ID
* Title
* Category
* Confidence
* Tags
* Facets
* Summary
* Evidence experiment path
* Supersedes / superseded by
* Actionable flag
* Related open questions
* Actions:
  View Evidence Report
  View Node in Graph
  View Lineage
  Ask Claude about this finding

Right inspector for Open Question:

* Question ID
* Title
* Status
* Priority
* Area
* Detail
* Raised by
* Related findings/experiments
* Update history timeline if detail contains “| Date:”
* Actions:
  View Related Finding
  View Node in Graph
  Ask Claude to update this question

Read-only rule:
Do not show direct Edit, Delete, Save, or Resolve buttons.
Instead use:
“Ask Claude to update”
“Ask Claude to resolve”
“Ask Claude to log follow-up”

States:

* Loading CSV
* Failed to load knowledge file
* No findings found
* No matching filters
* Selected item hidden by filters
* Superseded finding warning
* Backend offline

============================================================
SCREEN 3 — EXPERIMENT LIST + REPORT VIEWER
==========================================

This is MVP-1 and must feel highly polished.

Purpose:
Browse past experiments and read README/REPORT outputs.

Data sources:

* experiments/*/README.md
* experiments/<slug>/REPORT.md
* experiments/<slug>/outputs/figures/*.png
* related F-IDs from findings.txt and README
* image references inside REPORT should resolve relative paths

Layout:

* Left experiment list panel
* Center report/document viewer
* Right document outline / metadata panel

Experiment list:
Display cards or compact rows in descending date order.

Each experiment item shows:

* Experiment slug
* Title
* Top 3 conclusions extracted from README
* Freshness indicators:
  parquet_mtime
  row_counts
  date_range
* REPORT status:
  REPORT available
  Exploration Only
  Missing REPORT
* Last modified
* Related findings count

Experiment without REPORT:

* Show badge: “Exploration Only”
* Open README instead of REPORT
* Do not show false error state

Report viewer:

* Markdown rendering
* Relative image resolution
* Sticky table of contents
* Cross-link F-ID and Q-ID
* Any F-ID or Q-ID in README/REPORT should link to:
  Findings/Open Questions table
  Knowledge Graph focused node
  Lineage view if relevant

Report structure:
Use document-like technical reader.
Generate TOC based on report structure.
Show four axes:

1. Phenomenon
2. Variables
3. Mechanism
4. Countermeasures

Add metadata:
SOURCE
REPORT PATH
README PATH
FIGURES
RELATED FINDINGS
DATA FRESHNESS
LAST INDEXED

Right panel:

* On this page
* Related findings
* Related open questions
* Figures
* Freshness indicators
* Actions:
  View in Graph
  Open Evidence
  Copy Path
  Ask Claude about this report

States:

* Report loading
* README-only experiment
* Exploration Only
* Report not found
* Image failed to load
* Outdated data warning
* Backend offline

Visual style:
Make the report viewer feel like a serious technical field report, not a blog article.

============================================================
SCREEN 4 — FACETED SEARCH
=========================

This is high priority MVP-2.

Purpose:
Expose search_kg.py topic and facet search as a UI.

Data:
knowledge/search_kg.py
Supported modes:
topic
facet
neighbors
exp

Use 6 controlled vocabulary dimensions and 40 terms from tag_taxonomy.csv.

Layout:

* Header: “Faceted Search”
* Subtitle: “Search across findings, open questions, and experiments using controlled vocabulary.”
* Left facet panel
* Main result area
* Right selected-result inspector

Facet dimensions:
Process
Equipment Variables
Phenomena
Quality Labels
Methods
Data Quality

Represent facets using:

* Checkbox groups
* Compact tag chips
* Search within facet terms
* Selected facet summary
* Clear all

Main search:

* Topic input
* Mode selector:
  Topic
  Facet
  Neighbors
  Experiment
* Search results grouped by:
  Findings
  Open Questions
  Experiments

Result item:

* Type
* ID
* Title
* Matching facets
* Source/evidence
* Confidence/status
* Actions:
  Open detail
  View evidence report
  View node in graph
  Trace lineage

Empty state:
“Select facets or enter a topic to search knowledge.”

No results:
“No matching findings, open questions, or experiments.”

Important:
This should feel like the project’s recommended primary search workflow, not a generic search bar.

============================================================
SCREEN 5 — KNOWLEDGE GRAPH VIEWER
=================================

Purpose:
Visualize relationships among findings, open questions, and experiments.

Important scope:
Use exactly three primary node types:

* F-NNNN — Finding
* Q-NNNN — Open Question
* experiments/YYYY-MM-DD_slug — Experiment

Do not make Report and Artifact primary graph node types unless shown as secondary related metadata in the inspector. The official graph source uses Finding, Open Question, and Experiment nodes.

Data:
knowledge/knowledge_graph_edges.csv
499 edges
Columns:
src, edge_type, dst, basis, detail

Node labels:
Resolve F-IDs and Q-IDs by joining title fields from findings.csv and open_questions.csv.

Edge types:
report-use
origin
cite
relates
resolve-partial
conflict-suspected
supersedes
relates-finding
addresses
strengthens
resolves

Graph views:

1. Global View

* Can render all 499 edges
* Force-directed layout
* Filter by edge type

2. Neighborhood Focus View

* Primary practical view
* Centered on one node
* Equivalent to search_kg.py neighbors <ID>
* Allows users to trace:
  experiment that generated finding
  citation sources
  report usage
  resolved questions
  update lineage

Layout:

* Graph header:
  “Knowledge Graph”
  “499 edges · Finding, Open Question, Experiment nodes”
* Toolbar:
  Search node
  Edge type filters
  Node type filters
  View mode: Global / Neighborhood
  Depth selector: 1-hop / 2-hop / 3-hop
  Fit view
  Reset
* Graph canvas:
  Fixed viewport
  Dotted grid
  No browser scrollbars
  Pan/zoom controls
  Minimap
* Right node inspector

Node styling:
Finding:

* Rectangular node
* Green accent
* Shows ID + short title + confidence

Open Question:

* Rectangular node
* Amber accent
* Shows ID + title + status

Experiment:

* Rectangular node
* Blue/teal accent
* Shows experiment slug + date

Edge styling:
Use line color and label by edge type.
Supersedes/conflict-suspected should be visually distinct.
Dim non-selected relationships.
Highlight selected path.

Node inspector:
For Finding:

* ID
* Title
* Confidence
* Category
* Summary
* Evidence
* Supersedes / superseded by
* Related questions
* Actions:
  Open in Table
  View Evidence Report
  View Lineage

For Open Question:

* ID
* Status
* Priority
* Detail
* Related findings
* Actions:
  Open in Table
  View Related Experiments

For Experiment:

* Slug
* README summary
* REPORT status
* Related findings
* Freshness
* Actions:
  Open Report
  View Experiment

States:

* Graph loading
* Graph failed
* Empty graph
* Node hidden by filters
* No node selected
* Too many edges warning with filter suggestion

============================================================
SCREEN 6 — LINEAGE / SUPERSEDES TRACE
=====================================

Purpose:
Prevent users from relying on outdated conclusions.

This is high priority expansion and bridges Table Viewer + Knowledge Graph.

Entry points:

* From superseded finding row
* From finding detail inspector
* From graph node inspector

Layout:

* Header:
  “Lineage Trace”
* Main lineage timeline/chain
* Right detail inspector

Show:

* Obsolete finding
* Latest valid finding
* Supersedes relationships
* Citation sources
* Experiments that generated findings
* Open questions resolved or partially resolved
* Conflict-suspected relationships

Design:
Use a precise technical chain view:
F-0012 → superseded_by → F-0048 → latest valid claim

For superseded items:

* Gray treatment
* Clear warning:
  “Historical record. Do not use as latest conclusion.”
* CTA:
  “Go to Latest Version”

States:

* No lineage found
* Lineage loading
* Conflict suspected

============================================================
SCREEN 7 — CHAT + ARTIFACT + EXPERIMENT EXPLORER
================================================

This is MVP-3 because Claude stream integration is heavy, but still create a clear screen for future direction.

Purpose:
Users interact with Claude, view generated artifacts, and inspect the experiment directory associated with the chat session.

Layout:
Three-pane structure:
Left: Experiment Explorer
Center: Claude chat stream
Right: Artifact viewer

Important behavior:
Each chat session is associated with exactly one experiment directory:
chat_id ⇄ experiment slug

When a new chat begins:

1. Generate experiment slug
2. Fix working directory
3. Use that directory as explorer root

Explorer:
Root should be experiments/<slug>/
Show:
README.md
REPORT.md
analysis.py
outputs/
figures/
bend_rate.png
trend.html
metrics.json

Artifact viewer:
Primary artifact format is PNG.
Also support HTML and JSON.

* PNG: static image preview
* HTML: sandboxed iframe preview
* JSON: structured tree preview

Artifact viewer behavior:

* Automatically display latest generated artifact
* Allow user to manually return to previous artifacts

Chat:

* Stream Claude output
* Show tool/run events:
  “analysis.py executed”
  “figure generated”
  “REPORT.md updated”
* Show source grounding and file references
* Do not make this look like generic ChatGPT
* Make it look like an operator console stream

States:

* Claude connecting
* Claude streaming
* Claude disconnected
* New experiment created
* Artifact generated
* No artifact yet
* Experiment directory unavailable

Read-only rule:
Do not show direct editing of knowledge CSV.
If user wants to log finding or resolve question, use Claude chat action.

============================================================
SCREEN 8 — SYSTEM STATUS
========================

Purpose:
Show local backend, repository, file watching, and Claude integration status.

Layout:

* Backend API
* File delivery
* Repository watcher
* Knowledge index
* Graph data
* Claude Code relay
* Last indexed time
* Endpoint information

Status examples:
Backend API: Connected
File delivery: Ready
Knowledge CSV: Indexed
Graph edges: 499 loaded
Repository watcher: Active
Claude relay: Not configured / Connected
Last indexed: 2 min ago

Offline state:
Backend API: Offline
Repository unavailable
Retry connection
View setup guide

Make this look like an infrastructure console status page.

============================================================
SCREEN 9 — DESIGN SYSTEM / COMPONENTS
=====================================

Create a complete design system frame.

Sections:

1. Color tokens
2. Typography
3. Grid and spacing
4. Buttons
5. Inputs
6. Select/dropdowns
7. Status badges
8. Data tables
9. Expandable rows
10. Metadata rows
11. File chips
12. Search result rows
13. Report viewer components
14. Graph nodes
15. Graph edges
16. Inspector panels
17. Chat stream components
18. Artifact viewer components
19. Empty/loading/error states
20. Backend status states

Component requirements:
Buttons:

* Primary
* Secondary
* Utility
* Ghost
* Danger
* Disabled

Inputs:

* Search
* Facet search
* Select
* Checkbox group
* Chat composer

Badges:
Finding confidence:
high
medium
low
medium-high
superseded

Open Question status:
open
resolved
in-progress
partial-progress

Experiment:
REPORT available
Exploration Only
Missing REPORT
Outdated data

Graph:
origin
cite
report-use
supersedes
conflict-suspected
resolve-partial

States:
Backend connected
Backend offline
Loading CSV
Failed to load CSV
Report not found
README only
Exploration Only
Graph loading
No graph result
Claude disconnected

============================================================
EXPLICIT ANTI-AI-SLOP RULES
===========================

Avoid:

* Random fake charts unrelated to the product
* Generic “AI dashboard” cards
* Oversized rounded cards
* Excessive purple
* Neon glow
* Marketing hero sections
* Icons without meaning
* Fake meaningless lorem ipsum
* Fake entity names inconsistent with the document
* Report/artifact confusion
* Graph nodes that violate the data model
* Direct edit buttons that violate read-only rule
* Buttons that do not match context
* Empty states with generic copy
* Huge blank areas
* Tables with excessive truncation
* Decorative gradients

Use:

* Real terminology from the project brief
* Real file names:
  knowledge/findings.csv
  knowledge/open_questions.csv
  knowledge/tag_taxonomy.csv
  knowledge/knowledge_graph_edges.csv
  experiments/<slug>/README.md
  experiments/<slug>/REPORT.md
  experiments/<slug>/outputs/figures/*.png
  doc/glossary.md
  doc/report_style_guide.md
  doc/system_overview.html
* Real IDs:
  F-0001
  Q-0001
  experiments/2026-06-08_anomaly_check
* Real edge types:
  origin
  cite
  report-use
  supersedes
  conflict-suspected
  resolve-partial
* Real table fields from the document
* Read-only UI patterns
* Cross-links between table, report, graph, and lineage
* Technical but understandable copy

============================================================
FINAL DESIGN QUALITY TARGET
===========================

The final UI should feel like:
“Oxide Web Console for an analytical knowledge repository.”

It should communicate:

* This is local/on-prem style tooling.
* This is reliable and operational.
* This is not a toy AI interface.
* This is a knowledge system with traceability.
* Findings, questions, reports, and experiments are connected.
* Historical knowledge is preserved.
* Superseded knowledge is clearly marked.
* Search uses controlled vocabulary.
* Chat is one interaction mode, not the whole product.

Make the design disciplined, exact, quiet, and technical.

Prioritize MVP-1 screens:

1. Findings & Open Questions
2. Experiment List + REPORT Viewer

Then show:
3. Faceted Search
4. Knowledge Graph
5. Lineage
6. Chat Workspace

Do not over-prioritize Chat visually.
