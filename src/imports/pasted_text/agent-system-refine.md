Refine the existing Quick Agent System prototype. Do not redesign the whole application. Keep the current Oxide-inspired dark technical console style, app shell, navigation, colors, typography, and overall product structure.

Focus only on improving the Chat Workspace into a more credible Claude-like local experiment workspace.

Current direction is approved:

* Oxide-inspired industrial console
* Claude-like chat workspace
* Local backend + Claude relay
* Three-pane layout
* Read-only knowledge system
* Claude-mediated updates
* Experiment directory per chat session
* Artifact viewer with auto-follow behavior

Main goal:
Make the Chat Workspace feel production-ready, state-consistent, Claude-like, and trustworthy. Fix remaining prototype issues caused by session mismatch, unclear composer behavior, weak confirmation flow, and artifact auto-follow ambiguity.

Do not:

* Redesign all screens
* Create marketing pages
* Add playful AI illustrations
* Use generic chatbot bubbles
* Use bright gradients or neon effects
* Add direct CSV edit/save actions
* Break the read-only rule
* Make Chat look detached from experiment directories

============================================================

1. FIX SESSION STATE CONSISTENCY
   ============================================================

This is the most important fix.

Each chat session must be associated with exactly one experiment directory.

When the user selects a chat session, all panes must update together:

* Active chat ID
* Session title
* Experiment slug
* Working directory
* Attached context
* Chat transcript
* Experiment explorer root
* Generated file list
* Artifact viewer content
* Artifact timeline
* Proposal cards
* Status badge

Never show content from one experiment while another chat is selected.

Example:

If selected session is:
chat_2026-06-17_001
Residual thickness investigation
experiments/2026-06-17_roll_gap_variance

Then center chat, left explorer, and right artifact viewer must all use:
experiments/2026-06-17_roll_gap_variance

If selected session is:
chat_2026-06-16_004
Feed-rate threshold review
experiments/2026-05-20_feed_rate_recheck

Then center chat, explorer, and artifact viewer must all update to:
experiments/2026-05-20_feed_rate_recheck

Add a small consistency indicator in the active chat header:
“Session linked · experiment directory fixed”

If a mismatch/error occurs, show:
“Session data mismatch”
“This chat transcript and artifact viewer reference different experiment directories.”
Action:
“Reload session”

============================================================
2. MAKE CENTER CHAT MORE CLAUDE-LIKE
====================================

The center pane should feel more like Claude, but still operational and technical.

Conversation should be the primary reading experience.
Tool events should be secondary and collapsible.

Use this message hierarchy:

1. User message
2. Claude planning response
3. Collapsible tool event
4. Claude analysis response
5. Artifact generated event
6. Claude conclusion
7. Knowledge proposal card
8. Open question proposal card
9. User confirmation / final state

Do not make every message a heavy card.
Use clean readable text blocks like Claude.
Use operational cards only for tool events, generated files, proposals, errors, and confirmation states.

Example conversation:

User:
“Investigate why entry temperature accounts for residual thickness variance after roll-gap adjustment.”

Claude:
“I’ll first search existing findings and open questions, then create a follow-up experiment if the current evidence is insufficient.”

Tool event, collapsed by default:
search_kg.py facet process:rolling equipment:roll-gap phenomena:thermal
Completed · 4 findings · 2 open questions

Claude:
“The strongest prior evidence is F-0050. It suggests entry temperature may explain residual variance after roll-gap correction, but the current report does not isolate coil-width effects.”

System event:
Created experiment directory
experiments/2026-06-17_roll_gap_variance

Tool event:
analysis.py executed
Duration: 12.4s · Exit code: 0

Artifact event:
Generated outputs/figures/thickness_by_roll_gap.png
Auto-opened in Artifact Viewer

Claude:
“The fresh snapshot supports the previous finding. Entry temperature remains significant after controlling for roll-gap setpoint.”

Knowledge proposal:
F-0061
Entry temperature moderates residual thickness after roll-gap correction.
Confidence: medium-high

Open question proposal:
Q-0031
Should entry temperature thresholds be segmented by coil width?

Make the conversation readable, clear, and scannable.

============================================================
3. IMPROVE TOOL EVENT DESIGN
============================

Tool events should look like console event rows/cards.

Types:

* search_kg.py run
* experiment directory created
* analysis.py executed
* artifact generated
* REPORT.md updated
* knowledge proposal created
* open question proposal created
* error

Each tool event should show:

* event type
* command or action
* status
* timestamp
* result summary
* expand/collapse control

Collapsed event example:
search_kg.py facet · completed · 4 findings · 2 open questions

Expanded event example:
Command:
search_kg.py facet process:rolling equipment:roll-gap phenomena:thermal

Result:
F-0050
F-0048
Q-0014
Q-0011

Actions:
View results
Attach results to context
Open in Faceted Search

============================================================
4. IMPROVE CHAT COMPOSER HIERARCHY
==================================

The current composer is powerful but too dense. Rebuild it with stronger hierarchy.

Composer structure:

Top row:
Attached context chips:
F-0050
Q-0014
REPORT.md
experiment:2026-06-08_anomaly_check

Body:
Large text input:
“Ask Claude about the selected context…”

Bottom left:
Attach context button

Bottom center:
Mode selector:
Ask
Investigate
Create Experiment
Write Report
Update Knowledge

Bottom right:
Send button

When a mode is selected, show a one-line explanation:

Ask:
“Claude will answer using attached context and repository knowledge.”

Investigate:
“Claude may create a new experiment directory and run analysis.”

Create Experiment:
“Claude will create a new experiment workspace and prepare files.”

Write Report:
“Claude will update REPORT.md through report-writer.”

Update Knowledge:
“Claude will propose knowledge or issue updates through Claude-mediated workflow.”

Streaming state:
Replace Send with:
“Stop generating”

Show:
“Claude is working…”

Do not make the composer feel like a generic form.
Make it feel like Claude with operational modes.

============================================================
5. ADD PROPOSAL REVIEW AND CONFIRMATION FLOW
============================================

Improve the Proposed Finding and Proposed Open Question cards.

For Proposed Finding card:
Show:

* ID: F-0061
* Title
* Summary
* Evidence
* Confidence
* Facets
* Supersedes, if any
* Target file: knowledge/findings.csv
* Gateway: knowledge-searcher / log-finding

Actions:

* Review proposal
* Ask Claude to revise
* Confirm through Claude

When clicking “Review proposal”, open a right-side review drawer or modal.

Review drawer:
Title:
“Review proposed finding”

Sections:
Proposed fields:
ID
Title
Summary
Evidence
Confidence
Facets
Supersedes
Actionable

Target:
knowledge/findings.csv

Execution:
“This update will be performed through Claude and knowledge-searcher. The frontend will not write directly to CSV.”

Actions:

* Confirm through Claude
* Ask Claude to revise
* Cancel

After confirmation:
Show confirmed state:
“Finding registration requested through Claude”
Status:
Pending / Completed / Failed

For Proposed Open Question:
Show:

* ID: Q-0031
* Title
* Priority
* Status
* Area
* Related finding
* Target file: knowledge/open_questions.csv
* Gateway: add-open-question

Review drawer:
“Review proposed open question”

Actions:

* Ask Claude to add open question
* Ask Claude to revise
* Cancel

Do not show direct “Save to CSV”.

============================================================
6. IMPROVE ARTIFACT AUTO-FOLLOW UX
==================================

The right Artifact Viewer should make auto-follow behavior very clear.

States:

Auto-follow ON:
Banner:
“Following latest artifact”
Action:
“Pause auto-follow”

Auto-follow OFF / pinned:
Banner:
“Auto-follow paused · viewing pinned artifact”
Actions:
“Resume auto-follow”
“Open latest artifact”

When new artifact is generated while auto-follow is OFF:
Show small notification:
“New artifact generated: residual_trend.png”
Actions:
“Open latest”
“Keep pinned”

Artifact viewer should show:

* Preview
* Metadata
* Related
* Timeline

Timeline should include:

1. Experiment directory created
2. search_kg.py completed
3. analysis.py executed
4. thickness_by_roll_gap.png generated
5. metrics.json generated
6. REPORT.md updated
7. finding proposal created
8. open question proposal created

Clicking timeline item opens relevant artifact/event.

============================================================
7. IMPROVE LEFT PANE STRUCTURE
==============================

The left pane should be easier to scan.

Structure:

NEW SESSION

* New Chat button

RELAY

* Claude relay connected / connecting / disconnected / not configured

SESSIONS
Group sessions by status:
Running
Completed
Failed

Each session row:

* chat ID
* title
* experiment slug
* status badge
* last updated

CURRENT EXPERIMENT
experiments/2026-06-17_roll_gap_variance

FILES
README.md
REPORT.md
analysis.py
outputs/
figures/
thickness_by_roll_gap.png
residual_trend.png
metrics.json
run.log

Generated files should show:

* NEW badge
* generated timestamp on hover
* clicking opens in Artifact Viewer

Bottom:
Relay state chips:
connected
connecting
disconnected
not configured

Make selected session visually clear but restrained.

============================================================
8. IMPROVE NEW CHAT MODAL
=========================

Refine the New Chat modal.

Title:
“Start new Claude session”

Subtitle:
“Each chat session is associated with exactly one experiment directory.”

Fields:

Prompt:
textarea

Initial context:
Use chips, not plain text:
F-0050
Q-0014
experiments/2026-06-08_anomaly_check
REPORT.md

Add context button:
“Add context”

Experiment slug:
Auto-generated slug based on prompt:
experiments/2026-06-17_roll_gap_variance

Validation states:

* Valid slug
* Duplicate slug
* Invalid characters
* Slug will be fixed once session starts

Working directory preview:
experiments/2026-06-17_roll_gap_variance/
README.md
REPORT.md
outputs/

Mode:
Ask existing knowledge
Investigate with new experiment
Generate report
Update knowledge through Claude

Each mode should have a short description.

Footer:
Cancel
Start session

After start session:
Show system events:

* Chat session created
* Experiment directory generated
* Working directory fixed
* Claude relay connected

============================================================
9. ADD ENTRY FLOW FROM EXISTING SCREENS TO CHAT
===============================================

Show how “Ask Claude” actions from existing screens open Chat Workspace with context attached.

Create at least 4 prototype states:

A. From Finding detail:
User clicks:
“Ask Claude about this finding”
Chat opens with:
F-0050 attached
Evidence experiment attached
Related Q-0014 attached
Composer placeholder:
“Ask Claude about F-0050…”

B. From Report viewer:
User clicks:
“Ask Claude about this report”
Chat opens with:
REPORT.md
experiment slug
related F-IDs
related Q-IDs
figures

C. From Knowledge Graph:
User clicks:
“Ask Claude about this node”
Chat opens with:
selected node
incident edges
neighbor findings/questions

D. From Faceted Search:
User clicks:
“Ask Claude about this result”
Chat opens with:
search query
selected facets
result IDs

This makes Chat feel connected to the whole product.

============================================================
10. ADD CHAT-SPECIFIC EMPTY, ERROR, AND LOADING STATES
======================================================

Create these states:

Empty Chat:
“No conversation yet”
“Attach context or ask Claude to begin.”

Claude connecting:
“Connecting to Claude relay…”

Claude relay not configured:
“Claude relay not configured”
“Chat requires Claude Code stream relay. Configure the local backend to enable chat.”
Actions:
Retry connection
View setup guide

Claude disconnected:
“Claude disconnected”
Actions:
Reconnect
Save transcript locally

Backend offline:
“Backend connection failed”
Chat disabled
Artifact preview unavailable unless cached

No artifact yet:
“No artifacts yet”
“Generated PNG, HTML, and JSON artifacts will appear here.”

Tool failed:
Show error event:
analysis.py failed
Exit code: 1
stderr summary
Actions:
Open run.log
Ask Claude to inspect
Retry

Knowledge confirmation pending:
“Claude is registering this finding…”
Status:
Pending

Knowledge confirmation completed:
“Finding registered through Claude”
Show:
F-0061
knowledge/findings.csv updated

Knowledge confirmation failed:
“Finding registration failed”
Actions:
Ask Claude to inspect
Retry

============================================================
11. REDUCE PURPLE DOMINANCE
===========================

Keep the current dark Oxide-like style.

Use purple sparingly for:

* Claude-specific action
* Confirm through Claude
* selected mode, if needed

Use teal/green for:

* system status
* generated files
* successful events
* connected states

Use amber for:

* proposed open question
* paused auto-follow
* warning

Use red for:

* failure
* disconnected
* error

Utility buttons should be dark bordered buttons, not purple.

============================================================
12. CHAT DESIGN SYSTEM ADDITIONS
================================

Add or improve these components in the Design System frame:

Message components:

* User message
* Claude response
* Claude planning response
* Claude final answer
* System event
* Tool event collapsed
* Tool event expanded
* Artifact generated event
* REPORT updated event
* Knowledge proposal
* Open question proposal
* Proposal review drawer
* Confirmation pending
* Confirmation completed
* Confirmation failed
* Error event

Composer components:

* Empty composer
* Active composer
* Context chips
* Mode selector
* Streaming state
* Stop generating

Session components:

* Session row running
* Session row completed
* Session row failed
* Session selected
* Session mismatch warning
* New chat modal
* Slug validation

Artifact components:

* Auto-follow ON
* Auto-follow paused
* New artifact notification
* Artifact timeline
* No artifact state
* Cached artifact state

============================================================
13. FINAL QUALITY TARGET
========================

The final Chat Workspace should feel like:

“Claude Code running inside an Oxide-style local analytical knowledge console.”

It should communicate:

* Chat is tied to one fixed experiment directory.
* Claude can search existing knowledge.
* Claude can create experiments.
* Claude can execute analysis.
* Claude can generate artifacts.
* Claude can write REPORT.md.
* Claude can propose findings and open questions.
* Frontend remains read-only.
* Knowledge updates are confirmed through Claude, not direct CSV editing.
* Generated artifacts appear live and are traceable.

Most important fixes:

1. Session-content synchronization
2. Claude-like conversation readability
3. Composer hierarchy
4. Proposal review/confirmation flow
5. Artifact auto-follow controls
6. New chat modal context chips
7. Entry flows from existing screens into Chat

Do not redesign the whole app.
This is a Chat Workspace V2 refinement pass.
