Refine the existing Quick Agent System prototype. Do not redesign the whole application. Keep the current Oxide-inspired dark technical console style, top bar, left rail navigation, colors, typography, and product structure.

The current visual direction is approved. The next goal is to make the product feel more seamless, guided, and production-ready.

Focus on:

* reducing cognitive load
* hiding prototype/debug controls
* improving Chat Focus Mode
* making Trace Mode clearly advanced
* improving default user flows
* making Overview more action-oriented
* making Knowledge Graph easier by default
* making Claude-mediated update flow clearer
* improving onboarding/empty states

Do not:

* add new major features
* redesign the whole app
* create marketing pages
* use bright gradients
* use playful illustrations
* expose prototype state controls in normal UI
* make the product feel like a generic AI dashboard

============================================================

1. HIDE PROTOTYPE / DEBUG CONTROLS FROM NORMAL UI
   ============================================================

Currently the Chat Workspace shows bottom controls such as:
connected
connecting
disconnected
not-configured
normal
backend offline
session mismatch

These should not appear in the normal product UI.

Move these controls into a hidden “Prototype Controls” or “Developer State Switcher” drawer.

Default user experience must not show:

* connected
* connecting
* disconnected
* not-configured
* normal
* backend offline
* session mismatch

If needed, add a small hidden dev button only visible in prototype mode:
“Prototype States”

For production UI, system state should be represented only through:

* top bar backend status
* System Status screen
* inline error/empty states when relevant

============================================================
2. MAKE CHAT FOCUS MODE CLEANER
===============================

Focus Mode should feel calm and Claude-like.

In Focus Mode:

* Conversation is primary.
* Tool events are collapsed.
* Proposal details are summarized.
* Artifact viewer stays visible but not noisy.
* Only the most important next action is shown.
* Technical logs and detailed event metadata are hidden.

Center chat structure in Focus Mode:

1. User message
2. Claude planning response
3. Compact activity summary
4. Claude analysis response
5. Artifact generated summary
6. Claude conclusion
7. Proposal summary

Example:

User:
“Investigate why entry temperature accounts for residual thickness variance after roll-gap adjustment.”

Claude:
“I’ll search existing findings and open questions first, then create a follow-up experiment if the current evidence is insufficient.”

Activity summary:
“3 actions completed”
search_kg.py · analysis.py · artifact generated
Action: View trace

Claude:
“The fresh snapshot supports F-0050. Entry temperature remains significant after controlling for roll-gap setpoint.”

Artifact summary:
“Generated thickness_by_roll_gap.png”
Action: Open artifact

Proposal summary:
“Claude proposed 1 finding and 1 open question.”
Actions:
Review proposals
Ask Claude to revise

Do not show large individual event cards in Focus Mode unless there is an error.

============================================================
3. MAKE TRACE MODE CLEARLY ADVANCED
===================================

Trace Mode is for technical users who want full operational detail.

In Trace Mode:

* Show expanded tool events
* Show timestamps
* Show commands
* Show execution status
* Show generated file paths
* Show detailed proposal cards
* Show artifact timeline expanded

Add a small label near the Focus / Trace toggle:

Focus:
“Conversation-first”

Trace:
“Full execution trace”

Default should be Focus.

When switching to Trace, show:
“Trace Mode shows Claude tool events, commands, and generated files.”

============================================================
4. SIMPLIFY CHAT COMPOSER
=========================

The composer should be easier to understand.

Composer layout:

Top:
Attached context chips:
F-0050
Q-0014
REPORT.md
experiment:2026-06-08_anomaly_check

Middle:
Large text area:
“Ask Claude about F-0050…”

Bottom:
Left: Attach context
Center: Mode dropdown
Right: Send

Mode dropdown:
Selected:
Investigate

Options:
Ask
Investigate
Create Experiment
Write Report
Update Knowledge

Do not show all modes as equal large tabs by default.

Below composer, show short explanation based on selected mode:
Investigate:
“Claude may create a new experiment directory and run analysis.”

Suggested prompts:
Show only 3:

* Explain this finding
* Trace evidence
* Create follow-up experiment

Move remaining actions into:
“More actions”

More actions menu:

* Generate report summary
* Check superseded lineage
* Add open question through Claude
* Resolve open question through Claude
* Update knowledge through Claude

============================================================
5. MAKE PROPOSAL REVIEW FLOW MORE CONFIDENT
===========================================

Proposal summary should be simple in Focus Mode.

When user clicks “Review proposals”, open a drawer.

Drawer title:
“Review proposed updates”

Show tabs:
Finding F-0061
Open Question Q-0031

For Finding:
ID
Title
Summary
Evidence
Confidence
Facets
Supersedes
Target file: knowledge/findings.csv
Gateway: knowledge-searcher / log-finding

For Open Question:
ID
Title
Priority
Area
Related finding
Target file: knowledge/open_questions.csv
Gateway: add-open-question

Important explanation:
“Frontend is read-only. Updates are performed through Claude-mediated workflows.”

Footer actions:
Confirm through Claude
Ask Claude to revise
Cancel

After confirmation, show status states:

* Pending registration
* Registered through Claude
* Registration failed

Completed state:
“Finding registered through Claude”
Show:
F-0061
knowledge/findings.csv
timestamp

Failed state:
“Registration failed”
Actions:
Ask Claude to inspect
Retry

============================================================
6. IMPROVE ARTIFACT VIEWER DEFAULT UX
=====================================

Artifact Viewer should be useful but calm.

Preview tab:

* image/artifact preview
* short caption
* file path
* generated time
* source command

Move detailed fields to Metadata.

Auto-follow states:

Following latest:
Banner:
“Following latest artifact”
Action:
Pause

Pinned:
Banner:
“Viewing pinned artifact”
Actions:
Resume latest
Open latest

When a new artifact is generated while pinned:
Small notification:
“New artifact generated: residual_trend.png”
Actions:
Open latest
Keep pinned

Timeline tab:
Show compact list:

* Directory created
* search_kg.py completed
* analysis.py executed
* thickness_by_roll_gap.png generated
* metrics.json generated
* REPORT.md updated
* proposals created

============================================================
7. MAKE OVERVIEW MORE ACTION-ORIENTED
=====================================

The Overview is good but should better guide the user.

Move or emphasize “Current Work” near the top.

Current Work should show:

1. Active Investigation
2. Open Question Needing Attention
3. Latest Report

Each row/card should include:

* title
* related ID/path
* status
* timestamp
* primary action

Example:
Active Investigation
F-0050 · Entry temperature variance
Related: Q-0014 · experiments/2026-06-17_roll_gap_variance
Actions:
Open Finding
Ask Claude
View Report

Add a clearer “Recommended Next Step” label:
“Ask Claude to investigate Q-0014”

The Overview should answer:

* What should I continue?
* What needs attention?
* What changed recently?
* Where should I go next?

============================================================
8. MAKE KNOWLEDGE GRAPH DEFAULT TO NEIGHBORHOOD VIEW
====================================================

The global graph is impressive but can overwhelm users.

Default graph view should be:
Neighborhood View

Show:
Centered node
1-hop and 2-hop relationships
Related findings
Related open questions
Origin experiment
Supersedes/conflict edges

Global View should be available but secondary.

Add clear toggle:
Neighborhood / Global

Default:
Neighborhood

If Global selected, show helper text:
“Global view shows all graph edges and may be dense. Use filters to focus.”

Graph should not confuse first-time users.

============================================================
9. IMPROVE FINDINGS TABLE ONBOARDING AND SCANNING
=================================================

The Findings table is compact but dense.

Add small helper copy:
“Select a row to inspect evidence, lineage, and Claude actions.”

Keep table compact, but:

* make title column dominant
* use row hover state
* keep right inspector clear
* show empty/no result states with clear next action

For selected finding, right inspector should clearly show:
Primary action:
Ask Claude

Secondary actions:
View Evidence Report
View Graph
View Lineage

============================================================
10. ADD END-TO-END GUIDED FLOW
==============================

Create a prototype flow that demonstrates the main product value.

Flow:

1. Overview
2. Click Current Work: F-0050
3. Open Finding detail
4. Click “Ask Claude”
5. Chat Workspace opens with F-0050, Q-0014, and report context attached
6. Claude investigates in Focus Mode
7. Artifact is generated and shown in Artifact Viewer
8. Claude proposes 1 finding and 1 open question
9. User opens Review Proposal drawer
10. User confirms through Claude
11. Show pending/completed registration state
12. Return to Findings with updated/pending item visible

Make this flow feel seamless.

Use realistic labels:
F-0050
Q-0014
F-0061
Q-0031
knowledge/findings.csv
knowledge/open_questions.csv
experiments/2026-06-17_roll_gap_variance

============================================================
11. ADD SIMPLE FIRST-TIME HELP
==============================

Add subtle help affordances, not tutorials.

Examples:

* tooltip on Focus / Trace
* tooltip on Update Knowledge mode
* tooltip on Claude-mediated updates
* tooltip on graph Neighborhood / Global
* helper text in empty chat

Empty chat state:
“Attach a finding, question, report, or graph node to ask Claude with context.”

No heavy onboarding modal.

============================================================
12. FINAL QUALITY TARGET
========================

After this refinement, the product should feel:

* compact but not cramped
* powerful but not overwhelming
* technical but understandable
* Claude-like but not a generic chatbot
* Oxide-like but not too cold
* seamless across knowledge browsing and chat
* ready for internal stakeholder demo

The user should immediately understand:

1. where to start
2. what is selected
3. what Claude is doing
4. what artifact was generated
5. what proposal needs review
6. what happens after confirmation

Most important improvements:

* hide debug controls
* clean Chat Focus Mode
* simplify composer
* strengthen proposal review
* make Overview action-oriented
* default graph to Neighborhood View
* create the end-to-end guided flow

Do not redesign the whole app.
This is a V4 production-polish and guided-flow refinement pass.
