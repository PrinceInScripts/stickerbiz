/**
 * Zod validation schemas for Flipkart product import operations.
 */

import { z } from 'zod';

/**
 * Schema for a single row from the Flipkart export.
 * Used to validate each parsed row before import.
 */
export const importRowSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  title: z.string().min(1, 'Title is required'),
  sellingPrice: z.number().min(0, 'Selling price must be positive'),
  currentStock: z.number().int().min(0, 'Stock must be non-negative'),
  mrp: z.number().min(0).optional().nullable(),
  fsn: z.string().optional().nullable(),
  listingId: z.string().optional().nullable(),
  listingStatus: z.string().optional().nullable(),
  hsnCode: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  systemStock: z.number().int().optional().nullable(),
  fulfillmentBy: z.string().optional().nullable(),
});

export type ImportRow = z.infer<typeof importRowSchema>;

/**
 * Validated row with additional metadata for the preview UI.
 */
export type ImportPreviewRow = ImportRow & {
  rowIndex: number;
  action: 'create' | 'update' | 'skip' | 'invalid' | 'duplicate';
  errors?: string[];
  existingProductId?: string;
};

/**
 * Import summary returned after execution.
 */
export type ImportSummary = {
  totalRows: number;
  createdRows: number;
  updatedRows: number;
  skippedRows: number;
  failedRows: number;
  executionTime: number;
  errors: { row: number; sku: string; message: string }[];
  importHistoryId: string;
};
