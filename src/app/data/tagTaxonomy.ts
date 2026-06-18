import type { FacetDimension } from './types';

// knowledge/tag_taxonomy.csv — 6 controlled-vocabulary dimensions, 40 terms.
export const facetDimensions: FacetDimension[] = [
  {
    id: 'process',
    label: 'Process',
    terms: ['rolling', 'lubrication', 'handover', 'annealing', 'coiling', 'inspection', 'calibration'],
  },
  {
    id: 'equipment',
    label: 'Equipment Variables',
    terms: ['feed-drive', 'roll-gap', 'thickness-gauge', 'vibration-sensor', 'pressure-sensor', 'lubricant-tank'],
  },
  {
    id: 'phenomena',
    label: 'Phenomena',
    terms: ['bending', 'vibration', 'drift', 'surface-defect', 'thermal', 'instability'],
  },
  {
    id: 'quality',
    label: 'Quality Labels',
    terms: ['reject-rate', 'thickness', 'surface-grade', 'yield', 'rework'],
  },
  {
    id: 'method',
    label: 'Methods',
    terms: ['audit', 'changepoint', 'normalization', 'segmentation', 'regression', 'imaging', 'sweep'],
  },
  {
    id: 'data-quality',
    label: 'Data Quality',
    terms: ['schema-drift', 'missingness', 'duplication', 'units', 'bias', 'segmentation', 'latency'],
  },
];
