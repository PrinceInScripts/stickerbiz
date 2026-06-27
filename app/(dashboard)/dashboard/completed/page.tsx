/**
 * Completed Orders Page — delivered orders archive.
 */

import Link from 'next/link';
import { getOrders } from '@/actions/orders';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CheckCircle, Eye } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Completed Orders' };

export default async function CompletedPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || '1');

  const { data: orders, total, totalPages } = await getOrders({
    page, status: 'DELIVERED', pageSize: 20,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Completed Orders" description={`${total} orders delivered`} />

      {orders.length === 0 ? (
        <EmptyState
          icon={<CheckCircle className="h-6 w-6 text-muted-foreground" />}
          title="No completed orders"
          description="Orders will appear here once they are delivered."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Items</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Delivered</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                      <td className="px-4 py-3">{order.customerName}</td>
                      <td className="px-4 py-3 text-center">{order.items.length}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(order.totalAmount))}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{order.deliveredAt ? formatDate(order.deliveredAt) : '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/dashboard/orders/${order.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
