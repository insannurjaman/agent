import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../ui/utils';
import { navItems, type NavItem } from './navItems';

const STORAGE_KEY = 'qas.navrail.expanded';

// Group the flat nav into scannable sections (referenced by route).
const GROUPS: { label: string; routes: string[] }[] = [
  { label: 'Knowledge', routes: ['/overview', '/findings', '/experiments', '/search', '/graph', '/lineage'] },
  { label: 'Workspace', routes: ['/chat'] },
  { label: 'System', routes: ['/status'] },
];

const byRoute = new Map(navItems.map((i) => [i.to, i]));
const SECTIONS = GROUPS.map((g) => ({
  label: g.label,
  items: g.routes.map((r) => byRoute.get(r)).filter(Boolean) as NavItem[],
}));

export function NavRail() {
  const [expanded, setExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, expanded ? '1' : '0');
  }, [expanded]);

  return (
    <nav
      className={cn(
        'flex h-full shrink-0 flex-col border-r border-border-subtle bg-surface py-2 transition-[width] duration-200 ease-out',
        expanded ? 'w-60 px-2' : 'w-14 px-2',
      )}
    >
      <TooltipProvider delayDuration={150}>
        <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
          {SECTIONS.map((section, si) => (
            <div key={section.label} className={cn(si > 0 && 'mt-2')}>
              {/* Section header (expanded) / divider (collapsed) */}
              {expanded ? (
                <div className="px-2 pb-1 pt-2 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  {section.label}
                </div>
              ) : (
                si > 0 && <div className="mx-2 my-1.5 border-t border-border-subtle" />
              )}

              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <RailItem key={item.to} item={item} expanded={expanded} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer collapse / expand toggle */}
        <div className="mt-2 border-t border-border-subtle pt-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            className={cn(
              'flex h-11 w-full items-center rounded-md text-text-muted outline-none transition-colors hover:bg-surface-2 hover:text-text-secondary focus-visible:ring-1 focus-visible:ring-brand-ring',
              !expanded && 'justify-center',
            )}
          >
            <span className="flex w-9 shrink-0 items-center justify-center">
              {expanded ? (
                <ChevronsLeft className="size-[18px]" strokeWidth={1.75} />
              ) : (
                <ChevronsRight className="size-[18px]" strokeWidth={1.75} />
              )}
            </span>
            {expanded && <span className="font-mono text-[11px] uppercase tracking-wider">Collapse</span>}
          </button>
        </div>
      </TooltipProvider>
    </nav>
  );
}

function RailItem({ item, expanded }: { item: NavItem; expanded: boolean }) {
  const { to, label, icon: Icon } = item;

  const link = (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'group relative flex h-11 items-center rounded-md outline-none transition-colors focus-visible:ring-1 focus-visible:ring-brand-ring',
          isActive ? 'bg-brand-muted text-text' : 'text-text-muted hover:bg-surface-2/60 hover:text-text-secondary',
          !expanded && 'justify-center',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-brand" />}
          {/* Fixed icon column keeps icons aligned across collapsed/expanded */}
          <span className="flex w-9 shrink-0 items-center justify-center">
            <Icon className={cn('size-[18px]', isActive && 'text-brand')} strokeWidth={1.75} />
          </span>
          <span
            className={cn(
              'truncate whitespace-nowrap text-[13px] transition-[opacity,transform] duration-200',
              expanded ? 'translate-x-0 opacity-100' : 'pointer-events-none w-0 -translate-x-1 opacity-0',
            )}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );

  // Tooltips only add value when collapsed (labels are hidden).
  if (expanded) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" className="font-mono text-[12px]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
