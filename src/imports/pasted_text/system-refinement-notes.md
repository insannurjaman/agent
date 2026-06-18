Refine the existing Quick Agent System prototype. Do not redesign the whole app. Keep the current Oxide-inspired dark industrial console style, top bar, left rail navigation, typography, colors, spacing, and core layouts.

Focus only on refining the Overview / System Map and System Status screens so they feel more actionable, more logically consistent, and more production-ready.

The current visual direction is approved. Do not change the overall style.

Design principles:

* Oxide-inspired infrastructure console
* Dark, precise, technical, low-noise
* Thin borders
* Compact tables
* Monospace technical values
* Green/amber/red system statuses
* Teal for system accents
* Purple only for Claude-specific actions and use it sparingly
* No decorative gradients
* No marketing sections
* No AI-slop visuals
* No placeholder cards

============================================================

1. IMPROVE OVERVIEW / SYSTEM MAP
   ============================================================

The current Overview screen is useful, but it still feels too static. Make it feel like a live operational home screen for the knowledge system.

Keep these existing sections:

* Knowledge Loop
* Documentation Layers
* Repository Snapshot
* Active Context
* Quick Actions
* Module Status
* Recent Knowledge Activity

Improve the page by adding stronger actionability and clearer hierarchy.

---

## 1A. Add “Current Work” section

Add a new section near the top or right side titled:

“Current Work”

Purpose:
Show what the user should continue next.

Create 3 compact rows/cards:

1. Active Investigation
   Title:
   F-0050 · Entry temperature variance

Description:
Residual thickness variance remains linked to roll-gap and entry temperature interactions.

Metadata:
Related: Q-0014 · experiments/2026-06-17_roll_gap_variance
Last updated: 2m ago

Actions:
Open Finding
Ask Claude
View Report

2. Open Question Needing Attention
   Title:
   Q-0014 · Does entry temperature interact with roll-gap setpoint?

Metadata:
Priority: High
Status: Open
Related finding: F-0050

Actions:
Open Question
Ask Claude to Investigate

3. Latest Report
   Title:
   REPORT.md indexed

Path:
experiments/2026-06-17_roll_gap_variance/REPORT.md

Metadata:
Figures: 2
Related findings: 3
Indexed: 18m ago

Actions:
Open Report
View Graph

Use compact, table-like rows, not large dashboard cards.

---

## 1B. Improve Knowledge Loop structure

The Knowledge Loop currently shows all steps equally. Group the loop into 3 phases:

PHASE 1 — INPUT
01 Question
02 Review Knowledge

PHASE 2 — EXPERIMENT
03 Create Experiment
04 Execute
05 Validate

PHASE 3 — KNOWLEDGE OUTPUT
06 Knowledge
07 Issues
08 Report
09 Promotion

Visually show phase labels above the step cards.
Use subtle connector lines between steps.
Keep rectangular cards and low-noise style.

Each step card should show:

* step number
* label
* short description
* status dot

Make the most important steps slightly more visually emphasized:

* Review Knowledge
* Create Experiment
* Knowledge
* Report
* Promotion

Do not use colorful marketing graphics.

---

## 1C. Improve Repository Snapshot

Keep current snapshot metrics, but make it more actionable.

Add small status indicators:
Findings: 79 · Indexed
Open Questions: 47 · Indexed
Graph Edges: 499 · Loaded
Experiments: 18 · Synced
PNG Figures: 106 · Available
HTML Artifacts: 2 · Available

Add action:
“Open repository index”

---

## 1D. Improve Active Context

Keep Active Context but make it clearer.

Show:
Backend API: Connected
Knowledge Index: Ready
Graph Index: Ready
Claude Relay: Connected
Repository Watcher: Active
Frontend Mode: Read-only
Update Mode: Claude-mediated

Add explanation:
“Knowledge CSV files are not edited directly from the frontend. Updates are confirmed through Claude-mediated workflows.”

Action:
“Open System Status”

---

## 1E. Improve Quick Actions

Keep actions:
Open Findings
Open Reports
Search by Facets
View Knowledge Graph
Start Claude Session

Make button styling more restrained:

* Utility actions: dark bordered buttons
* Start Claude Session: subtle Claude accent, not overly purple

Add small descriptions under actions:
Open Findings — Browse findings and open questions
Open Reports — Review experiment REPORT.md files
Search by Facets — Use controlled vocabulary search
View Knowledge Graph — Trace relationships and lineage
Start Claude Session — Ask Claude with attached context

---

## 1F. Improve Recent Knowledge Activity

Make activity rows more actionable.

Each row should include:

* type badge
* title
* source/path
* timestamp
* action icon or text action

Rows:
F-0050 updated · entry temperature variance · knowledge/findings.csv · 2m ago · Open
Q-0014 linked to F-0050 · knowledge_graph_edges.csv · 12m ago · View graph
REPORT.md indexed · experiments/2026-06-17_roll_gap_variance · 18m ago · Open report
knowledge_graph_edges.csv refreshed · 499 edges · 22m ago · View graph
tag_taxonomy.csv loaded · 40 terms · 30m ago · Search facets

============================================================
2. IMPROVE SYSTEM STATUS
========================

The System Status screen is strong. Refine it for better logic, clarity, and interaction.

Keep both states:

* Operational
* Degraded

---

## 2A. Fix degraded state consistency

In degraded mode, avoid contradictory statuses.

If backend is offline and repository unavailable, update service statuses:

Backend API:
Offline

File Delivery:
Cached or Unavailable, depending on state

Knowledge Indexer:
Stale

Graph Loader:
Cached / Stale

Claude Relay:
Disconnected

Repository Watcher:
Paused

Repository & Indexing files:
Status should be Stale, not Indexed

Use clear labels:
OFFLINE
CACHED
STALE
DISCONNECTED
PAUSED

Do not show services as fully Ready while the overall state says repository unavailable unless there is a clear “cached” explanation.

Add explanation banner:
“Some data is shown from the last successful index. Live repository updates are unavailable until the backend reconnects.”

---

## 2B. Improve operational service table

For operational mode, keep the Local Services table but add row interactions.

Each row should have:

* service name
* status
* endpoint
* latency
* last check
* action

Add hover state:
On hover, show:
View details
Copy endpoint
Test service

Clicking a service row should open a right-side detail drawer.

Service detail drawer content:
Service name
Status
Endpoint
Last check
Latency
Recent events
Available actions

Example for Backend API:
Status: Connected
Endpoint: 127.0.0.1:8787
Latency: 24ms
Last check: 2m ago
Recent event: backend.health connected
Actions:
Test
Copy endpoint
View diagnostics

---

## 2C. Improve Claude Relay panel

Make Claude Relay more specific and operational.

Operational state:
Status: Connected
Mode: stream-json
Transport: WebSocket
Session: chat_2026-06-17_001
Experiment directory: experiments/2026-06-17_roll_gap_variance
Working directory: fixed
Last stream event: artifact_generated
Last event time: 28s ago

Actions:
Test relay
Reconnect
View stream log
Open Chat Workspace

Degraded state:
Status: Not Configured or Disconnected

Message:
“Chat requires Claude Code stream relay. Configure the local backend to enable chat.”

Actions:
View setup guide
Retry connection
Open System Logs

---

## 2D. Improve Repository Watcher panel

Operational:
Status: Active

Watched paths:
knowledge/*.csv
experiments/*
experiments/*/REPORT.md
experiments/*/outputs/
doc/*.md

Recent detected changes:
output/thickness_by_roll_gap.png generated · 28s ago
REPORT.md updated · 42s ago
findings.csv indexed · 2m ago
graph edges refreshed · 2m ago

Actions:
Pause watcher
Force scan
View watcher log

Degraded:
Status: Paused

Message:
“Repository watcher is paused because backend connection is unavailable.”

Actions:
Resume watcher
Force scan
View watcher log

---

## 2E. Improve diagnostics log

Diagnostics panel should feel more actionable.

Add:

* Copy log
* Download diagnostics
* Filter by service
* Filter by severity
* Clear filters

Severity filters:
All
Info
Warn
Error

Service filters:
Backend
Indexer
Graph
Watcher
Claude Relay

Each log row:
timestamp
severity
service
message

Example:
2026-06-17T12:22:01Z INFO backend.health connected latency=24ms
2026-06-17T12:22:02Z INFO index.knowledge findings=79 questions=47
2026-06-17T12:22:03Z INFO graph.load edges=499 nodes=126
2026-06-17T12:22:05Z INFO watcher.active paths=5
2026-06-17T12:22:10Z INFO claude.relay stream-json connected

---

## 2F. Add System Status detail states

Create additional states or panels:

1. Service detail drawer
2. Copy diagnostics success toast
3. Re-index knowledge loading state
4. Reload graph loading state
5. Retry connection loading state
6. Retry connection failed state
7. Retry connection successful state

Use small system toasts:
“Diagnostics copied”
“Knowledge re-index started”
“Graph reload completed”
“Backend connection restored”

============================================================
3. VISUAL REFINEMENT
====================

Keep the current look but polish:

* Reduce excessive empty spaces where possible.
* Align all panel edges precisely.
* Use consistent section heights.
* Keep right panel widths consistent.
* Use mono values for endpoints, paths, timestamps, and counts.
* Keep all status badges visually consistent.
* Use teal/green for operational states.
* Use amber for stale/cached/paused.
* Use red for offline/error.
* Use purple only for Claude-specific actions.

Do not make it colorful.
Do not make it look like a SaaS dashboard.
Keep it like an infrastructure console.

============================================================
4. FINAL QUALITY TARGET
=======================

After this refinement:

Overview should answer:

* What is this system?
* What is the current repository state?
* What should I continue next?
* Where do I go from here?

System Status should answer:

* Is the local stack healthy?
* Which service is failing?
* Is data live, cached, or stale?
* What can I do to recover?
* Can I copy diagnostics for the team?

Both screens should feel complete, useful, and demo-ready.
