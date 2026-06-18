Refine the existing Quick Agent System Chat Workspace. Do not redesign the whole application. Keep the current Oxide-inspired dark technical console style, top bar, left rail navigation, typography, colors, and product structure.

Focus only on making the Chat Workspace cleaner, calmer, more Claude-like, and less overwhelming.

Current problem:
The chat screen is functionally strong but visually overwhelming. Too many colors, too many event cards, too many visible actions, too many badges, and too many panels compete for attention. The user should feel like they are using a calm Claude-like analysis workspace, not reading a noisy event dashboard.

Main goal:
Simplify the Chat Workspace while preserving power. Make conversation the primary experience, and make tool events, proposals, file activity, and debug states secondary or progressively disclosed.

Keep the core concept:

* Claude-like chat
* fixed experiment directory
* artifact viewer
* attached context
* Claude-mediated knowledge updates
* read-only frontend
* local backend / Claude relay
* experiment files and generated artifacts

Do not remove:

* Sessions
* Experiment directory
* Artifact viewer
* Attached context
* Tool events
* Proposal workflow

But make them cleaner and less visually dominant.

============================================================

1. REDUCE VISUAL NOISE AND COLOR USAGE
   ============================================================

Reduce the number of accent colors visible at the same time.

Use this color system:

* Green: connected, completed, generated, successful
* Amber: warning, proposal, needs review
* Red: failed, disconnected, error
* Purple: only Claude-specific primary action
* Teal/Cyan: links, file paths, active technical references
* Gray: normal system events, inactive elements, metadata

Rules:

* Do not use purple for normal utility actions.
* Do not use bright borders around every event card.
* Proposal cards should be subtle amber-accented, not loud.
* Tool events should be gray/neutral by default.
* Only errors should visually interrupt the flow.
* Keep the UI Oxide-like: quiet, precise, industrial, low-noise.

============================================================
2. MAKE CONVERSATION THE PRIMARY EXPERIENCE
===========================================

The center pane should feel more like Claude.

Conversation should be the main reading flow.

Structure:

1. User message
2. Claude planning response
3. Claude analysis response
4. Claude conclusion
5. Proposal summary

Tool events should not dominate the chat. They should appear as compact collapsible activity rows.

Example:

User:
“Investigate why entry temperature accounts for residual thickness variance after roll-gap adjustment.”

Claude:
“I’ll search existing findings and open questions first, then create a follow-up experiment if the evidence is insufficient.”

Activity summary row:
“3 actions completed · search_kg.py · analysis.py · artifact generated”
Button: “View activity”

Claude:
“The fresh snapshot supports the previous finding. Entry temperature remains significant after controlling for roll-gap setpoint.”

Proposal summary:
“Claude proposed 1 finding and 1 open question.”
Actions:
Review proposals
Ask Claude to revise

Do not show every tool event as a large full-width card by default.

============================================================
3. COLLAPSE TOOL EVENTS BY DEFAULT
==================================

Replace multiple large event cards with compact collapsible activity rows.

Collapsed state:
“search_kg.py completed · 4 findings · 2 open questions”
“analysis.py executed · 12.4s · exit 0”
“Artifact generated · thickness_by_roll_gap.png”
“REPORT.md updated · 4 sections”

Expanded state:
Shows command, result, timestamp, and actions.

Default behavior:

* Tool events are collapsed.
* The user can expand if they want operational detail.
* Error events are expanded by default.

This makes the chat readable and less overwhelming.

============================================================
4. SIMPLIFY PROPOSAL CARDS
==========================

Current proposal cards are too large and too visually dominant.

Replace them with a compact proposal summary inside the conversation.

Default proposal summary:
Title:
“Claude proposed updates”

Content:

* Finding F-0061 · medium-high confidence
* Open Question Q-0031 · medium priority

Actions:

* Review proposals
* Ask Claude to revise

When user clicks “Review proposals”, open a right-side drawer or modal.

Proposal Review Drawer:
Title:
“Review proposed updates”

Tabs:
Finding F-0061
Open Question Q-0031

Finding detail:
ID: F-0061
Title: Entry temperature moderates residual thickness after roll-gap correction.
Summary
Evidence
Confidence
Facets
Target file: knowledge/findings.csv
Gateway: knowledge-searcher / log-finding

Open Question detail:
ID: Q-0031
Title: Should entry temperature thresholds be segmented by coil width?
Priority
Area
Related finding
Target file: knowledge/open_questions.csv
Gateway: add-open-question

Footer actions:
Confirm through Claude
Ask Claude to revise
Cancel

Important:
Do not show direct “Save to CSV”.
Keep copy:
“Frontend is read-only. Updates are performed through Claude-mediated workflows.”

============================================================
5. SIMPLIFY SUGGESTED PROMPTS
=============================

Currently there are too many visible suggested prompt chips.

Show only 3 primary suggestions by default:

* Explain this finding
* Trace evidence
* Create follow-up experiment

Add a “More actions” button that opens a small menu with:

* Generate report summary
* Check superseded lineage
* Add open question through Claude
* Resolve open question through Claude
* Update knowledge through Claude

This reduces overload.

============================================================
6. SIMPLIFY THE COMPOSER
========================

Make the composer calmer and more Claude-like.

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
Left:
Attach context

Center:
Mode dropdown:
Mode: Investigate

Right:
Send button

Mode dropdown options:
Ask
Investigate
Create Experiment
Write Report
Update Knowledge

When a mode is selected, show one short explanation below the composer:
Investigate:
“Claude may create a new experiment directory and run analysis.”

Do not show all mode options as large equal tabs all the time.
Keep only the selected mode visible by default.

Streaming state:

* Replace Send with Stop
* Show “Claude is working…”
* Keep composer visually calm

============================================================
7. SIMPLIFY LEFT PANEL
======================

The left panel is too dense.

Use two tabs at the top of the left panel:
Sessions
Files

Default selected tab:
Sessions

Sessions tab:

* New Chat button
* Claude relay status
* Running sessions
* Completed sessions
* Failed sessions

Each session row:

* title
* chat ID
* experiment slug
* status
* timestamp

Files tab:
Show current experiment directory:
experiments/2026-06-17_roll_gap_variance/

Files:
README.md
REPORT.md
analysis.py
outputs/
figures/
thickness_by_roll_gap.png
residual_trend.png
metrics.json
run.log

Generated files may show small “new” badge.

This reduces left panel overload.

Alternative if tabs are not desired:
Keep both sections but make Files collapsible by default.

============================================================
8. IMPROVE ACTIVE CHAT HEADER
=============================

Make the active chat header compact and clear.

Show:
ACTIVE CHAT
chat_2026-06-17_001
Residual thickness investigation
Experiment: experiments/2026-06-17_roll_gap_variance
Working directory: fixed
Status: Running

Show a subtle green status:
“Session linked · experiment directory fixed”

Do not overuse badges.
Do not make the header too tall.

============================================================
9. MAKE ARTIFACT VIEWER CLEANER
===============================

The Artifact Viewer is useful but should be calmer.

Keep:

* Preview
* Metadata
* Related
* Timeline

Top status:
“Following latest artifact”
Action:
Pause

If auto-follow paused:
“Viewing pinned artifact”
Actions:
Resume latest
Open latest

Preview area:
Show artifact image, caption, path, generated time, source command.

Do not show too many metadata fields in preview tab.
Move details into Metadata tab.

Timeline should be compact:

* Directory created
* analysis.py executed
* thickness_by_roll_gap.png generated
* metrics.json generated
* REPORT.md updated
* proposals created

============================================================
10. HIDE PROTOTYPE DEBUG CONTROLS
=================================

The bottom debug controls should not be visible in normal user mode.

Hide from default UI:

* connected
* connecting
* disconnected
* not-configured
* normal
* backend offline
* session mismatch

Move these to one of:

* System Status screen
* Hidden prototype controls
* Developer/debug drawer

Default users should not see state-switcher chips at the bottom.

============================================================
11. CREATE TWO CHAT DENSITY MODES
=================================

Create two variants of the Chat Workspace:

A. Focus Mode
Default user experience.

* Conversation first
* Tool events collapsed
* Proposal summary compact
* Minimal colors
* Left panel sessions only
* Artifact viewer clean

B. Trace Mode
For technical users.

* Tool events expanded
* Detailed timestamps
* Commands visible
* Proposal cards expanded
* Artifact timeline expanded

Add a small toggle near chat header:
Focus / Trace

Default should be Focus.

This gives technical users access to detail without overwhelming normal users.

============================================================
12. FINAL QUALITY TARGET
========================

After refinement, the Chat Workspace should feel:

* cleaner
* calmer
* more Claude-like
* less visually noisy
* less color-heavy
* easier to understand
* still powerful for technical users
* still connected to experiment directory and artifacts

The user should immediately understand:

1. Which chat is active
2. What context is attached
3. What Claude is saying
4. What artifact was generated
5. What action they can take next

The user should not feel overwhelmed by:

* too many colors
* too many event cards
* too many buttons
* too many visible debug states
* too many equal-priority panels

Keep the Oxide-inspired technical console style, but make it more elegant and restrained.
