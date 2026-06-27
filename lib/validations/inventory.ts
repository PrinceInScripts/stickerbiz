/**
 * Zod validation schemas for inventory operations.
 */

import { z } from 'zod';

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().int().refine((val) => val !== 0, 'Quantity cannot be zero'),
  type: z.enum(['ADJUSTMENT', 'DAMAGE']),
  notes: z.string().min(3, 'Please provide a reason for the adjustment').max(500),
});

export type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentSchema>;
