/**
 * Purchase Orders Page.
 */

import { db } from '@/lib/db';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { PO_STATUS_CONFIG } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ClipboardList } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Purchase Orders' };

export default async function PurchaseOrdersPage() {
  const purchaseOrders = await db.purchaseOrder.findMany({
    include: {
      supplier: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Purchase Orders" description={`${purchaseOrders.length} orders`} />

      {purchaseOrders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6 text-muted-foreground" />}
          title="No purchase orders"
          description="Create purchase orders to restock your inventory."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">PO Number</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Supplier</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Items</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{po.poNumber}</td>
                      <td className="px-4 py-3">{po.supplier.name}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={po.status} config={PO_STATUS_CONFIG} />
                      </td>
                      <td className="px-4 py-3 text-center">{po._count.items}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(po.totalAmount))}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatDate(po.createdAt)}</td>
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
