/**
 * Dashboard Page — KPI cards, revenue chart, recent orders, and alerts.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import {
  getDashboardStats,
  getRevenueChart,
  getRecentOrders,
  getTopProducts,
} from '@/actions/dashboard';
import { StatCard } from '@/components/shared/stat-card';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ORDER_STATUS_CONFIG } from '@/lib/constants';
import { formatCurrency, formatDate, getRelativeTime } from '@/lib/utils';
import {
  DollarSign,
  ShoppingCart,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  Package,
} from 'lucide-react';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const [stats, chartData, recentOrders, topProducts] = await Promise.all([
    getDashboardStats(),
    getRevenueChart(),
    getRecentOrders(8),
    getTopProducts(5),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Overview of your sticker business operations"
      >
        <Button asChild>
          <Link href="/dashboard/orders/new">
            <Plus className="h-4 w-4" />
            New Order
          </Link>
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Revenue (30d)"
          value={formatCurrency(stats.totalRevenue)}
          change={stats.revenueChange}
          changeLabel="vs prev 30d"
          icon={DollarSign}
          iconColor="text-green-600"
        />
        <StatCard
          title="Orders (30d)"
          value={stats.totalOrders.toLocaleString()}
          change={stats.ordersChange}
          changeLabel="vs prev 30d"
          icon={ShoppingCart}
          iconColor="text-blue-600"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders.toLocaleString()}
          icon={Clock}
          iconColor="text-yellow-600"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockCount.toLocaleString()}
          icon={AlertTriangle}
          iconColor="text-red-600"
        />
      </div>

      {/* Charts + Top Products Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/analytics">
                View Details <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <RevenueChart data={chartData} />
            </Suspense>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No sales data yet
              </p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, idx) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{product.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.totalSold} sold
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCurrency(product.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/orders">
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No orders yet. Create your first order to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Order</th>
                    <th className="pb-3 font-medium text-muted-foreground">Customer</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground">Items</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">Amount</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-3">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3">{order.customerName}</td>
                      <td className="py-3">
                        <StatusBadge status={order.status} config={ORDER_STATUS_CONFIG} />
                      </td>
                      <td className="py-3">{order.items.length}</td>
                      <td className="py-3 text-right font-medium">
                        {formatCurrency(Number(order.totalAmount))}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {getRelativeTime(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
