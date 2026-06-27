/**
 * Products List Page — data table with search, filter, and CRUD.
 */

import Link from 'next/link';
import { getProducts, getCategories } from '@/actions/products';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MARKETPLACE_CONFIG } from '@/lib/constants';
import { getStockLevelBadge } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { Plus, Package, Eye } from 'lucide-react';
import { ProductFilters } from '@/components/products/product-filters';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Products' };

export default async function ProductsPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || '1');
  const search = searchParams.search || '';
  const category = searchParams.category || '';
  const marketplace = searchParams.marketplace || '';
  const stockStatus = searchParams.stockStatus || '';

  const [{ data: products, total, totalPages }, categories] = await Promise.all([
    getProducts({ page, search, category, marketplace, stockStatus }),
    getCategories(),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Products" description={`${total} products in your catalog`}>
        <Button asChild>
          <Link href="/dashboard/products/new"><Plus className="h-4 w-4" />Add Product</Link>
        </Button>
      </PageHeader>

      <ProductFilters categories={categories} />

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6 text-muted-foreground" />}
          title="No products found"
          description="Add your first sticker product to get started."
          action={<Button asChild><Link href="/dashboard/products/new"><Plus className="h-4 w-4" />Add Product</Link></Button>}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Marketplace</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cost</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Price</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Stock</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const stockBadge = getStockLevelBadge(product.currentStock, product.reorderPoint);
                    const available = product.currentStock - product.reservedStock;
                    return (
                      <tr key={product.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                              {product.images?.[0] ? (
                                <img src={product.images[0].url} alt={product.title} className="h-10 w-10 rounded-lg object-cover" />
                              ) : (
                                <Package className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{product.title}</p>
                              {product.theme && <p className="text-xs text-muted-foreground">{product.theme}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{product.sku}</td>
                        <td className="px-4 py-3 text-muted-foreground">{product.category?.name || '—'}</td>
                        <td className="px-4 py-3"><StatusBadge status={product.marketplace} config={MARKETPLACE_CONFIG} /></td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(Number(product.costPrice))}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(product.sellingPrice))}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${stockBadge.color}`}>{available}</span>
                          {product.reservedStock > 0 && <p className="text-[10px] text-muted-foreground mt-0.5">{product.reservedStock} reserved</p>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link href={`/dashboard/products/${product.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</p>
                <div className="flex gap-1">
                  {page > 1 && <Button variant="outline" size="sm" asChild><Link href={`/dashboard/products?page=${page - 1}&search=${search}`}>Previous</Link></Button>}
                  {page < totalPages && <Button variant="outline" size="sm" asChild><Link href={`/dashboard/products?page=${page + 1}&search=${search}`}>Next</Link></Button>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
