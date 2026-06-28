/**
 * Import Server Actions — bulk product import from Flipkart exports.
 * Handles batch upsert with transaction safety and inventory logging.
 */

'use server';

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import type { ImportRow, ImportSummary } from '@/lib/validations/import';

const BATCH_SIZE = 100;

/**
 * Execute a bulk product import from validated rows.
 * Processes in batches of 100, rolls back only failed batches.
 */
export async function executeImport(
  rows: ImportRow[],
  fileName: string
): Promise<ImportSummary> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only admins can import products');
  }

  const startTime = Date.now();

  // Create import history record
  const importRecord = await db.importHistory.create({
    data: {
      fileName,
      uploadedById: user.id,
      marketplace: 'FLIPKART',
      totalRows: rows.length,
      status: 'PROCESSING',
    },
  });

  // Pre-fetch all existing SKUs in one query
  const skus = rows.map((r) => r.sku).filter(Boolean);
  const existingProducts = await db.product.findMany({
    where: { sku: { in: skus } },
    select: { id: true, sku: true, currentStock: true },
  });
  const existingMap = new Map(existingProducts.map((p) => [p.sku, p]));

  let createdRows = 0;
  let updatedRows = 0;
  let skippedRows = 0;
  let failedRows = 0;
  const errors: { row: number; sku: string; message: string }[] = [];

  // Process in batches
  const totalBatches = Math.ceil(rows.length / BATCH_SIZE);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batchStart = batchIndex * BATCH_SIZE;
    const batch = rows.slice(batchStart, batchStart + BATCH_SIZE);

    try {
      await db.$transaction(async (tx) => {
        for (let i = 0; i < batch.length; i++) {
          const row = batch[i];
          const globalRowIndex = batchStart + i + 1;

          try {
            // Skip rows with empty SKU
            if (!row.sku || !row.title) {
              skippedRows++;
              continue;
            }

            // Resolve category — create if it doesn't exist
            let categoryId: string | null = null;
            if (row.category && row.category.trim()) {
              const categorySlug = slugify(row.category.trim());
              const category = await tx.category.upsert({
                where: { slug: categorySlug },
                update: {},
                create: { name: row.category.trim(), slug: categorySlug },
              });
              categoryId = category.id;
            }

            const existing = existingMap.get(row.sku);

            if (existing) {
              // Update existing product
              const prevStock = existing.currentStock;
              const newStock = row.currentStock;

              await tx.product.update({
                where: { sku: row.sku },
                data: {
                  title: row.title,
                  sellingPrice: row.sellingPrice,
                  mrp: row.mrp ?? undefined,
                  currentStock: newStock,
                  systemStock: row.systemStock ?? undefined,
                  fsn: row.fsn || undefined,
                  listingId: row.listingId || undefined,
                  listingStatus: row.listingStatus || undefined,
                  hsnCode: row.hsnCode || undefined,
                  fulfillmentBy: row.fulfillmentBy || undefined,
                  categoryId: categoryId ?? undefined,
                  marketplace: 'FLIPKART',
                },
              });

              // Log stock change if different
              if (prevStock !== newStock) {
                await tx.inventoryLog.create({
                  data: {
                    productId: existing.id,
                    type: 'ADJUSTMENT',
                    quantity: newStock - prevStock,
                    prevStock,
                    newStock,
                    reference: `Import: ${fileName}`,
                    notes: `Bulk import stock sync from Flipkart export`,
                    userId: user.id,
                  },
                });
              }

              updatedRows++;
            } else {
              // Create new product
              const product = await tx.product.create({
                data: {
                  sku: row.sku,
                  title: row.title,
                  costPrice: 0,
                  sellingPrice: row.sellingPrice,
                  mrp: row.mrp ?? undefined,
                  currentStock: row.currentStock,
                  systemStock: row.systemStock ?? undefined,
                  fsn: row.fsn || undefined,
                  listingId: row.listingId || undefined,
                  listingStatus: row.listingStatus || undefined,
                  hsnCode: row.hsnCode || undefined,
                  fulfillmentBy: row.fulfillmentBy || undefined,
                  categoryId,
                  marketplace: 'FLIPKART',
                  reorderPoint: 10,
                },
              });

              // Log initial stock
              if (row.currentStock > 0) {
                await tx.inventoryLog.create({
                  data: {
                    productId: product.id,
                    type: 'PURCHASE',
                    quantity: row.currentStock,
                    prevStock: 0,
                    newStock: row.currentStock,
                    reference: `Import: ${fileName}`,
                    notes: `Initial stock from Flipkart import`,
                    userId: user.id,
                  },
                });
              }

              createdRows++;
            }
          } catch (rowError) {
            failedRows++;
            errors.push({
              row: globalRowIndex,
              sku: row.sku || 'N/A',
              message: rowError instanceof Error ? rowError.message : 'Unknown error',
            });
          }
        }
      });
    } catch (batchError) {
      // Entire batch failed — count all as failed
      const batchSize = batch.length;
      failedRows += batchSize;
      errors.push({
        row: batchStart + 1,
        sku: 'BATCH',
        message: `Batch ${batchIndex + 1} failed: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`,
      });
    }
  }

  const executionTime = Date.now() - startTime;
  const status = failedRows === 0 ? 'COMPLETED' : failedRows === rows.length ? 'FAILED' : 'PARTIAL';

  // Update import history
  await db.importHistory.update({
    where: { id: importRecord.id },
    data: {
      createdRows,
      updatedRows,
      skippedRows,
      failedRows,
      status,
      errorLog: errors.length > 0 ? JSON.stringify(errors) : null,
      executionTime,
      completedAt: new Date(),
    },
  });

  // Create system notification
  await db.notification.create({
    data: {
      userId: user.id,
      type: 'SYSTEM',
      title: 'Import Completed',
      message: `Imported ${createdRows + updatedRows} Flipkart products. Created: ${createdRows}, Updated: ${updatedRows}, Failed: ${failedRows}.`,
      link: '/dashboard/import',
    },
  });

  revalidatePath('/dashboard/products');
  revalidatePath('/dashboard/inventory');
  revalidatePath('/dashboard/import');

  return {
    totalRows: rows.length,
    createdRows,
    updatedRows,
    skippedRows,
    failedRows,
    executionTime,
    errors,
    importHistoryId: importRecord.id,
  };
}

/**
 * Check which SKUs already exist in the database.
 * Used for the preview screen before import.
 */
export async function checkExistingSkus(skus: string[]): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const existing = await db.product.findMany({
    where: { sku: { in: skus } },
    select: { sku: true },
  });
  return existing.map((p) => p.sku);
}

/**
 * Get paginated import history.
 */
export async function getImportHistory({
  page = 1,
  pageSize = 10,
}: { page?: number; pageSize?: number } = {}) {
  const [data, total] = await Promise.all([
    db.importHistory.findMany({
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.importHistory.count(),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get aggregate import statistics.
 */
export async function getImportStats() {
  const [totalImports, aggregates, lastImport] = await Promise.all([
    db.importHistory.count(),
    db.importHistory.aggregate({
      _sum: { createdRows: true, updatedRows: true },
    }),
    db.importHistory.findFirst({
      orderBy: { startedAt: 'desc' },
      select: { startedAt: true, status: true, fileName: true },
    }),
  ]);

  return {
    totalImports,
    totalProductsImported: (aggregates._sum.createdRows || 0) + (aggregates._sum.updatedRows || 0),
    totalCreated: aggregates._sum.createdRows || 0,
    totalUpdated: aggregates._sum.updatedRows || 0,
    lastImport,
  };
}
