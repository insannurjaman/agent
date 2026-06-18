import { useEffect, useState } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

// Thresholds align with Tailwind md (768) and xl (1280): <md mobile, md–xl tablet, >=xl desktop.
function compute(width: number): Breakpoint {
  if (width >= 1280) return 'desktop';
  if (width >= 768) return 'tablet';
  return 'mobile';
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() =>
    typeof window === 'undefined' ? 'desktop' : compute(window.innerWidth),
  );

  useEffect(() => {
    const onResize = () => setBp(compute(window.innerWidth));
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return bp;
}
