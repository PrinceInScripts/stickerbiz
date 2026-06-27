import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProductById } from '@/actions/products';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MARKETPLACE_CONFIG, INVENTORY_LOG_TYPE_LABELS } from '@/lib/constants';
import { getStockLevelBadge } from '@/lib/constants';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ArrowLeft, Package } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Product Details' };

export default async function ProductDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const product = await getProductById(id);
  if (!product) notFound();

  const available = product.currentStock - product.reservedStock;
  const stockBadge = getStockLevelBadge(product.currentStock, product.reorderPoint);
  const margin = Number(product.sellingPrice) - Number(product.costPrice);
  const marginPct = Number(product.costPrice) > 0 ? ((margin / Number(product.costPrice)) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={product.title} description={`SKU: ${product.sku}${product.fsn ? ` · FSN: ${product.fsn}` : ''}`}>
        <Button variant="outline" asChild><Link href="/dashboard/products"><ArrowLeft className="h-4 w-4" />Back</Link></Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Product Information</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><p className="text-sm text-muted-foreground">Category</p><p className="font-medium">{product.category?.name || '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Brand</p><p className="font-medium">{product.brand?.name || '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Theme</p><p className="font-medium">{product.theme || '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Marketplace</p><StatusBadge status={product.marketplace} config={MARKETPLACE_CONFIG} /></div>
              <div><p className="text-sm text-muted-foreground">Barcode</p><p className="font-mono text-sm">{product.barcode || '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Shelf Location</p><p className="font-medium">{product.shelfLocation || '—'}</p></div>
            </div>
            {product.description && (<><Separator className="my-4" /><div><p className="text-sm text-muted-foreground">Description</p><p className="mt-1 text-sm">{product.description}</p></div></>)}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Pricing</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between"><span className="text-muted-foreground">Cost Price</span><span>{formatCurrency(Number(product.costPrice))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Selling Price</span><span className="font-semibold">{formatCurrency(Number(product.sellingPrice))}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">Margin</span><span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(margin)} ({marginPct}%)</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Stock</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between"><span className="text-muted-foreground">Current Stock</span><span className="font-semibold">{product.currentStock}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Reserved</span><span>{product.reservedStock}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Available</span><span className="font-semibold">{available}</span></div>
              <Separator />
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Status</span><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${stockBadge.color}`}>{stockBadge.label}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Stock History</CardTitle></CardHeader>
        <CardContent>
          {product.inventoryLogs.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No stock changes recorded</p>
          ) : (
            <div className="space-y-3">
              {product.inventoryLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-4 rounded-lg border p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{INVENTORY_LOG_TYPE_LABELS[log.type as keyof typeof INVENTORY_LOG_TYPE_LABELS] || log.type}</p>
                    {log.notes && <p className="text-xs text-muted-foreground">{log.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${log.quantity > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{log.quantity > 0 ? '+' : ''}{log.quantity}</p>
                    <p className="text-xs text-muted-foreground">{log.prevStock} → {log.newStock}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{log.user?.name || 'System'}</p>
                    <p>{formatDateTime(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
