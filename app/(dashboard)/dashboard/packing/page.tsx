/**
 * Packing Queue — orders that need packing, with status transition buttons.
 */

import Link from 'next/link';
import { getOrders } from '@/actions/orders';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ORDER_STATUS_CONFIG } from '@/lib/constants';
import { formatCurrency, getRelativeTime } from '@/lib/utils';
import { PackageCheck, Eye } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Packing Queue' };

export default async function PackingPage() {
  const [pendingRes, packingRes, packedRes] = await Promise.all([
    getOrders({ status: 'PENDING', pageSize: 50 }),
    getOrders({ status: 'PACKING', pageSize: 50 }),
    getOrders({ status: 'PACKED', pageSize: 50 }),
  ]);

  const queues = [
    { title: 'Pending', orders: pendingRes.data, color: 'border-yellow-500' },
    { title: 'Packing', orders: packingRes.data, color: 'border-blue-500' },
    { title: 'Packed', orders: packedRes.data, color: 'border-indigo-500' },
  ];

  const totalItems = pendingRes.total + packingRes.total + packedRes.total;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Packing Queue"
        description={`${totalItems} orders need attention`}
      />

      {totalItems === 0 ? (
        <EmptyState
          icon={<PackageCheck className="h-6 w-6 text-muted-foreground" />}
          title="All caught up!"
          description="No orders waiting to be packed."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {queues.map((queue) => (
            <div key={queue.title} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">{queue.title}</h2>
                <span className="text-xs text-muted-foreground">{queue.orders.length}</span>
              </div>
              {queue.orders.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    No orders
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {queue.orders.map((order) => (
                    <Card key={order.id} className={`border-l-4 ${queue.color} card-hover`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-sm">{order.orderNumber}</p>
                            <p className="text-xs text-muted-foreground">{order.customerName}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {order.items.length} items · {formatCurrency(Number(order.totalAmount))}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link href={`/dashboard/orders/${order.id}`}>
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                        <p className="mt-2 text-[10px] text-muted-foreground">
                          {getRelativeTime(order.createdAt)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
