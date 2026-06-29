import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn } from '../ui/utils';

interface RowMenuProps {
  id: string;
  isQuestion?: boolean;
}

export function RowMenu({ id, isQuestion }: RowMenuProps) {
  const navigate = useNavigate();
  const copyId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(id);
    } catch {
      /* ok */
    }
  }, [id]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'flex size-8 items-center justify-center rounded-sm text-text-muted hover:text-text hover:bg-surface-hover transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
          aria-label="Row actions"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="font-mono text-[12px]">
        <DropdownMenuItem onClick={() => navigate(`/graph?focus=${id}`)}>View in Graph</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/in-out?focus=${id}`)}>View Lineage</DropdownMenuItem>
        <DropdownMenuItem onClick={copyId}>Copy ID</DropdownMenuItem>
        <DropdownMenuItem className="text-brand" onClick={() => navigate(`/chat?ctx=${id}`)}>
          {isQuestion ? 'Ask Claude to resolve' : 'Ask Claude about this'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}