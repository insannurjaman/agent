import type { Experiment } from './types';

// Mock rows for experiments/*. Markdown is stored as template strings.

const anomalyCheckReport = `# REPORT — Entry Temperature & Thickness Spread

## Phenomenon
Thickness spread on Line 1 widens during the first two hours of runs that
start with cold feedstock. The effect is independent of roll-gap setpoint,
which F-0034 already established as the dominant first-order factor.

![Bend rate vs entry temperature](outputs/figures/bend_rate.png)

## Variables
| Variable | Role | Range observed |
| --- | --- | --- |
| entry_temp_c | candidate driver | 940–1010 °C |
| roll_gap_mm | controlled | 2.1–2.6 mm |
| thickness_sd | response | 0.02–0.09 mm |

Entry temperature below **980 °C** is associated with a sharp increase in
\`thickness_sd\`. The relationship is monotonic but not linear.

## Mechanism
Cold feedstock raises material yield strength, so the same roll-gap setpoint
produces a larger and more variable elastic recovery. This is consistent with
F-0050 and refines the residual-variance hypothesis from F-0034.

\`\`\`python
seg = pelt(thickness, model="rbf", pen=12)   # F-0031 segmentation
df = df.with_columns(run_id=seg.labels)
spread = df.group_by("run_id").agg(pl.col("thickness").std())
\`\`\`

## Countermeasures
1. Enforce an entry-temperature floor of 980 °C on Line 1 feedstock.
2. Pre-heat cold coils before the first run of a shift.
3. Track \`thickness_sd\` per run as a leading quality indicator.

> Historical context: the original bend-rate threshold (F-0001) was superseded
> by F-0048 after the mtime window was corrected. See Q-0014 for the open
> setpoint-sweep follow-up.

![Thickness spread by run](outputs/figures/trend.png)
`;

const anomalyCheckReadme = `# 2026-06-08_anomaly_check

Validates whether entry temperature explains the residual thickness variance
left after roll-gap (F-0034).

## Conclusions
- Entry temp below 980 °C widens thickness spread (F-0050).
- Effect is monotonic and independent of roll-gap setpoint.
- Recommends an entry-temperature floor; opens setpoint-sweep Q-0014.

See REPORT.md for the full four-axis analysis.
`;

const feedRecheckReadme = `# 2026-05-20_feed_rate_recheck

Re-runs the feed-rate sweep on the corrected parquet mtime window.

## Conclusions
- Bend-rate threshold is 1.65 m/s for coil width > 1200 mm (F-0048).
- Supersedes the earlier 1.8 m/s estimate (F-0001).
- Effect strengthens with coil width; grade interaction still open (Q-0011).
`;

const feedRecheckReport = `# REPORT — Refined Feed-Rate Threshold

## Phenomenon
Bend rate rises sharply above a feed-rate threshold that is lower than the
original F-0001 estimate once the contaminated mtime window is removed.

## Variables
| Variable | Role | Range |
| --- | --- | --- |
| feed_rate_ms | driver | 1.2–2.1 m/s |
| coil_width_mm | moderator | 900–1400 mm |
| bend_rate | response | 0.4–6.2 % |

## Mechanism
Wider coils have more unsupported span, lowering the feed rate at which
dynamic instability sets in. The corrected window removes a startup transient
that had inflated the earlier threshold.

## Countermeasures
1. Cap feed rate at 1.6 m/s for width > 1200 mm.
2. Stratify the next sweep by coil grade to resolve Q-0011.

![Threshold by coil width](outputs/figures/bend_rate.png)
`;

const nullSpikeReadme = `# 2026-03-02_null_spike

Exploratory look at null density on the vibration sensor.

## Conclusions
- Null bursts cluster at 06:00 and 18:00 (F-0012).
- Likely a PLC buffer flush during shift handover.
- No formal report — handed to handover review (2026-05-13).
`;

export const experiments: Experiment[] = [
  {
    slug: 'experiments/2026-06-08_anomaly_check',
    title: 'Entry temperature & thickness spread',
    date: '2026-06-08',
    conclusions: [
      'Entry temp below 980 °C widens thickness spread (F-0050).',
      'Effect is monotonic and independent of roll-gap setpoint.',
      'Recommends an entry-temperature floor; opens Q-0014.',
    ],
    reportStatus: 'report',
    lastModified: '2026-06-09 08:42',
    relatedFindings: ['F-0050', 'F-0034'],
    relatedQuestions: ['Q-0014'],
    freshness: {
      parquetMtime: '2026-06-08 23:11',
      rowCounts: '1,284,902 rows',
      dateRange: '2026-05-01 → 2026-06-08',
    },
    figures: ['outputs/figures/bend_rate.png', 'outputs/figures/trend.png'],
    readme: anomalyCheckReadme,
    report: anomalyCheckReport,
  },
  {
    slug: 'experiments/2026-05-20_feed_rate_recheck',
    title: 'Feed-rate threshold re-check',
    date: '2026-05-20',
    conclusions: [
      'Threshold is 1.65 m/s for width > 1200 mm (F-0048).',
      'Supersedes the earlier 1.8 m/s estimate (F-0001).',
      'Grade interaction still open (Q-0011).',
    ],
    reportStatus: 'report',
    lastModified: '2026-05-22 14:05',
    relatedFindings: ['F-0048', 'F-0001'],
    relatedQuestions: ['Q-0011', 'Q-0003'],
    freshness: {
      parquetMtime: '2026-05-20 19:30',
      rowCounts: '902,441 rows',
      dateRange: '2026-04-01 → 2026-05-19',
    },
    figures: ['outputs/figures/bend_rate.png'],
    readme: feedRecheckReadme,
    report: feedRecheckReport,
  },
  {
    slug: 'experiments/2026-05-17_ingest_unify',
    title: 'Unified pressure-unit ingest',
    date: '2026-05-17',
    conclusions: [
      'All pressure normalized to kPa with recorded source unit (F-0046).',
      'Removes the silent bar→kPa switch behind F-0009.',
      'Downstream notebooks now read pressure_kpa.',
    ],
    reportStatus: 'report',
    lastModified: '2026-05-19 11:20',
    relatedFindings: ['F-0046', 'F-0009'],
    relatedQuestions: ['Q-0024'],
    freshness: {
      parquetMtime: '2026-05-17 16:44',
      rowCounts: '2,140,778 rows',
      dateRange: '2026-01-01 → 2026-05-16',
    },
    figures: [],
    readme:
      '# 2026-05-17_ingest_unify\n\nUnifies pressure units across the dataset.\n\n## Conclusions\n- Stores pressure_kpa + source_unit (F-0046).\n- Resolves Q-0024.\n- No figures; schema-only change.\n',
    report:
      '# REPORT — Pressure Unit Unification\n\n## Phenomenon\nPressure values jumped 100× mid-dataset with no schema flag (F-0009).\n\n## Variables\nSource unit (bar/kPa), ingest version.\n\n## Mechanism\nA logger config change switched units without a migration marker.\n\n## Countermeasures\nNew ingest records pressure_kpa plus source_unit. See F-0046.\n',
  },
  {
    slug: 'experiments/2026-04-24_thickness_model',
    title: 'Line 1 thickness variance model',
    date: '2026-04-24',
    conclusions: [
      'Roll-gap setpoint explains 71% of thickness variance (F-0034).',
      'Residual traces to entry temperature.',
      'Opens the entry-temp floor question (Q-0014).',
    ],
    reportStatus: 'report',
    outdated: true,
    lastModified: '2026-04-27 09:50',
    relatedFindings: ['F-0034'],
    relatedQuestions: ['Q-0014', 'Q-0033'],
    freshness: {
      parquetMtime: '2026-04-24 18:02',
      rowCounts: '1,002,330 rows (pre-dedup)',
      dateRange: '2026-03-01 → 2026-04-23',
    },
    figures: ['outputs/figures/bend_rate.png'],
    readme:
      '# 2026-04-24_thickness_model\n\nFits a variance model for Line 1 thickness.\n\n## Conclusions\n- Roll-gap explains 71% of variance (F-0034).\n- Entry temp is the dominant residual.\n- Opens Q-0014.\n',
    report:
      '# REPORT — Line 1 Thickness Variance\n\n## Phenomenon\nThickness variance on Line 1 is largely explained by roll-gap setpoint.\n\n## Variables\nroll_gap_mm (driver), entry_temp_c (residual).\n\n## Mechanism\nRoll-gap sets nominal thickness; entry temperature modulates recovery.\n\n## Countermeasures\nTune roll-gap PID; investigate entry-temp floor (Q-0014).\n\n> Note: fit on pre-dedup data (F-0038). Refit underway — see Q-0033.\n',
  },
  {
    slug: 'experiments/2026-04-16_segmentation_bench',
    title: 'Run-segmentation method benchmark',
    date: '2026-04-16',
    conclusions: [
      'PELT recovers boundaries within ±2 samples (F-0031).',
      'Fixed windows err by ±18 samples.',
      'Online latency feasibility still open (Q-0021).',
    ],
    reportStatus: 'report',
    lastModified: '2026-04-19 13:11',
    relatedFindings: ['F-0031'],
    relatedQuestions: ['Q-0021'],
    freshness: {
      parquetMtime: '2026-04-16 20:15',
      rowCounts: '418,205 rows',
      dateRange: '2026-04-01 → 2026-04-15',
    },
    figures: ['outputs/figures/trend.png'],
    readme:
      '# 2026-04-16_segmentation_bench\n\nBenchmarks PELT vs fixed-window segmentation.\n\n## Conclusions\n- PELT within ±2 samples (F-0031).\n- Fixed windows ±18 samples.\n- Online feasibility open (Q-0021).\n',
    report:
      '# REPORT — Segmentation Benchmark\n\n## Phenomenon\nFixed-window aggregation smears run boundaries.\n\n## Variables\nSegmentation method, penalty, cost model.\n\n## Mechanism\nPELT optimizes boundary placement globally under an RBF cost.\n\n## Countermeasures\nAdopt PELT for run-level aggregation (F-0031).\n',
  },
  {
    slug: 'experiments/2026-03-02_null_spike',
    title: 'Vibration null-burst exploration',
    date: '2026-03-02',
    conclusions: [
      'Null bursts at 06:00 and 18:00 (F-0012).',
      'Likely a PLC buffer flush at handover.',
      'Handed to handover review; no formal report.',
    ],
    reportStatus: 'exploration-only',
    lastModified: '2026-03-04 10:30',
    relatedFindings: ['F-0012'],
    relatedQuestions: ['Q-0006'],
    freshness: {
      parquetMtime: '2026-03-02 21:40',
      rowCounts: '221,904 rows',
      dateRange: '2026-02-20 → 2026-03-01',
    },
    figures: ['outputs/figures/trend.png'],
    readme: nullSpikeReadme,
  },
  {
    slug: 'experiments/2026-03-30_streak_explore',
    title: 'Drive-side streak defect scan',
    date: '2026-03-30',
    conclusions: [
      'Streak defects cluster on the drive side (F-0023).',
      'Possible link to delayed lubricant refills.',
      'Report not yet written.',
    ],
    reportStatus: 'missing',
    lastModified: '2026-04-02 16:18',
    relatedFindings: ['F-0023'],
    relatedQuestions: ['Q-0009'],
    freshness: {
      parquetMtime: '2026-03-30 17:55',
      rowCounts: '88,210 rows',
      dateRange: '2026-03-20 → 2026-03-29',
    },
    figures: [],
    readme:
      '# 2026-03-30_streak_explore\n\nScans surface-defect imaging for streak clusters.\n\n## Conclusions\n- Drive-side streak cluster confirmed (F-0023, hypothesis).\n- Possible lubricant-starvation link.\n- REPORT.md not yet written — see Q-0009.\n',
  },
];
