// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProposalReviewDrawer } from './ProposalReviewDrawer';
import type { FindingProposal, QuestionProposal } from '../../data/chat';

const mockFindings: FindingProposal[] = [
  {
    findingId: 'F-0050',
    title: 'Bend rate correlates strongly with entry temperature above 180°C threshold',
    summary: 'Analysis of variance shows a statistically significant relationship between entry temperature and bend rate when temperature exceeds 180°C.',
    confidence: 'high',
    evidence: 'experiments/2026-06-17_roll_gap_variance/reports/analysis/regression_results.json',
    facets: ['temperature', 'bend-rate', 'threshold-analysis'],
    supersedes: 'F-0042',
    actionable: true,
    targetFile: 'experiments/2026-06-17_roll_gap_variance/findings/bend_rate_temperature.md',
    gateway: 'experiments/2026-06-17_roll_gap_variance/.gateway.yml',
  },
  {
    findingId: 'F-0051',
    title: 'Short title',
    summary: 'Brief summary text.',
    confidence: 'medium',
    evidence: 'experiments/2026-06-10_thickness_analysis/reports/summary.json',
    facets: ['thickness'],
    supersedes: undefined,
    actionable: false,
    targetFile: 'experiments/2026-06-10_thickness_analysis/findings/thickness_finding.md',
    gateway: 'experiments/2026-06-10_thickness_analysis/.gateway.yml',
  },
];

const mockQuestions: QuestionProposal[] = [
  {
    questionId: 'Q-0014',
    title: 'Does annealing temperature affect final bend rate?',
    priority: 'high',
    status: 'open',
    area: 'metallurgy',
    relatedFinding: 'F-0050',
    targetFile: 'experiments/2026-06-17_roll_gap_variance/questions/annealing_effect.md',
    gateway: 'experiments/2026-06-17_roll_gap_variance/.gateway.yml',
  },
];

function renderDrawer(props: Partial<Parameters<typeof ProposalReviewDrawer>[0]> = {}) {
  const onClose = vi.fn();
  const onConfirm = vi.fn();
  const result = render(
    <ProposalReviewDrawer
      set={{ findings: mockFindings, questions: mockQuestions }}
      onClose={onClose}
      onConfirm={onConfirm}
      {...props}
    />,
  );
  return { onClose, onConfirm, ...result };
}

describe('ProposalReviewDrawer', () => {
  beforeEach(() => {
    window.innerWidth = 1440;
    window.innerHeight = 900;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  function getDialog() {
    return screen.getByRole('dialog', { name: 'Review proposed updates' });
  }

  describe('positioning and layout', () => {
    it('renders a fixed-position panel', () => {
      renderDrawer();
      const dialog = getDialog();
      expect(dialog.className).toContain('fixed');
      expect(dialog.className).toContain('inset-y-0');
      expect(dialog.className).toContain('right-0');
    });

    it('never exceeds 100dvw width', () => {
      renderDrawer();
      const dialog = getDialog();
      expect(dialog.className).toContain('max-w-[100dvw]');
    });

    it('renders a backdrop overlay', () => {
      renderDrawer();
      const backdrops = document.querySelectorAll('button[aria-label="Close review drawer"]');
      // One backdrop + one close button = 2
      expect(backdrops.length).toBe(2);
    });

    it('has role="dialog" with aria-modal', () => {
      renderDrawer();
      const dialog = getDialog();
      expect(dialog.getAttribute('aria-modal')).toBe('true');
    });

    it('has accessible name via aria-label', () => {
      renderDrawer();
      const dialog = getDialog();
      expect(dialog.getAttribute('aria-label')).toBe('Review proposed updates');
    });
  });

  describe('header', () => {
    it('shows the title', () => {
      renderDrawer();
      expect(screen.getByText('Review proposed updates')).toBeTruthy();
    });

    it('has a visible close button with accessible label', () => {
      renderDrawer();
      // Use getAllByLabelText since backdrop and close button share the same label
      const closeBtns = screen.getAllByLabelText('Close review drawer');
      expect(closeBtns.length).toBeGreaterThanOrEqual(1);
    });

    it('calls onClose when header close button is clicked', async () => {
      const { onClose } = renderDrawer();
      const closeBtns = screen.getAllByLabelText('Close review drawer');
      // The last one is the header close button; the first is the backdrop
      const headerClose = closeBtns[closeBtns.length - 1];
      await userEvent.click(headerClose);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape is pressed', async () => {
      const { onClose } = renderDrawer();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('tabs', () => {
    it('shows tabs when multiple proposals exist', () => {
      renderDrawer();
      const tablist = screen.getByRole('tablist');
      const tabs = within(tablist).getAllByRole('tab');
      expect(tabs.length).toBe(3);
    });

    it('switches content when a different tab is clicked', async () => {
      renderDrawer();
      const tabs = screen.getAllByRole('tab');
      await userEvent.click(tabs[1]);
      expect(tabs[1].getAttribute('aria-selected')).toBe('true');
      expect(tabs[0].getAttribute('aria-selected')).toBe('false');
    });

    it('does not render tablist when there is only one proposal', () => {
      renderDrawer({ set: { findings: [mockFindings[0]], questions: [] } });
      expect(screen.queryByRole('tablist')).toBeNull();
    });
  });

  describe('footer actions', () => {
    it('renders Cancel button', () => {
      renderDrawer();
      expect(screen.getByText('Cancel')).toBeTruthy();
    });

    it('renders Ask agent to revise button', () => {
      renderDrawer();
      expect(screen.getByText('Ask agent to revise')).toBeTruthy();
    });

    it('renders full-width Confirm via agent button', () => {
      renderDrawer();
      const confirmBtn = screen.getByText('Confirm via agent');
      expect(confirmBtn.className).toContain('w-full');
    });

    it('Cancel calls onClose', async () => {
      const { onClose } = renderDrawer();
      await userEvent.click(screen.getByText('Cancel'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('Confirm calls onConfirm once', async () => {
      const { onConfirm } = renderDrawer();
      await userEvent.click(screen.getByText('Confirm via agent'));
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onConfirm).toHaveBeenCalledWith('finding', 'F-0050');
    });

    it('shows confirmed state after microtask resolves', async () => {
      renderDrawer();
      const confirmBtn = screen.getByText('Confirm via agent');
      await userEvent.click(confirmBtn);
      // queueMicrotask in handleConfirm resolves before React paints the
      // intermediate loading state, so the final "Confirmed" is visible
      expect(screen.getByText('Confirmed')).toBeTruthy();
    });

    it('Cancel button is not disabled during loading', async () => {
      renderDrawer();
      await userEvent.click(screen.getByText('Confirm via agent'));
      const cancelBtn = screen.getByText('Cancel');
      expect(cancelBtn).not.toBeDisabled();
    });
  });

  describe('content wrapping', () => {
    it('renders finding fields with long text', () => {
      renderDrawer();
      expect(screen.getByText(mockFindings[0].title)).toBeTruthy();
      expect(screen.getByText(mockFindings[0].summary)).toBeTruthy();
    });

    it('renders facet chips that wrap', () => {
      renderDrawer();
      expect(screen.getByText('temperature')).toBeTruthy();
      expect(screen.getByText('bend-rate')).toBeTruthy();
    });

    it('renders evidence path', () => {
      renderDrawer();
      expect(screen.getByText(mockFindings[0].evidence)).toBeTruthy();
    });

    it('renders target file path', () => {
      renderDrawer();
      expect(screen.getByText('Target')).toBeTruthy();
    });

    it('renders supersedes when present', () => {
      renderDrawer();
      expect(screen.getByText('F-0042')).toBeTruthy();
    });

    it('shows "none" for supersedes when undefined', async () => {
      renderDrawer();
      // Switch to F-0051 tab (no supersedes) to see "none"
      const tabs = screen.getAllByRole('tab');
      await userEvent.click(tabs[1]);
      expect(screen.getByText('none')).toBeTruthy();
    });
  });

  describe('information hierarchy', () => {
    it('shows section labels', () => {
      renderDrawer();
      expect(screen.getByText('Proposed fields')).toBeTruthy();
      expect(screen.getByText('Target')).toBeTruthy();
      expect(screen.getByText('Gateway')).toBeTruthy();
      expect(screen.getByText('Execution')).toBeTruthy();
    });
  });

  describe('confirmation states', () => {
    it('starts in idle state', () => {
      renderDrawer();
      expect(screen.getByText('Confirm via agent')).toBeTruthy();
    });
  });

  describe('responsive behavior', () => {
    it('uses full width on small viewports', () => {
      window.innerWidth = 390;
      renderDrawer();
      const dialog = getDialog();
      expect(dialog.className).toContain('w-full');
    });

    it('uses clamped width on larger viewports', () => {
      window.innerWidth = 1440;
      renderDrawer();
      const dialog = getDialog();
      expect(dialog.className).toContain('sm:w-[clamp(440px,32vw,520px)]');
    });
  });

  describe('question fields', () => {
    it('renders question fields when a question tab is active', async () => {
      renderDrawer();
      const tabs = screen.getAllByRole('tab');
      await userEvent.click(tabs[2]);
      expect(screen.getByText(mockQuestions[0].title)).toBeTruthy();
      expect(screen.getByText(mockQuestions[0].area)).toBeTruthy();
    });

    it('renders priority badge for questions', async () => {
      renderDrawer();
      const tabs = screen.getAllByRole('tab');
      await userEvent.click(tabs[2]);
      expect(screen.getByText('high')).toBeTruthy();
    });
  });
});
