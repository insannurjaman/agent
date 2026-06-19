import {
  LayoutGrid,
  Table2,
  FlaskConical,
  SlidersHorizontal,
  Share2,
  GitBranch,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { to: '/overview', label: 'Overview', icon: LayoutGrid },
  { to: '/chat', label: 'Chat Workspace', icon: MessageSquare },
  { to: '/findings', label: 'Findings & Questions', icon: Table2 },
  { to: '/experiments', label: 'Experiments & Reports', icon: FlaskConical },
  { to: '/search', label: 'Faceted Search', icon: SlidersHorizontal },
  { to: '/graph', label: 'Knowledge Graph', icon: Share2 },
  { to: '/lineage', label: 'Lineage', icon: GitBranch },
];
