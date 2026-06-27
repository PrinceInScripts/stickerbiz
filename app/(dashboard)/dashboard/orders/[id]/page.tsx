import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOrderById } from '@/actions/orders';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ORDER_STATUS_CONFIG, MARKETPLACE_CONFIG } from '@/lib/constants';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ArrowLeft, Package } from 'lucide-react';
import { OrderStatusActions } from '@/components/orders/order-status-actions';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Order Details' };

export default async function OrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={`Order ${order.orderNumber}`} description={`Created ${formatDateTime(order.createdAt)}`}>
        <Button variant="outline" asChild><Link href="/dashboard/orders"><ArrowLeft className="h-4 w-4" />Back</Link></Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Order Items</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 rounded-lg border p-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                      {item.product.images?.[0] ? <img src={item.product.images[0].url} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <Package className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/dashboard/products/${item.product.id}`} className="font-medium hover:underline">{item.product.title}</Link>
                      <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{item.quantity} × {formatCurrency(Number(item.unitPrice))}</p>
                      <p className="font-semibold">{formatCurrency(Number(item.totalPrice))}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(Number(order.subtotal))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{formatCurrency(Number(order.shippingFee))}</span></div>
                {Number(order.discount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(Number(order.discount))}</span></div>}
                <Separator />
                <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{formatCurrency(Number(order.totalAmount))}</span></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Customer Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><p className="text-sm text-muted-foreground">Name</p><p className="font-medium">{order.customerName}</p></div>
                <div><p className="text-sm text-muted-foreground">Phone</p><p className="font-medium">{order.customerPhone || '—'}</p></div>
                <div className="sm:col-span-2"><p className="text-sm text-muted-foreground">Shipping Address</p><p className="font-medium">{order.shippingAddress}{order.city && `, ${order.city}`}{order.state && `, ${order.state}`}{order.pincode && ` - ${order.pincode}`}</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} config={ORDER_STATUS_CONFIG} />
                <StatusBadge status={order.marketplace} config={MARKETPLACE_CONFIG} />
              </div>
              {order.trackingNumber && <div><p className="text-sm text-muted-foreground">Tracking</p><p className="font-mono text-sm">{order.trackingNumber}</p>{order.shippingCarrier && <p className="text-xs text-muted-foreground">{order.shippingCarrier}</p>}</div>}
              {order.notes && <div><p className="text-sm text-muted-foreground">Notes</p><p className="text-sm">{order.notes}</p></div>}
              <Separator />
              <OrderStatusActions orderId={order.id} currentStatus={order.status} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{formatDateTime(order.createdAt)}</span></div>
                {order.packedAt && <div className="flex justify-between"><span className="text-muted-foreground">Packed</span><span>{formatDateTime(order.packedAt)}</span></div>}
                {order.shippedAt && <div className="flex justify-between"><span className="text-muted-foreground">Shipped</span><span>{formatDateTime(order.shippedAt)}</span></div>}
                {order.deliveredAt && <div className="flex justify-between"><span className="text-muted-foreground">Delivered</span><span>{formatDateTime(order.deliveredAt)}</span></div>}
                {order.cancelledAt && <div className="flex justify-between text-destructive"><span>Cancelled</span><span>{formatDateTime(order.cancelledAt)}</span></div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
