/**
 * Inventory Server Actions — stock management, adjustments, and audit logs.
 */

'use server';

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { stockAdjustmentSchema } from '@/lib/validations/inventory';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from '@/types';

/**
 * Adjust stock manually with reason logging.
 */
export async function adjustStock(
  data: Record<string, unknown>
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user || user.role === 'VIEWER') {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = stockAdjustmentSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { productId, quantity, type, notes } = parsed.data;

  try {
    await db.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { currentStock: true },
      });

      if (!product) throw new Error('Product not found');

      const newStock = product.currentStock + quantity;
      if (newStock < 0) {
        throw new Error('Stock cannot go below zero');
      }

      await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      await tx.inventoryLog.create({
        data: {
          productId,
          type,
          quantity,
          prevStock: product.currentStock,
          newStock,
          notes,
          userId: user.id,
        },
      });

      // Check for low stock notification
      if (newStock <= 5 && product.currentStock > 5) {
        const prod = await tx.product.findUnique({
          where: { id: productId },
          select: { title: true, sku: true },
        });
        await tx.notification.create({
          data: {
            type: 'LOW_STOCK',
            title: 'Low Stock Alert',
            message: `${prod!.title} (${prod!.sku}) is running low — ${newStock} units remaining`,
            link: `/dashboard/products/${productId}`,
          },
        });
      }
    });

    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/products');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to adjust stock.' };
  }
}

/**
 * Get inventory logs with filtering.
 */
export async function getInventoryLogs({
  page = 1,
  pageSize = 50,
  productId,
  type,
}: {
  page?: number;
  pageSize?: number;
  productId?: string;
  type?: string;
} = {}) {
  const where: Record<string, unknown> = {};
  if (productId) where.productId = productId;
  if (type) where.type = type;

  const [data, total] = await Promise.all([
    db.inventoryLog.findMany({
      where: where as any,
      include: {
        product: { select: { id: true, sku: true, title: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.inventoryLog.count({ where: where as any }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/**
 * Get low stock products.
 */
export async function getLowStockProducts() {
  return db.product.findMany({
    where: {
      isActive: true,
      currentStock: { lte: db.product.fields.reorderPoint as unknown as number || 10 },
    },
    include: {
      category: { select: { name: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { currentStock: 'asc' },
    take: 20,
  });
}

/**
 * Get inventory summary statistics.
 */
export async function getInventoryStats() {
  const products = await db.product.findMany({
    where: { isActive: true },
    select: { currentStock: true, reservedStock: true, costPrice: true, sellingPrice: true, reorderPoint: true },
  });

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.currentStock, 0);
  const totalReserved = products.reduce((sum, p) => sum + p.reservedStock, 0);
  const totalCostValue = products.reduce(
    (sum, p) => sum + p.currentStock * Number(p.costPrice),
    0
  );
  const totalRetailValue = products.reduce(
    (sum, p) => sum + p.currentStock * Number(p.sellingPrice),
    0
  );
  const outOfStock = products.filter((p) => p.currentStock === 0).length;
  const lowStock = products.filter(
    (p) => p.currentStock > 0 && p.currentStock <= p.reorderPoint
  ).length;

  return {
    totalProducts,
    totalStock,
    totalReserved,
    totalCostValue,
    totalRetailValue,
    outOfStock,
    lowStock,
    healthyStock: totalProducts - outOfStock - lowStock,
  };
}
