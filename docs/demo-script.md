# Demo Script

Step-by-step walkthrough for presenting the Quick Agent System V1 prototype.

## Setup

1. Run `pnpm dev` and open the browser at the dev server URL.
2. Ensure dark mode is active (default). Check TopBar theme toggle.
3. Resize browser to ≥ 1280px for desktop demo, or 768–1279px for tablet.
4. Close any browser dev tools or extensions that affect layout.

---

## 1. Opening — Chat Workspace (3 min)

**Route:** `/chat` (default landing)

**Show:**
- Three-panel layout: Session explorer (left), Chat stream (center), Artifact viewer (right)
- Three mock sessions with different statuses: running, completed, failed
- Select the **"Residual thickness investigation"** session (running)

**Walk through the transcript:**
- User message → Claude response → tool calls (search_kg.py)
- System events (experiment directory created)
- Execution events (analysis.py, exit code 0)
- Artifact generation (thickness_by_roll_gap.png)
- Report generation (REPORT.md with 4 sections)
- **Finding proposal** (F-0061) — show the review drawer
- **Question proposal** (Q-0031) — show how proposals are presented

**Key points to highlight:**
- Artifacts render inline: images, JSON, markdown, logs
- Context panel shows attached findings and questions
- Timeline sidebar tracks experiment progress
- Resizable panels — drag handles to adjust

**Tablet demo:** Show that panels become drawers, chat goes full-width.

---

## 2. Findings & Open Questions (2 min)

**Route:** `/findings`

**Show:**
- Tabbed view: All, Findings, Open Questions
- **Search** by ID or title (e.g., type "thickness")
- **Filter** by confidence level (e.g., select "high")
- **Sort** by date, confidence, or priority
- **Actionable** toggle filter

**Click a row:**
- Expand to see summary
- Click to open inspector panel (desktop) or overlay (tablet/mobile)
- Show "Go to Latest Version" link for superseded findings (F-0001 → F-0048)

**Key points:**
- Superseded findings are visually dimmed
- Facets shown as inline tags
- Row menu: View in Graph, View Lineage, Ask Claude

---

## 3. Experiments & Reports (2 min)

**Route:** `/experiments`

**Show:**
- Sidebar list of 7 experiments, sorted by date
- Status badges: report, exploration-only, missing
- Stale-data warning on outdated experiments (F-0034)

**Select "Entry temperature & thickness spread":**
- Report renders as markdown with tables, code blocks, images
- Sidebar shows freshness data (parquet mtime, row count, date range)
- Related findings and questions listed

**Key points:**
- Markdown rendering with inline figures
- Report status clearly indicated
- "Ask Claude" action buttons available

---

## 4. Faceted Search (2 min)

**Route:** `/search`

**Show:**
- Mode selector: Topic, Facet, Neighbors, Experiment
- **Facet mode:** Multi-select facets from the taxonomy (process, phenomena, equipment, quality)
- Results update live as facets are selected
- Results include findings, questions, and experiments

**Switch to Topic mode:**
- Free-text search across all entities
- Results grouped by type

**Click a result:**
- Inspector overlay with detail view
- "Ask Claude" and navigation actions

---

## 5. Knowledge Graph (2 min)

**Route:** `/graph`

**Show:**
- Force-directed layout with all entities as nodes
- Color coding: orange=findings, amber=questions, teal=experiments
- Edge types with color legend

**Toggle to Neighborhood mode:**
- Click a node to see its immediate connections
- Zoom and pan with mouse

**Toggle to List view:**
- Table of all graph nodes

**Key points:**
- Deep-link support: `/graph?focus=F-0050` focuses on a specific node
- Edge types: origin, supersedes, cite, relates, conflict-suspected
- Graph recomputes layout on interaction

---

## 6. Lineage (2 min)

**Route:** `/lineage`

**Show:**
- Supersedes chains displayed as vertical timelines
- Click a chain to see the full evolution
- Selected finding shows detail in inspector

**Walk through F-0001 → F-0048:**
- Original finding (F-0001): "Feed rate above 1.8 m/s"
- Superseded by F-0048: "Threshold is 1.65 m/s"
- Show that the chain is directional (oldest → newest)

**Key points:**
- Each chain has a root (finding that starts the lineage)
- Deep-link: `/lineage?focus=F-0048`
- Inspector shows full finding detail

---

## 7. Overview (1 min)

**Route:** `/overview`

**Show:**
- 5-phase loop diagram: Input → Experiment → Knowledge → Review → Output
- Each phase has steps with icons and descriptions
- Quick-start cards linking to main screens

---

## 8. Responsive Behavior (2 min)

**Resize to tablet (768–1279px):**
- NavRail disappears, hamburger menu appears
- Inspectors become side drawers
- Chat workspace panels become drawers

**Resize to mobile (< 768px):**
- Tables become card lists
- Full-screen drawers for inspectors
- Bottom navigation patterns

---

## Closing

**Key takeaways:**
- Oxide-inspired dark UI — technical, dense, production-grade feel
- Consistent component library (shadcn/Radix)
- Read-only prototype — all data is static TypeScript
- Ready for backend integration (API hooks would replace mock data)
- Desktop-first with responsive mobile/tablet support

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Screen is white | Check that dark mode is toggled on |
| Layout overflows on mobile | Ensure browser is at < 768px width |
| Graph is not rendering | Check browser console for SVG errors |
| `/design` route not found | Only available in dev mode (`pnpm dev`) |
