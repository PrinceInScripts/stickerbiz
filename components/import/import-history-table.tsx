'use client';

/**
 * ImportHistoryTable — displays past imports with status and stats.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { IMPORT_STATUS_CONFIG } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';
import { History, FileSpreadsheet } from 'lucide-react';

type ImportHistoryEntry = {
  id: string;
  fileName: string;
  marketplace: string;
  totalRows: number;
  createdRows: number;
  updatedRows: number;
  skippedRows: number;
  failedRows: number;
  status: string;
  executionTime: number | null;
  startedAt: Date | string;
  completedAt: Date | string | null;
  uploadedBy: { id: string; name: string };
};

interface ImportHistoryTableProps {
  data: ImportHistoryEntry[];
  total: number;
}

export function ImportHistoryTable({ data, total }: ImportHistoryTableProps) {
  const formatTime = (ms: number | null) => {
    if (ms === null) return '—';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <EmptyState
            icon={<History className="h-6 w-6 text-muted-foreground" />}
            title="No imports yet"
            description="Upload your first Flipkart export to see import history here."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          Import History
          <span className="text-xs font-normal text-muted-foreground">({total} imports)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">File</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Created</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Updated</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Failed</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDateTime(entry.startedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-600 shrink-0" />
                      <span className="truncate max-w-[200px]">{entry.fileName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{entry.totalRows}</td>
                  <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">{entry.createdRows}</td>
                  <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">{entry.updatedRows}</td>
                  <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">{entry.failedRows}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={entry.status} config={IMPORT_STATUS_CONFIG} />
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatTime(entry.executionTime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
