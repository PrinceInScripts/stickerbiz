'use client';

/**
 * ImportPreview — preview table with row validation and action indicators.
 * Shows parsed rows before import, color-coded by action type.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatCard } from '@/components/shared/stat-card';
import {
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Plus,
  RefreshCw,
  X,
  Play,
  ArrowLeft,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { importRowSchema } from '@/lib/validations/import';
import type { ImportRow, ImportPreviewRow } from '@/lib/validations/import';

interface ImportPreviewProps {
  rows: ImportRow[];
  existingSkus: string[];
  fileName: string;
  onStartImport: (validRows: ImportRow[]) => void;
  onCancel: () => void;
}

const ACTION_STYLES = {
  create: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    label: 'New',
  },
  update: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    label: 'Update',
  },
  duplicate: {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    label: 'Duplicate',
  },
  invalid: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    label: 'Invalid',
  },
  skip: {
    bg: 'bg-gray-50 dark:bg-gray-950/20',
    badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    label: 'Skip',
  },
} as const;

export function ImportPreview({
  rows,
  existingSkus,
  fileName,
  onStartImport,
  onCancel,
}: ImportPreviewProps) {
  const existingSet = useMemo(() => new Set(existingSkus), [existingSkus]);

  const previewRows: ImportPreviewRow[] = useMemo(() => {
    const seenSkus = new Set<string>();

    return rows.map((row, index) => {
      // Validate with Zod
      const result = importRowSchema.safeParse(row);

      if (!result.success) {
        const errors = result.error.issues.map((i) => i.message);
        return { ...row, rowIndex: index + 1, action: 'invalid' as const, errors };
      }

      // Check for empty SKU
      if (!row.sku || !row.sku.trim()) {
        return {
          ...row,
          rowIndex: index + 1,
          action: 'invalid' as const,
          errors: ['SKU is required'],
        };
      }

      // Check for duplicate within file
      if (seenSkus.has(row.sku)) {
        return { ...row, rowIndex: index + 1, action: 'duplicate' as const };
      }
      seenSkus.add(row.sku);

      // Check if existing in DB
      if (existingSet.has(row.sku)) {
        return { ...row, rowIndex: index + 1, action: 'update' as const };
      }

      return { ...row, rowIndex: index + 1, action: 'create' as const };
    });
  }, [rows, existingSet]);

  const summary = useMemo(() => {
    const counts = { total: previewRows.length, valid: 0, invalid: 0, create: 0, update: 0, duplicate: 0, skip: 0 };
    for (const row of previewRows) {
      if (row.action === 'create') { counts.create++; counts.valid++; }
      else if (row.action === 'update') { counts.update++; counts.valid++; }
      else if (row.action === 'duplicate') { counts.duplicate++; }
      else if (row.action === 'invalid') { counts.invalid++; }
      else { counts.skip++; }
    }
    return counts;
  }, [previewRows]);

  const validRows = useMemo(
    () => previewRows.filter((r) => r.action === 'create' || r.action === 'update'),
    [previewRows]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* File Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{fileName}</p>
            <p className="text-sm text-muted-foreground">{summary.total} rows detected</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={() => onStartImport(validRows)}
            disabled={summary.valid === 0}
          >
            <Play className="h-4 w-4" />
            Import {summary.valid} Products
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard title="Total Rows" value={summary.total} icon={FileSpreadsheet} />
        <StatCard title="Valid" value={summary.valid} icon={CheckCircle} iconColor="text-green-600" />
        <StatCard title="Invalid" value={summary.invalid} icon={AlertTriangle} iconColor="text-red-600" />
        <StatCard title="New Products" value={summary.create} icon={Plus} iconColor="text-green-600" />
        <StatCard title="To Update" value={summary.update} icon={RefreshCw} iconColor="text-blue-600" />
        <StatCard title="Duplicates" value={summary.duplicate} icon={X} iconColor="text-orange-600" />
      </div>

      {/* Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">#</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Price</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Stock</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">FSN</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewRows.map((row) => {
                    const style = ACTION_STYLES[row.action];
                    return (
                      <tr key={row.rowIndex} className={cn('transition-colors', style.bg)}>
                        <td className="px-4 py-2.5 text-muted-foreground">{row.rowIndex}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{row.sku || '—'}</td>
                        <td className="px-4 py-2.5 max-w-[200px] truncate">{row.title || '—'}</td>
                        <td className="px-4 py-2.5 text-right">{formatCurrency(row.sellingPrice)}</td>
                        <td className="px-4 py-2.5 text-right">{row.currentStock}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.fsn || '—'}</td>
                        <td className="px-4 py-2.5 text-xs">{row.category || '—'}</td>
                        <td className="px-4 py-2.5 text-xs">{row.listingStatus || '—'}</td>
                        <td className="px-4 py-2.5 text-center">
                          <Badge className={cn('text-[10px]', style.badge)} variant="secondary">
                            {style.label}
                          </Badge>
                          {row.errors && (
                            <p className="mt-1 text-[10px] text-destructive">{row.errors.join(', ')}</p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
