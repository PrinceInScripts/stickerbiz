/**
 * Product Server Actions — full CRUD with inventory integration.
 */

'use server';

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { productSchema } from '@/lib/validations/product';
import { generateSKU, slugify } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from '@/types';

/**
 * Get paginated products with filtering and sorting.
 */
export async function getProducts({
  page = 1,
  pageSize = 20,
  search,
  category,
  marketplace,
  stockStatus,
  sortBy = 'createdAt',
  sortDirection = 'desc',
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  marketplace?: string;
  stockStatus?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
} = {}) {
  const where: Record<string, unknown> = { isActive: true };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { fsn: { contains: search, mode: 'insensitive' } },
      { barcode: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (category) where.categoryId = category;
  if (marketplace) where.marketplace = marketplace;

  if (stockStatus === 'out_of_stock') {
    where.currentStock = 0;
  } else if (stockStatus === 'low_stock') {
    where.currentStock = { gt: 0, lte: 10 };
  } else if (stockStatus === 'in_stock') {
    where.currentStock = { gt: 10 };
  }

  const [data, total] = await Promise.all([
    db.product.findMany({
      where: where as any,
      include: {
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { [sortBy]: sortDirection },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.product.count({ where: where as any }),
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
 * Get a single product by ID with all relations.
 */
export async function getProductById(id: string) {
  return db.product.findUnique({
    where: { id },
    include: {
      brand: true,
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      inventoryLogs: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { user: { select: { name: true } } },
      },
    },
  });
}

/**
 * Create a new product.
 */
export async function createProduct(
  data: Record<string, unknown>
): Promise<ActionResponse<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user || user.role === 'VIEWER') {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const values = parsed.data;

  // Generate SKU if not provided
  const sku = values.sku || generateSKU(values.marketplace);

  try {
    const product = await db.product.create({
      data: {
        ...values,
        sku,
        costPrice: values.costPrice,
        sellingPrice: values.sellingPrice,
      },
    });

    // Log initial stock if > 0
    if (values.currentStock > 0) {
      await db.inventoryLog.create({
        data: {
          productId: product.id,
          type: 'ADJUSTMENT',
          quantity: values.currentStock,
          prevStock: 0,
          newStock: values.currentStock,
          notes: 'Initial stock on product creation',
          userId: user.id,
        },
      });
    }

    revalidatePath('/dashboard/products');
    revalidatePath('/dashboard/inventory');
    return { success: true, data: { id: product.id } };
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return { success: false, error: 'A product with this SKU, FSN, or barcode already exists.' };
    }
    return { success: false, error: 'Failed to create product.' };
  }
}

/**
 * Update an existing product.
 */
export async function updateProduct(
  id: string,
  data: Record<string, unknown>
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user || user.role === 'VIEWER') {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const values = parsed.data;

  try {
    // Get current stock to detect manual changes
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Product not found' };

    await db.product.update({
      where: { id },
      data: {
        title: values.title,
        fsn: values.fsn,
        description: (data.description as string) || null,
        brandId: values.brandId || null,
        categoryId: values.categoryId || null,
        theme: values.theme || null,
        costPrice: values.costPrice,
        sellingPrice: values.sellingPrice,
        reorderPoint: values.reorderPoint,
        barcode: values.barcode || null,
        shelfLocation: values.shelfLocation || null,
        marketplace: values.marketplace,
        isActive: values.isActive,
      },
    });

    revalidatePath('/dashboard/products');
    revalidatePath(`/dashboard/products/${id}`);
    return { success: true };
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return { success: false, error: 'Duplicate SKU, FSN, or barcode.' };
    }
    return { success: false, error: 'Failed to update product.' };
  }
}

/**
 * Delete a product (soft delete by setting isActive = false).
 */
export async function deleteProduct(id: string): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return { success: false, error: 'Only admins can delete products.' };
  }

  await db.product.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath('/dashboard/products');
  return { success: true };
}

/**
 * Get all categories for select dropdowns.
 */
export async function getCategories() {
  return db.category.findMany({ orderBy: { name: 'asc' } });
}

/**
 * Create a new category.
 */
export async function createCategory(name: string): Promise<ActionResponse<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user || user.role === 'VIEWER') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const category = await db.category.create({
      data: { name, slug: slugify(name) },
    });
    return { success: true, data: { id: category.id } };
  } catch {
    return { success: false, error: 'Category already exists.' };
  }
}

/**
 * Get all brands for select dropdowns.
 */
export async function getBrands() {
  return db.brand.findMany({ orderBy: { name: 'asc' } });
}

/**
 * Create a new brand.
 */
export async function createBrand(name: string): Promise<ActionResponse<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user || user.role === 'VIEWER') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const brand = await db.brand.create({
      data: { name, slug: slugify(name) },
    });
    return { success: true, data: { id: brand.id } };
  } catch {
    return { success: false, error: 'Brand already exists.' };
  }
}
