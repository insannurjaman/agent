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

export const navItems: NavItem[] = [
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/experiments', label: 'Experiments', icon: FlaskConical },
  { to: '/in-out', label: 'In/Out', icon: ArrowRightLeft },
  { to: '/findings', label: 'Findings & Questions', icon: Table2 },
  { to: '/graph', label: 'Knowledge Graph', icon: Share2 },
];
