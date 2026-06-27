/**
 * StatCard — KPI display card for dashboard metrics.
 * Shows value, label, trend indicator, and icon.
 */

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number; // Percentage change
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'text-primary',
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change === undefined || change === 0;

  return (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1">
                {isPositive && (
                  <ArrowUpRight className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                )}
                {isNegative && (
                  <ArrowDownRight className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                )}
                {isNeutral && (
                  <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    'text-xs font-medium',
                    isPositive && 'text-green-600 dark:text-green-400',
                    isNegative && 'text-red-600 dark:text-red-400',
                    isNeutral && 'text-muted-foreground'
                  )}
                >
                  {isPositive && '+'}
                  {change?.toFixed(1)}%
                </span>
                {changeLabel && (
                  <span className="text-xs text-muted-foreground">
                    {changeLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted',
              iconColor
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
