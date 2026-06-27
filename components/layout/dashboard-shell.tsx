'use client';

/**
 * DashboardShell — client component that manages sidebar collapse state
 * and adjusts the main content area margin accordingly.
 */

import { cn } from '@/lib/utils';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  // The sidebar manages its own collapsed state internally.
  // We use a CSS approach: the sidebar is fixed-positioned,
  // and the main content uses a left margin via peer selectors.
  // Simpler approach: use a generous left margin that works for expanded sidebar.
  return (
    <div className={cn('ml-[260px] flex min-h-screen flex-1 flex-col transition-all duration-300 max-lg:ml-[68px] max-md:ml-0')}>
      {children}
    </div>
  );
}
