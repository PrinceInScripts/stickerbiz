import Link from 'next/link';
import { getOrders } from '@/actions/orders';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ORDER_STATUS_CONFIG, MARKETPLACE_CONFIG } from '@/lib/constants';
import { formatCurrency, getRelativeTime } from '@/lib/utils';
import { Plus, ShoppingCart, Eye } from 'lucide-react';
import { OrderFiltersClient } from '@/components/orders/order-filters';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Orders' };

export default async function OrdersPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || '1');
  const search = searchParams.search || '';
  const status = searchParams.status || '';
  const marketplace = searchParams.marketplace || '';

  const { data: orders, total, totalPages } = await getOrders({ page, search, status, marketplace });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Orders" description={`${total} orders total`}>
        <Button asChild><Link href="/dashboard/orders/new"><Plus className="h-4 w-4" />New Order</Link></Button>
      </PageHeader>

      <OrderFiltersClient currentStatus={status} />

      {orders.length === 0 ? (
        <EmptyState icon={<ShoppingCart className="h-6 w-6 text-muted-foreground" />} title="No orders found" description="Create your first order or adjust your filters." action={<Button asChild><Link href="/dashboard/orders/new"><Plus className="h-4 w-4" />New Order</Link></Button>} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order #</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Marketplace</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Items</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/orders/${order.id}`} className="font-medium text-primary hover:underline">{order.orderNumber}</Link>
                        {order.trackingNumber && <p className="text-xs text-muted-foreground mt-0.5">🚚 {order.trackingNumber}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{order.customerName}</p>
                        {order.city && <p className="text-xs text-muted-foreground">{order.city}, {order.state}</p>}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} config={ORDER_STATUS_CONFIG} /></td>
                      <td className="px-4 py-3"><StatusBadge status={order.marketplace} config={MARKETPLACE_CONFIG} /></td>
                      <td className="px-4 py-3 text-center">{order.items.length}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(order.totalAmount))}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground text-xs">{getRelativeTime(order.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/dashboard/orders/${order.id}`}><Eye className="h-3.5 w-3.5" /></Link></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</p>
                <div className="flex gap-1">
                  {page > 1 && <Button variant="outline" size="sm" asChild><Link href={`/dashboard/orders?page=${page - 1}&status=${status}&search=${search}`}>Previous</Link></Button>}
                  {page < totalPages && <Button variant="outline" size="sm" asChild><Link href={`/dashboard/orders?page=${page + 1}&status=${status}&search=${search}`}>Next</Link></Button>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
