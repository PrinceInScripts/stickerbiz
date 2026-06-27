/**
 * StatusBadge — color-coded badge for order statuses and stock levels.
 * Uses the configuration objects from constants.ts.
 */

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  config: Record<string, { label: string; color: string }>;
  className?: string;
}

export function StatusBadge({ status, config, className }: StatusBadgeProps) {
  const statusConfig = config[status] || {
    label: status,
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusConfig.color,
        className
      )}
    >
      {statusConfig.label}
    </span>
  );
}
