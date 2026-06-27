/**
 * Zod validation schemas for product operations.
 * Used with React Hook Form for client-side validation
 * and in Server Actions for server-side validation.
 */

import { z } from 'zod';

export const productSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  sku: z.string().min(3, 'SKU must be at least 3 characters').max(50).optional(),
  fsn: z.string().max(50).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  brandId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  theme: z.string().max(100).optional().nullable(),
  costPrice: z.number().min(0, 'Cost price must be positive'),
  sellingPrice: z.number().min(0, 'Selling price must be positive'),
  currentStock: z.number().int().min(0, 'Stock cannot be negative'),
  reorderPoint: z.number().int().min(0),
  barcode: z.string().max(100).optional().nullable(),
  shelfLocation: z.string().max(50).optional().nullable(),
  marketplace: z.enum(['FLIPKART', 'AMAZON', 'MEESHO', 'WEBSITE', 'OTHER']),
  isActive: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const brandSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export type BrandFormValues = z.infer<typeof brandSchema>;
