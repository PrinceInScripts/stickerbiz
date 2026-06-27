/**
 * Order Server Actions — full lifecycle management with inventory integration.
 */

'use server';

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { orderSchema, updateOrderStatusSchema } from '@/lib/validations/order';
import { generateOrderNumber } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from '@/types';

/**
 * Get paginated orders with filtering.
 */
export async function getOrders({
  page = 1,
  pageSize = 20,
  search,
  status,
  marketplace,
  dateFrom,
  dateTo,
  sortBy = 'createdAt',
  sortDirection = 'desc',
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  marketplace?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
} = {}) {
  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
      { trackingNumber: { contains: search, mode: 'insensitive' } },
      { marketplaceOrderId: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) where.status = status;
  if (marketplace) where.marketplace = marketplace;
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo && { lte: new Date(dateTo + 'T23:59:59') }),
    };
  }

  const [data, total] = await Promise.all([
    db.order.findMany({
      where: where as any,
      include: {
        items: {
          include: {
            product: {
              select: { id: true, sku: true, title: true, images: { where: { isPrimary: true }, take: 1 } },
            },
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { [sortBy]: sortDirection },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.order.count({ where: where as any }),
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
 * Get a single order by ID.
 */
export async function getOrderById(id: string) {
  return db.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true, sku: true, title: true,
              images: { where: { isPrimary: true }, take: 1 },
              currentStock: true,
            },
          },
        },
      },
      createdBy: { select: { id: true, name: true } },
      returns: true,
    },
  });
}

/**
 * Create a new order — validates stock availability, reserves inventory.
 */
export async function createOrder(
  data: Record<string, unknown>
): Promise<ActionResponse<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user || user.role === 'VIEWER') {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = orderSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const values = parsed.data;

  try {
    // Verify stock availability for all items
    for (const item of values.items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: { currentStock: true, reservedStock: true, title: true },
      });

      if (!product) {
        return { success: false, error: `Product not found: ${item.productId}` };
      }

      const available = product.currentStock - product.reservedStock;
      if (available < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for "${product.title}". Available: ${available}, Requested: ${item.quantity}`,
        };
      }
    }

    // Calculate totals
    const subtotal = values.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const totalAmount = subtotal + (values.shippingFee || 0) - (values.discount || 0);

    // Create order in a transaction
    const order = await db.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          marketplace: values.marketplace,
          marketplaceOrderId: values.marketplaceOrderId || null,
          customerName: values.customerName,
          customerPhone: values.customerPhone || null,
          customerEmail: values.customerEmail || null,
          shippingAddress: values.shippingAddress,
          city: values.city || null,
          state: values.state || null,
          pincode: values.pincode || null,
          subtotal,
          shippingFee: values.shippingFee || 0,
          discount: values.discount || 0,
          totalAmount,
          notes: values.notes || null,
          createdById: user.id,
          status: 'PENDING',
          items: {
            create: values.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.unitPrice * item.quantity,
            })),
          },
        },
      });

      // Reserve stock for each item
      for (const item of values.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { currentStock: true, reservedStock: true },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { reservedStock: { increment: item.quantity } },
        });

        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            type: 'RESERVATION',
            quantity: -item.quantity,
            prevStock: product!.currentStock,
            newStock: product!.currentStock,
            reference: newOrder.orderNumber,
            notes: `Stock reserved for order ${newOrder.orderNumber}`,
            userId: user.id,
          },
        });
      }

      // Create notification
      await tx.notification.create({
        data: {
          type: 'NEW_ORDER',
          title: 'New Order Created',
          message: `Order ${newOrder.orderNumber} for ${values.customerName} — ₹${totalAmount.toFixed(2)}`,
          link: `/dashboard/orders/${newOrder.id}`,
        },
      });

      return newOrder;
    });

    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/inventory');
    return { success: true, data: { id: order.id } };
  } catch (error) {
    console.error('Create order error:', error);
    return { success: false, error: 'Failed to create order.' };
  }
}

/**
 * Update order status with business logic transitions.
 */
export async function updateOrderStatus(
  data: Record<string, unknown>
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user || user.role === 'VIEWER') {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = updateOrderStatusSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data' };
  }

  const { orderId, status, trackingNumber, shippingCarrier } = parsed.data;

  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) return { success: false, error: 'Order not found' };

    // Update order in a transaction
    await db.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = { status };

      if (trackingNumber) updateData.trackingNumber = trackingNumber;
      if (shippingCarrier) updateData.shippingCarrier = shippingCarrier;

      // Status-specific logic
      if (status === 'SHIPPED') {
        updateData.shippedAt = new Date();
        // Deduct stock (move from reserved to actual deduction)
        for (const item of order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { currentStock: true, reservedStock: true },
          });

          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: { decrement: item.quantity },
              reservedStock: { decrement: item.quantity },
            },
          });

          await tx.inventoryLog.create({
            data: {
              productId: item.productId,
              type: 'SALE',
              quantity: -item.quantity,
              prevStock: product!.currentStock,
              newStock: product!.currentStock - item.quantity,
              reference: order.orderNumber,
              notes: `Shipped — order ${order.orderNumber}`,
              userId: user.id,
            },
          });
        }
      } else if (status === 'PACKED') {
        updateData.packedAt = new Date();
      } else if (status === 'DELIVERED') {
        updateData.deliveredAt = new Date();
      } else if (status === 'CANCELLED') {
        updateData.cancelledAt = new Date();
        // Release reserved stock
        for (const item of order.items) {
          if (order.status === 'PENDING' || order.status === 'PACKING' || order.status === 'PACKED') {
            await tx.product.update({
              where: { id: item.productId },
              data: { reservedStock: { decrement: item.quantity } },
            });

            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { currentStock: true },
            });

            await tx.inventoryLog.create({
              data: {
                productId: item.productId,
                type: 'RELEASE',
                quantity: item.quantity,
                prevStock: product!.currentStock,
                newStock: product!.currentStock,
                reference: order.orderNumber,
                notes: `Stock released — order ${order.orderNumber} cancelled`,
                userId: user.id,
              },
            });
          }
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: updateData as any,
      });
    });

    revalidatePath('/dashboard/orders');
    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath('/dashboard/packing');
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Update order status error:', error);
    return { success: false, error: 'Failed to update order status.' };
  }
}
