'use client';

/**
 * FileUpload — drag-and-drop Excel file upload with validation.
 * Parses .xlsx files client-side using the xlsx library.
 */

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FLIPKART_COLUMN_MAP } from '@/lib/constants';
import type { ImportRow } from '@/lib/validations/import';

interface FileUploadProps {
  onFileProcessed: (rows: ImportRow[], fileName: string) => void;
  isDisabled?: boolean;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ACCEPTED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export function FileUpload({ onFileProcessed, isDisabled }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!file.name.endsWith('.xlsx')) {
      return 'Only .xlsx files are supported. Please upload a valid Flipkart export.';
    }
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.endsWith('.xlsx')) {
      return 'Invalid file type. Only .xlsx files are accepted.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the 25MB limit.`;
    }
    return null;
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setProcessing(true);
      setFileName(file.name);

      try {
        const XLSX = await import('xlsx');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        // Read first worksheet
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          setError('No worksheets found in the file.');
          setProcessing(false);
          return;
        }

        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          defval: '',
        });

        if (rawData.length === 0) {
          setError('The spreadsheet is empty. No data rows found.');
          setProcessing(false);
          return;
        }

        // Map columns to our internal field names
        const mappedRows: ImportRow[] = rawData.map((raw) => {
          const mapped: Record<string, unknown> = {};

          for (const [excelCol, dbField] of Object.entries(FLIPKART_COLUMN_MAP)) {
            if (raw[excelCol] !== undefined && raw[excelCol] !== '') {
              mapped[dbField] = raw[excelCol];
            }
          }

          // Parse numeric fields
          const parseNum = (val: unknown): number => {
            if (typeof val === 'number') return val;
            const parsed = parseFloat(String(val).replace(/[^\d.-]/g, ''));
            return isNaN(parsed) ? 0 : parsed;
          };

          const parseInt2 = (val: unknown): number => {
            if (typeof val === 'number') return Math.floor(val);
            const parsed = parseInt(String(val).replace(/[^\d-]/g, ''), 10);
            return isNaN(parsed) ? 0 : parsed;
          };

          return {
            sku: String(mapped.sku || '').trim(),
            title: String(mapped.title || '').trim(),
            sellingPrice: parseNum(mapped.sellingPrice),
            currentStock: parseInt2(mapped.currentStock),
            mrp: mapped.mrp ? parseNum(mapped.mrp) : null,
            fsn: mapped.fsn ? String(mapped.fsn).trim() : null,
            listingId: mapped.listingId ? String(mapped.listingId).trim() : null,
            listingStatus: mapped.listingStatus ? String(mapped.listingStatus).trim() : null,
            hsnCode: mapped.hsnCode ? String(mapped.hsnCode).trim() : null,
            category: mapped.category ? String(mapped.category).trim() : null,
            systemStock: mapped.systemStock !== undefined ? parseInt2(mapped.systemStock) : null,
            fulfillmentBy: mapped.fulfillmentBy ? String(mapped.fulfillmentBy).trim() : null,
          };
        });

        onFileProcessed(mappedRows, file.name);
      } catch (err) {
        setError(
          `Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      } finally {
        setProcessing(false);
      }
    },
    [validateFile, onFileProcessed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset input so the same file can be re-selected
      e.target.value = '';
    },
    [processFile]
  );

  return (
    <Card>
      <CardContent className="p-6">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !processing && !isDisabled && fileInputRef.current?.click()}
          className={cn(
            'relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 transition-all duration-200 cursor-pointer',
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
            (processing || isDisabled) && 'opacity-60 cursor-not-allowed'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileSelect}
            className="hidden"
            disabled={processing || isDisabled}
          />

          {processing ? (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <FileSpreadsheet className="h-7 w-7 text-primary animate-pulse" />
              </div>
              <div className="text-center">
                <p className="font-medium">Processing {fileName}...</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reading and parsing spreadsheet data
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium">
                  Drop your Flipkart export here
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  or click to browse • .xlsx only • max 25MB
                </p>
              </div>
              <Button variant="outline" size="sm" disabled={isDisabled}>
                <FileSpreadsheet className="h-4 w-4" />
                Select File
              </Button>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">{error}</div>
            <button onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
