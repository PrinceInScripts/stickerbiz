/**
 * Dashboard Server Actions — aggregated statistics and recent data.
 */

'use server';

import { db } from '@/lib/db';
import type { DashboardStats, RevenueDataPoint, TopProduct } from '@/types';

/**
 * Get dashboard KPI statistics.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    currentRevenue,
    previousRevenue,
    currentOrders,
    previousOrders,
    pendingOrders,
    lowStockCount,
  ] = await Promise.all([
    // Revenue last 30 days
    db.order.aggregate({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { notIn: ['CANCELLED'] },
      },
      _sum: { totalAmount: true },
    }),
    // Revenue previous 30 days
    db.order.aggregate({
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        status: { notIn: ['CANCELLED'] },
      },
      _sum: { totalAmount: true },
    }),
    // Orders last 30 days
    db.order.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    // Orders previous 30 days
    db.order.count({
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),
    // Pending orders
    db.order.count({ where: { status: 'PENDING' } }),
    // Low stock products
    db.product.count({
      where: {
        isActive: true,
        currentStock: { lte: 10 },
      },
    }),
  ]);

  const totalRevenue = Number(currentRevenue._sum.totalAmount || 0);
  const prevRevenue = Number(previousRevenue._sum.totalAmount || 0);
  const revenueChange = prevRevenue > 0
    ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
    : 0;
  const ordersChange = previousOrders > 0
    ? ((currentOrders - previousOrders) / previousOrders) * 100
    : 0;

  return {
    totalRevenue,
    totalOrders: currentOrders,
    pendingOrders,
    lowStockCount,
    revenueChange,
    ordersChange,
  };
}

/**
 * Get revenue data for the chart (last 30 days).
 */
export async function getRevenueChart(): Promise<RevenueDataPoint[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const orders = await db.order.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      status: { notIn: ['CANCELLED'] },
    },
    select: { createdAt: true, totalAmount: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group by date
  const grouped: Record<string, { revenue: number; orders: number }> = {};
  for (let i = 0; i < 30; i++) {
    const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
    const key = date.toISOString().split('T')[0];
    grouped[key] = { revenue: 0, orders: 0 };
  }

  for (const order of orders) {
    const key = order.createdAt.toISOString().split('T')[0];
    if (grouped[key]) {
      grouped[key].revenue += Number(order.totalAmount);
      grouped[key].orders += 1;
    }
  }

  return Object.entries(grouped).map(([date, data]) => ({
    date,
    revenue: Math.round(data.revenue * 100) / 100,
    orders: data.orders,
  }));
}

/**
 * Get top selling products.
 */
export async function getTopProducts(limit = 5): Promise<TopProduct[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const topItems = await db.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        createdAt: { gte: thirtyDaysAgo },
        status: { notIn: ['CANCELLED'] },
      },
    },
    _sum: { quantity: true, totalPrice: true },
    orderBy: { _sum: { totalPrice: 'desc' } },
    take: limit,
  });

  const products = await db.product.findMany({
    where: { id: { in: topItems.map((i) => i.productId) } },
    select: {
      id: true,
      title: true,
      sku: true,
      images: { where: { isPrimary: true }, take: 1 },
    },
  });

  return topItems.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      id: item.productId,
      title: product?.title || 'Unknown',
      sku: product?.sku || '',
      totalSold: item._sum.quantity || 0,
      revenue: Number(item._sum.totalPrice || 0),
      image: product?.images[0]?.url,
    };
  });
}

/**
 * Get recent orders.
 */
export async function getRecentOrders(limit = 10) {
  return db.order.findMany({
    include: {
      items: {
        include: {
          product: { select: { title: true, sku: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
