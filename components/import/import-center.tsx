'use client';

/**
 * ImportCenter — client-side state orchestrator for the import flow.
 * Manages: idle → preview → importing → complete transitions.
 */

import { useState, useCallback } from 'react';
import { FileUpload } from '@/components/import/file-upload';
import { ImportPreview } from '@/components/import/import-preview';
import { ImportProgress } from '@/components/import/import-progress';
import { ImportReport } from '@/components/import/import-report';
import { executeImport, checkExistingSkus } from '@/actions/import';
import { toast } from 'sonner';
import type { ImportRow, ImportSummary } from '@/lib/validations/import';

type ImportState = 'idle' | 'preview' | 'importing' | 'complete';

export function ImportCenter() {
  const [state, setState] = useState<ImportState>('idle');
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [existingSkus, setExistingSkus] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  // Progress state
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState<
    'reading' | 'validating' | 'checking' | 'importing' | 'completed'
  >('reading');

  const handleFileProcessed = useCallback(
    async (rows: ImportRow[], name: string) => {
      setParsedRows(rows);
      setFileName(name);

      // Check existing SKUs
      setProgressStep('checking');
      try {
        const skus = rows.map((r) => r.sku).filter(Boolean);
        const existing = await checkExistingSkus(skus);
        setExistingSkus(existing);
        setState('preview');
      } catch (err) {
        toast.error('Failed to check existing products');
        console.error(err);
      }
    },
    []
  );

  const handleStartImport = useCallback(
    async (validRows: ImportRow[]) => {
      setState('importing');
      setProgress(10);
      setProgressStep('reading');

      try {
        // Simulate progress steps for UX
        setProgress(20);
        setProgressStep('validating');

        await new Promise((r) => setTimeout(r, 300));
        setProgress(40);
        setProgressStep('checking');

        await new Promise((r) => setTimeout(r, 300));
        setProgress(60);
        setProgressStep('importing');

        const summary = await executeImport(validRows, fileName);

        setProgress(100);
        setProgressStep('completed');
        setImportSummary(summary);

        await new Promise((r) => setTimeout(r, 800));
        setState('complete');

        if (summary.failedRows === 0) {
          toast.success(
            `Import complete! Created ${summary.createdRows}, updated ${summary.updatedRows} products.`
          );
        } else {
          toast.warning(
            `Import completed with ${summary.failedRows} errors. Check the report for details.`
          );
        }
      } catch (err) {
        toast.error(
          `Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
        setState('preview');
      }
    },
    [fileName]
  );

  const handleReset = useCallback(() => {
    setState('idle');
    setParsedRows([]);
    setExistingSkus([]);
    setFileName('');
    setImportSummary(null);
    setProgress(0);
    setProgressStep('reading');
  }, []);

  return (
    <div className="space-y-6">
      {state === 'idle' && (
        <FileUpload onFileProcessed={handleFileProcessed} />
      )}

      {state === 'preview' && (
        <ImportPreview
          rows={parsedRows}
          existingSkus={existingSkus}
          fileName={fileName}
          onStartImport={handleStartImport}
          onCancel={handleReset}
        />
      )}

      {state === 'importing' && (
        <ImportProgress
          progress={progress}
          step={progressStep}
        />
      )}

      {state === 'complete' && importSummary && (
        <ImportReport
          summary={importSummary}
          fileName={fileName}
          onImportAnother={handleReset}
        />
      )}
    </div>
  );
}
