Refine and extend the existing Quick Agent System prototype by designing a full Claude-like Chat Workspace. Do not redesign the whole app. Keep the current Oxide-inspired dark industrial console visual direction, navigation, typography, colors, and existing screens.

The owner wants the project to include a chat experience similar to Claude. However, this must not become a generic chatbot. It must be a Claude-like local agent workspace connected to experiments, artifacts, findings, open questions, reports, and the repository.

Project context:
Quick Agent System is a read-only analytical knowledge console. Direct editing of knowledge CSV files is not allowed. Creation and modification of knowledge/issues should happen through Claude chat. The chat is connected to Claude Code stream output and each chat session is associated with exactly one experiment directory.

Core rule:
Chat is not just messaging. Chat is the controlled interaction layer for:

* asking questions about findings
* investigating reports
* creating experiment directories
* running analysis
* generating artifacts
* generating REPORT.md
* proposing findings
* adding open questions
* resolving open questions through Claude
* tracing evidence and lineage

Keep the existing screens:

* Overview
* Findings & Open Questions
* Experiments & Reports
* Faceted Search
* Knowledge Graph
* Lineage Trace
* System Status

Add or significantly improve:

* Chat Workspace
* Chat session list
* Experiment explorer
* Live stream events
* Artifact viewer
* Context attachment workflow
* Claude connection states

Visual direction:
Use the same Oxide-inspired console style:

* dark industrial surfaces
* precise thin borders
* compact panels
* monospace IDs, paths, logs, filenames, timestamps
* minimal radius
* low-noise color
* green for system status
* amber for warning/open question
* red for failure
* purple only sparingly for Claude/AI-specific actions
* no decorative AI gradients
* no neon dashboard
* no generic SaaS cards
* no playful illustration

============================================================

1. CREATE CHAT WORKSPACE MAIN SCREEN
   ============================================================

Screen title:
“Chat Workspace”

Subtitle:
“Run Claude-guided analysis inside a fixed experiment directory.”

Use a three-pane layout:

LEFT PANE — Sessions + Experiment Explorer
CENTER PANE — Claude Chat Stream
RIGHT PANE — Artifact / Report Viewer

Top bar remains the same:
Quick Agent System v0.1.0
Global search
Backend connected · indexed 2m ago
Settings

Left icon rail should highlight Chat Workspace.

============================================================
2. LEFT PANE — CHAT SESSIONS + EXPERIMENT EXPLORER
==================================================

Top section:

* New Chat button
* Claude relay status:
  “Claude relay connected”
  or “Claude relay not configured”

Chat session list:
Show compact session rows:

* chat_2026-06-17_001
* Residual thickness investigation
* experiment slug
* status: Running / Completed / Failed
* last updated timestamp

Example sessions:

1. chat_2026-06-17_001
   Residual thickness investigation
   experiments/2026-06-17_roll_gap_variance
   Running

2. chat_2026-06-16_004
   Feed-rate threshold review
   experiments/2026-05-20_feed_rate_recheck
   Completed

3. chat_2026-06-13_002
   Shift handover null burst
   experiments/2026-05-13_handover_review
   Completed

Selected chat should show associated experiment directory.

Experiment explorer section:
Root:
experiments/2026-06-17_roll_gap_variance/

Tree:
README.md
REPORT.md
analysis.py
outputs/
figures/
thickness_by_roll_gap.png
residual_trend.png
metrics.json
run.log

Each file row:

* file icon
* mono filename
* modified indicator
* generated badge if created during current chat

Explorer behavior:

* Clicking file opens it in the right Artifact Viewer.
* Newly generated files appear with subtle “new” status.
* If Claude generates an artifact, it appears automatically.

============================================================
3. CENTER PANE — CLAUDE CHAT STREAM
===================================

Make this feel like Claude, but more operational and console-like.

Header:
ACTIVE CHAT
chat_2026-06-17_001
Experiment: experiments/2026-06-17_roll_gap_variance
Working directory: fixed
Status: Running

Context strip:
Attached context:

* F-0050
* Q-0014
* experiments/2026-06-08_anomaly_check
* report: 2026-05-20_feed_rate_recheck/REPORT.md

Chat body should include message/event types:

A. User Message
User asks:
“Investigate why entry temperature accounts for residual thickness variance after roll-gap adjustment.”

B. Claude Response
Claude answers in a clean prose block:
“I’ll search existing findings and open questions first, then create a follow-up experiment if the current evidence is insufficient.”

C. System Event
Small console-style event row:
“Created experiment directory”
experiments/2026-06-17_roll_gap_variance

D. Tool Event
Console-style tool run card:
search_kg.py facet process:rolling equipment:roll-gap phenomena:thermal
Status: completed
Results: 4 findings · 2 open questions

E. Claude Analysis Block
Structured response:
SUMMARY
Found prior evidence that roll-gap setpoint explains thickness variance, but entry temperature appears as a residual factor in newer reports.

RELATED FINDINGS
F-0050 — Entry temperature accounts for most residual thickness variance after roll-gap
F-0048 — Bend-rate threshold is 1.65 m/s when coil width exceeds 1200 mm

OPEN QUESTIONS
Q-0014 — Does entry temperature interact with roll-gap setpoint?
Q-0011 — Should feed-rate cap be stratified by coil width?

F. Code Execution Event
Tool/run event:
analysis.py executed
Duration: 12.4s
Exit code: 0

G. Artifact Generated Event
File generated:
outputs/figures/thickness_by_roll_gap.png
Auto-opened in artifact viewer

H. REPORT Updated Event
REPORT.md updated
Sections: Phenomenon, Variables, Mechanism, Countermeasures

I. Knowledge Proposal Event
Claude proposes:
“Proposed new finding”
F-0061
Entry temperature moderates residual thickness after roll-gap correction.
Confidence: medium-high
Evidence: experiments/2026-06-17_roll_gap_variance

Actions:

* Review proposal
* Ask Claude to revise
* Confirm through Claude

Important:
Do not show direct “Save to CSV” button.
Because the frontend is read-only, use Claude-mediated confirmation.

J. Open Question Proposal Event
Claude proposes:
Q-0031
Should entry temperature thresholds be segmented by coil width?
Priority: medium
Actions:

* Ask Claude to add open question
* Revise
* Dismiss

K. Error Event
Claude tool error:
analysis.py failed
Reason: missing parquet snapshot
Actions:

* Ask Claude to inspect README
* Retry
* Open run.log

Chat style:

* Use large readable center conversation area
* Messages should feel like Claude, but structured with technical event cards
* No bubbly consumer chat style
* No rounded colorful message bubbles
* Use subtle panels and markdown-like text
* User message can be plain text with small user label
* Claude message should feel like a professional analysis report
* Tool events should feel like terminal/log cards

============================================================
4. CHAT COMPOSER
================

Composer should be Claude-like but context-aware.

Composer placeholder:
“Ask Claude about the selected context…”

Attached context chips:
F-0050
Q-0014
REPORT.md
experiments/2026-06-08_anomaly_check

Suggested actions:

* Explain this finding
* Trace evidence
* Create follow-up experiment
* Generate report summary
* Check superseded lineage
* Add open question through Claude
* Resolve open question through Claude

Composer controls:

* attach context
* select mode:
  Ask
  Investigate
  Create Experiment
  Write Report
  Update Knowledge
* send button
* stop generating button during streaming

Active composer state:
User typed:
“Create a follow-up experiment to test whether entry temperature moderates roll-gap effects.”

Send button active.

Streaming state:
Show:
“Claude is working…”
Actions:
Stop generating

============================================================
5. RIGHT PANE — ARTIFACT / REPORT VIEWER
========================================

Right panel title:
“Artifact Viewer”

Modes:

* Auto-follow latest artifact: ON/OFF
* Preview
* Metadata
* Related
* Timeline

Default behavior:
When Claude generates a new artifact, right viewer auto-displays latest artifact.

Show artifact:
outputs/figures/thickness_by_roll_gap.png

Preview:

* PNG image chart
* caption
* file path
* generated timestamp
* source command

Metadata:
PATH
TYPE
SOURCE
STATUS
SIZE
GENERATED BY
LAST UPDATED

Related:

* Source experiment
* Related finding proposal F-0061
* Related open question Q-0031
* Related report REPORT.md

Timeline:

1. Experiment directory created
2. analysis.py executed
3. thickness_by_roll_gap.png generated
4. metrics.json generated
5. REPORT.md updated
6. finding proposal created

Supported artifact previews:

* PNG image
* HTML iframe preview
* JSON tree
* REPORT.md markdown preview
* README.md markdown preview
* run.log log viewer

States:

* No artifact yet
* Artifact loading
* Artifact generated
* Artifact failed to load
* Auto-follow paused
* Backend offline cached preview

============================================================
6. NEW CHAT FLOW
================

Create a modal or full-page state for New Chat.

Title:
“Start new Claude session”

Fields:

* Prompt
* Optional initial context
* Experiment slug
  Auto-generated:
  experiments/2026-06-17_roll_gap_variance
* Working directory preview
* Mode:
  Ask existing knowledge
  Investigate with new experiment
  Generate report
  Update knowledge through Claude

Important copy:
“Each chat session is associated with one experiment directory.”

Actions:

* Start session
* Cancel

After starting:
Show system event:
“Experiment directory created”
“Working directory fixed”
“Claude relay connected”

============================================================
7. ENTRY POINTS FROM EXISTING SCREENS
=====================================

Update existing “Ask Claude” actions so they route to Chat Workspace with attached context.

From Finding detail:
Button:
“Ask Claude about this finding”
Opens Chat Workspace with:

* F-ID
* summary
* evidence path
* related Q-ID
* supersedes data

From Open Question detail:
Button:
“Ask Claude about this open question”
Context:

* Q-ID
* status
* priority
* detail history
* related finding/experiment

From Report viewer:
Button:
“Ask Claude about this report”
Context:

* REPORT.md
* related F-IDs
* related Q-IDs
* figures
* experiment slug

From Faceted Search result:
Button:
“Ask Claude about this result”
Context:

* search mode
* selected facets
* result IDs

From Knowledge Graph node:
Button:
“Ask Claude about this node”
Context:

* selected node ID
* incident edges
* neighbors
* lineage if available

From Lineage:
Button:
“Ask Claude explain this lineage”
Context:

* obsolete finding
* latest finding
* supersedes relationship
* conflict-suspected links

============================================================
8. CHAT STATUS / ERROR STATES
=============================

Design these states:

Claude relay not configured:
Title:
“Claude relay not configured”
Message:
“Chat requires Claude Code stream relay. Configure the local backend to enable chat.”
Actions:

* View setup guide
* Retry connection

Claude connecting:
“Connecting to Claude relay…”

Claude disconnected:
“Claude disconnected”
Actions:

* Reconnect
* Save transcript locally

Backend offline:
“Backend connection failed”
Chat disabled
Artifact viewer shows cached/unavailable state

No experiment directory:
“Experiment directory unavailable”

No artifact generated:
“No artifacts yet”
“Generated PNG, HTML, and JSON artifacts will appear here.”

Tool execution failed:
Show error card with:

* command
* exit code
* stderr summary
* open run.log action

User confirmation required:
For knowledge updates:
“Claude is ready to register this finding through knowledge-searcher.”
Actions:

* Confirm through Claude
* Ask to revise
* Cancel

============================================================
9. CHAT DESIGN SYSTEM COMPONENTS
================================

Add these to the Design System frame:

Chat components:

* User message
* Claude response
* System event
* Tool event
* Code execution event
* Artifact generated event
* REPORT updated event
* Knowledge proposal card
* Open question proposal card
* Error event
* Confirmation required card
* Context chip
* Suggested prompt chip
* Chat composer
* Streaming indicator
* Stop generating button

Artifact components:

* Latest artifact banner
* Auto-follow toggle
* Artifact timeline row
* PNG preview
* HTML preview
* JSON preview
* Log preview
* Markdown report preview

Session components:

* Chat session row
* Running status
* Completed status
* Failed status
* New chat modal
* Experiment slug preview

============================================================
10. FINAL QUALITY TARGET
========================

The final chat workspace should feel like:

“Claude Code running inside an Oxide-style local analytical knowledge console.”

It should communicate:

* Claude is connected to a fixed experiment directory
* Every chat creates or uses one experiment workspace
* Generated artifacts appear live
* Knowledge updates happen through Claude, not direct UI editing
* User can start from any finding/report/graph/search result and ask Claude with context
* This is operational, technical, local, and trustworthy

Avoid:

* Generic AI dashboard
* ChatGPT clone
* Large colorful chat bubbles
* Playful empty states
* Random AI icons
* Decorative gradients
* Direct edit/save CSV buttons
* Fake meaningless output

Use:

* Real project terminology
* Real file paths
* Real F-IDs and Q-IDs
* Real experiment slugs
* Real event stream behavior
* Real artifact types: PNG, HTML, JSON
* Read-only knowledge rule
* Claude-mediated update flow

Do not change the approved Oxide-style visual direction.
Do not remove the existing knowledge console screens.
Make Chat Workspace the next major feature layer.
