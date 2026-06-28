'use client';

/**
 * ImportReport — post-import summary with stats and CSV download.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/shared/stat-card';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  Upload,
  Clock,
  FileSpreadsheet,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImportSummary } from '@/lib/validations/import';

interface ImportReportProps {
  summary: ImportSummary;
  fileName: string;
  onImportAnother: () => void;
}

export function ImportReport({ summary, fileName, onImportAnother }: ImportReportProps) {
  const isSuccess = summary.failedRows === 0;
  const isPartial = summary.failedRows > 0 && summary.failedRows < summary.totalRows;

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const downloadCSV = () => {
    const headers = ['Row', 'SKU', 'Error'];
    const csvRows = [
      headers.join(','),
      ...summary.errors.map((e) =>
        [e.row, `"${e.sku}"`, `"${e.message.replace(/"/g, '""')}"`].join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Status Banner */}
      <Card
        className={cn(
          'border-2',
          isSuccess && 'border-green-200 dark:border-green-900',
          isPartial && 'border-yellow-200 dark:border-yellow-900',
          !isSuccess && !isPartial && 'border-red-200 dark:border-red-900'
        )}
      >
        <CardContent className="flex items-center gap-4 p-6">
          <div
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
              isSuccess && 'bg-green-100 dark:bg-green-900/30',
              isPartial && 'bg-yellow-100 dark:bg-yellow-900/30',
              !isSuccess && !isPartial && 'bg-red-100 dark:bg-red-900/30'
            )}
          >
            {isSuccess ? (
              <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
            ) : isPartial ? (
              <AlertTriangle className="h-7 w-7 text-yellow-600 dark:text-yellow-400" />
            ) : (
              <XCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">
              {isSuccess
                ? 'Import completed successfully!'
                : isPartial
                ? 'Import completed with some errors'
                : 'Import failed'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {fileName} • {summary.createdRows + summary.updatedRows} products processed in{' '}
              {formatTime(summary.executionTime)}
            </p>
          </div>
          <div className="flex gap-2">
            {summary.errors.length > 0 && (
              <Button variant="outline" size="sm" onClick={downloadCSV}>
                <Download className="h-4 w-4" />
                Error Report
              </Button>
            )}
            <Button onClick={onImportAnother}>
              <Upload className="h-4 w-4" />
              Import Another
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard title="Total Rows" value={summary.totalRows} icon={FileSpreadsheet} />
        <StatCard title="Created" value={summary.createdRows} icon={Plus} iconColor="text-green-600" />
        <StatCard title="Updated" value={summary.updatedRows} icon={RefreshCw} iconColor="text-blue-600" />
        <StatCard title="Skipped" value={summary.skippedRows} icon={AlertTriangle} iconColor="text-yellow-600" />
        <StatCard title="Failed" value={summary.failedRows} icon={XCircle} iconColor="text-red-600" />
        <StatCard title="Duration" value={formatTime(summary.executionTime)} icon={Clock} />
      </div>

      {/* Error Details */}
      {summary.errors.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h4 className="font-medium mb-4">Error Details ({summary.errors.length})</h4>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {summary.errors.map((error, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg bg-destructive/5 p-3 text-sm"
                >
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div>
                    <span className="font-medium">Row {error.row}</span>
                    {error.sku !== 'BATCH' && (
                      <span className="text-muted-foreground"> ({error.sku})</span>
                    )}
                    <span className="text-muted-foreground"> — {error.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
