/**
 * Zod validation schemas for supplier and purchase order operations.
 */

import { z } from 'zod';

export const supplierSchema = z.object({
  name: z.string().min(2, 'Supplier name is required').max(200),
  contactPerson: z.string().max(200).optional().nullable(),
  email: z.string().email().max(200).optional().nullable(),
  phone: z.string().max(15).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  gstNumber: z.string().max(20).optional().nullable(),
  isActive: z.boolean().default(true),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

export const purchaseOrderItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  unitCost: z.coerce.number().min(0, 'Unit cost must be positive'),
});

export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  notes: z.string().max(1000).optional().nullable(),
  expectedDate: z.string().optional().nullable(),
  items: z.array(purchaseOrderItemSchema).min(1, 'At least one item is required'),
});

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;
