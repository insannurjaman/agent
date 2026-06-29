import {
  MessageSquare,
  Table2,
  FlaskConical,
  ArrowRightLeft,
  Share2,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

// Product order — Experiments is the primary landing page, Chat is second.
// This array is the single source of truth for desktop rail, expanded rail,
// collapsed rail, mobile drawer, and any quick-navigation surface.
export const navItems: NavItem[] = [
  { to: '/experiments', label: 'Experiments', icon: FlaskConical },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/in-out', label: 'In/Out', icon: ArrowRightLeft },
  { to: '/findings', label: 'Findings & Questions', icon: Table2 },
  { to: '/graph', label: 'Knowledge Graph', icon: Share2 },
];
