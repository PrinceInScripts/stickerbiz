/**
 * Returns Page — view and manage product returns.
 */

import { db } from '@/lib/db';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { RETURN_REASON_LABELS } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Returns' };

const RETURN_STATUS_CONFIG = {
  REQUESTED: { label: 'Requested', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  APPROVED: { label: 'Approved', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  RECEIVED: { label: 'Received', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  RESTOCKED: { label: 'Restocked', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

export default async function ReturnsPage() {
  const returns = await db.return.findMany({
    include: {
      order: { select: { orderNumber: true, customerName: true } },
      items: { include: { product: { select: { title: true, sku: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Returns" description={`${returns.length} return requests`} />

      {returns.length === 0 ? (
        <EmptyState
          icon={<RotateCcw className="h-6 w-6 text-muted-foreground" />}
          title="No returns"
          description="Return requests will appear here."
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
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reason</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Refund</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map((ret) => (
                    <tr key={ret.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{ret.order.orderNumber}</td>
                      <td className="px-4 py-3">{ret.order.customerName}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {RETURN_REASON_LABELS[ret.reason as keyof typeof RETURN_REASON_LABELS]}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ret.status} config={RETURN_STATUS_CONFIG} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {ret.refundAmount ? formatCurrency(Number(ret.refundAmount)) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatDate(ret.createdAt)}</td>
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
