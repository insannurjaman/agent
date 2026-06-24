import type { Finding, OpenQuestion } from '../../data';

export function getThisWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(now);
  start.setDate(now.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return { start, end: now };
}

export function isDateInThisWeek(dateStr: string): boolean {
  const { start, end } = getThisWeekBounds();
  const d = new Date(dateStr);
  return d >= start && d <= end;
}

export function countThisWeek(findings: Finding[], questions: OpenQuestion[]): number {
  return (
    findings.filter((f) => isDateInThisWeek(f.date)).length +
    questions.filter((q) => isDateInThisWeek(q.raisedDate)).length
  );
}
