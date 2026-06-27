import { getDashboardStats, getRevenueChart, getTopProducts } from '@/actions/dashboard';
import { getInventoryStats } from '@/actions/inventory';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, TrendingUp, Package, BarChart3 } from 'lucide-react';
import { db } from '@/lib/db';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Analytics' };

export default async function AnalyticsPage() {
  const [stats, chartData, topProducts, inventoryStats] = await Promise.all([
    getDashboardStats(),
    getRevenueChart(),
    getTopProducts(10),
    getInventoryStats(),
  ]);

  const profitMargin = inventoryStats.totalRetailValue > 0
    ? (((inventoryStats.totalRetailValue - inventoryStats.totalCostValue) / inventoryStats.totalRetailValue) * 100).toFixed(1)
    : '0';

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeProductIds = await db.orderItem.groupBy({
    by: ['productId'],
    where: { order: { createdAt: { gte: thirtyDaysAgo }, status: { notIn: ['CANCELLED'] } } },
  });
  const totalActive = await db.product.count({ where: { isActive: true } });
  const deadStock = totalActive - activeProductIds.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Analytics" description="Business performance and insights" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Revenue (30d)" value={formatCurrency(stats.totalRevenue)} change={stats.revenueChange} icon={DollarSign} iconColor="text-green-600" />
        <StatCard title="Avg. Profit Margin" value={`${profitMargin}%`} icon={TrendingUp} iconColor="text-blue-600" />
        <StatCard title="Inventory Value" value={formatCurrency(inventoryStats.totalRetailValue)} icon={Package} />
        <StatCard title="Dead Stock Products" value={deadStock.toString()} icon={BarChart3} iconColor="text-orange-600" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Revenue Trend (30 Days)</CardTitle></CardHeader>
        <CardContent><RevenueChart data={chartData} /></CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Top Products by Revenue</CardTitle></CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((product, idx) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{product.title}</p>
                      <p className="text-xs text-muted-foreground">{product.totalSold} units sold</p>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(product.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Inventory Health</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Healthy Stock', value: inventoryStats.healthyStock, color: 'bg-green-500', textColor: 'text-green-600' },
                { label: 'Low Stock', value: inventoryStats.lowStock, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
                { label: 'Out of Stock', value: inventoryStats.outOfStock, color: 'bg-red-500', textColor: 'text-red-600' },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={`font-semibold ${item.textColor}`}>{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.value / Math.max(inventoryStats.totalProducts, 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
              <div className="mt-4 rounded-lg border p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Cost Value</span><span>{formatCurrency(inventoryStats.totalCostValue)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Retail Value</span><span className="font-semibold">{formatCurrency(inventoryStats.totalRetailValue)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Potential Profit</span><span className="font-semibold text-green-600">{formatCurrency(inventoryStats.totalRetailValue - inventoryStats.totalCostValue)}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
