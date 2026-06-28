'use client';

/**
 * ImportProgress — live progress display during import execution.
 * Shows step labels, animated progress bar, and real-time counters.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, FileSpreadsheet, Search, Upload, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportProgressProps {
  progress: number; // 0–100
  step: 'reading' | 'validating' | 'checking' | 'importing' | 'completed';
  currentBatch?: number;
  totalBatches?: number;
  created?: number;
  updated?: number;
  skipped?: number;
  failed?: number;
}

const STEPS = [
  { key: 'reading', label: 'Reading File', icon: FileSpreadsheet, pct: 10 },
  { key: 'validating', label: 'Validating Data', icon: Search, pct: 35 },
  { key: 'checking', label: 'Checking Existing Products', icon: Search, pct: 60 },
  { key: 'importing', label: 'Importing Products', icon: Upload, pct: 92 },
  { key: 'completed', label: 'Completed', icon: PartyPopper, pct: 100 },
] as const;

export function ImportProgress({
  progress,
  step,
  currentBatch,
  totalBatches,
  created = 0,
  updated = 0,
  skipped = 0,
  failed = 0,
}: ImportProgressProps) {
  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <Card className="animate-fade-in">
      <CardContent className="p-8">
        <div className="space-y-8">
          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {step === 'completed' ? 'Import Complete!' : 'Importing...'}
              </p>
              <p className="text-sm font-bold text-primary">{Math.round(progress)}%</p>
            </div>
            <Progress value={progress} className="h-3" />
            {currentBatch !== undefined && totalBatches !== undefined && step === 'importing' && (
              <p className="text-xs text-muted-foreground text-center">
                Processing batch {currentBatch} of {totalBatches}
              </p>
            )}
          </div>

          {/* Steps */}
          <div className="flex items-center justify-between gap-2">
            {STEPS.map((s, index) => {
              const isActive = s.key === step;
              const isComplete = index < currentStepIndex;
              const Icon = s.icon;

              return (
                <div
                  key={s.key}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-2 rounded-xl p-3 transition-all',
                    isActive && 'bg-primary/5',
                    isComplete && 'opacity-60'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full transition-all',
                      isActive && 'bg-primary text-primary-foreground',
                      isComplete && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                      !isActive && !isComplete && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : isActive && step !== 'completed' ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium text-center',
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Live Counters */}
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-xl bg-green-50 dark:bg-green-950/20 p-4 text-center">
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{created}</p>
              <p className="text-xs text-muted-foreground mt-1">Created</p>
            </div>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 p-4 text-center">
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{updated}</p>
              <p className="text-xs text-muted-foreground mt-1">Updated</p>
            </div>
            <div className="rounded-xl bg-yellow-50 dark:bg-yellow-950/20 p-4 text-center">
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{skipped}</p>
              <p className="text-xs text-muted-foreground mt-1">Skipped</p>
            </div>
            <div className="rounded-xl bg-red-50 dark:bg-red-950/20 p-4 text-center">
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{failed}</p>
              <p className="text-xs text-muted-foreground mt-1">Failed</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
