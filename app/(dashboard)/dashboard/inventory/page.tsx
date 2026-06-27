/**
 * Inventory Page — stock overview with adjustment capability.
 */

import { getProducts } from '@/actions/products';
import { getInventoryStats, getInventoryLogs } from '@/actions/inventory';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getStockLevelBadge, INVENTORY_LOG_TYPE_LABELS } from '@/lib/constants';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Warehouse, Package, AlertTriangle, DollarSign } from 'lucide-react';
import { StockAdjustDialog } from '@/components/inventory/stock-adjust-dialog';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Inventory' };

export default async function InventoryPage() {
  const [stats, { data: products }, { data: logs }] = await Promise.all([
    getInventoryStats(),
    getProducts({ pageSize: 100, sortBy: 'currentStock', sortDirection: 'asc' }),
    getInventoryLogs({ pageSize: 20 }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Inventory" description="Manage stock levels and adjustments">
        <StockAdjustDialog />
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Products" value={stats.totalProducts} icon={Package} />
        <StatCard title="Total Stock" value={stats.totalStock.toLocaleString()} icon={Warehouse} />
        <StatCard title="Low / Out of Stock" value={`${stats.lowStock} / ${stats.outOfStock}`} icon={AlertTriangle} iconColor="text-red-600" />
        <StatCard title="Inventory Value" value={formatCurrency(stats.totalRetailValue)} icon={DollarSign} iconColor="text-green-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stock Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock Levels</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Product</th>
                    <th className="px-4 py-2 text-center font-medium text-muted-foreground">Stock</th>
                    <th className="px-4 py-2 text-center font-medium text-muted-foreground">Reserved</th>
                    <th className="px-4 py-2 text-center font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const badge = getStockLevelBadge(p.currentStock, p.reorderPoint);
                    return (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="px-4 py-2">
                          <p className="font-medium text-xs">{p.title}</p>
                          <p className="text-[10px] text-muted-foreground">{p.sku}</p>
                        </td>
                        <td className="px-4 py-2 text-center font-semibold">{p.currentStock}</td>
                        <td className="px-4 py-2 text-center text-muted-foreground">{p.reservedStock}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Stock Changes</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No activity yet</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-auto">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{log.product.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {INVENTORY_LOG_TYPE_LABELS[log.type as keyof typeof INVENTORY_LOG_TYPE_LABELS]}
                        {log.notes && ` — ${log.notes}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold ${log.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {log.quantity > 0 ? '+' : ''}{log.quantity}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{formatDateTime(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
