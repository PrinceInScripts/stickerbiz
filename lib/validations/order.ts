/**
 * Zod validation schemas for order operations.
 */

import { z } from 'zod';

export const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0),
});

export const orderSchema = z.object({
  marketplace: z.enum(['FLIPKART', 'AMAZON', 'MEESHO', 'WEBSITE', 'OTHER']).default('FLIPKART'),
  marketplaceOrderId: z.string().max(100).optional().nullable(),
  customerName: z.string().min(2, 'Customer name is required').max(200),
  customerPhone: z.string().max(15).optional().nullable(),
  customerEmail: z.string().email().max(200).optional().nullable(),
  shippingAddress: z.string().min(5, 'Shipping address is required').max(500),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  pincode: z.string().max(10).optional().nullable(),
  shippingFee: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
});

export type OrderFormValues = z.infer<typeof orderSchema>;

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(['PENDING', 'PACKING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED']),
  trackingNumber: z.string().max(100).optional().nullable(),
  shippingCarrier: z.string().max(100).optional().nullable(),
});

export type UpdateOrderStatusValues = z.infer<typeof updateOrderStatusSchema>;
