'use client';

/**
 * QuickOrderForm — simplified daily order entry.
 * Search by SKU, enter quantity, track today's orders.
 * No customer details — designed for daily dispatch workflow.
 */

import { useState, useTransition, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createOrder } from '@/actions/orders';
import { getProducts } from '@/actions/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  Star,
  Package,
  ShoppingCart,
  Clock,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type OrderItem = {
  productId: string;
  title: string;
  sku: string;
  sellingPrice: number;
  currentStock: number;
  quantity: number;
  category?: string;
};

type SearchResult = {
  id: string;
  title: string;
  sku: string;
  fsn: string | null;
  sellingPrice: number | string;
  currentStock: number;
  reservedStock: number;
  category?: { name: string } | null;
};

// Persist recent SKUs in localStorage
const RECENT_KEY = 'stickerbiz-recent-skus';
const MAX_RECENT = 8;

function getRecentSkus(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

function addRecentSku(sku: string) {
  const recent = getRecentSkus().filter((s) => s !== sku);
  recent.unshift(sku);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

export function QuickOrderForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentProducts, setRecentProducts] = useState<SearchResult[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Load recent products on mount
  useEffect(() => {
    async function loadRecent() {
      const skus = getRecentSkus();
      if (skus.length === 0) {
        setLoadingRecent(false);
        return;
      }
      try {
        // Search for each recent SKU
        const result = await getProducts({ search: '', pageSize: 50 });
        const products = result.data.filter((p: any) => skus.includes(p.sku));
        // Sort by recent order
        products.sort(
          (a: any, b: any) => skus.indexOf(a.sku) - skus.indexOf(b.sku)
        );
        setRecentProducts(products as any);
      } catch {
        // Silently fail
      }
      setLoadingRecent(false);
    }
    loadRecent();
  }, []);

  const searchProducts = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const result = await getProducts({ search: searchQuery, pageSize: 10 });
      setSearchResults(result.data as any);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const addItem = useCallback(
    (product: SearchResult) => {
      const existing = items.find((i) => i.productId === product.id);
      if (existing) {
        // Increment quantity
        setItems(
          items.map((i) =>
            i.productId === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )
        );
        toast.success(`${product.sku} → qty ${existing.quantity + 1}`);
      } else {
        setItems([
          {
            productId: product.id,
            title: product.title,
            sku: product.sku,
            sellingPrice: Number(product.sellingPrice),
            currentStock: product.currentStock - product.reservedStock,
            quantity: 1,
            category: product.category?.name,
          },
          ...items,
        ]);
        toast.success(`Added ${product.sku}`);
      }
      addRecentSku(product.sku);
      setSearchResults([]);
      setSearchQuery('');
    },
    [items]
  );

  const updateQuantity = useCallback(
    (productId: string, delta: number) => {
      setItems(
        items
          .map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.max(0, i.quantity + delta) }
              : i
          )
          .filter((i) => i.quantity > 0)
      );
    },
    [items]
  );

  const setQuantity = useCallback(
    (productId: string, qty: number) => {
      if (qty <= 0) {
        setItems(items.filter((i) => i.productId !== productId));
      } else {
        setItems(
          items.map((i) =>
            i.productId === productId ? { ...i, quantity: qty } : i
          )
        );
      }
    },
    [items]
  );

  const removeItem = useCallback(
    (productId: string) => {
      setItems(items.filter((i) => i.productId !== productId));
    },
    [items]
  );

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalValue = items.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0);

  async function handleSubmit() {
    if (items.length === 0) {
      toast.error('Add at least one product');
      return;
    }

    startTransition(async () => {
      const result = await createOrder({
        marketplace: 'FLIPKART',
        customerName: 'Flipkart Order',
        shippingAddress: 'Marketplace Fulfillment',
        shippingFee: 0,
        discount: 0,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.sellingPrice,
        })),
      });

      if (result.success) {
        toast.success(
          `Order created! ${totalItems} items worth ${formatCurrency(totalValue)}`
        );
        setItems([]);
        router.push('/dashboard/orders');
      } else {
        toast.error(result.error || 'Failed to create order');
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Search + Add */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by SKU, product name, or FSN..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.length >= 2) {
                        // Auto-search after typing
                        setTimeout(() => searchProducts(), 300);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        searchProducts();
                      }
                    }}
                    className="pl-10 h-12 text-base"
                    autoFocus
                  />
                </div>
                <Button
                  type="button"
                  onClick={searchProducts}
                  disabled={isSearching}
                  className="h-12 px-6"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="mt-2 rounded-xl border divide-y max-h-[300px] overflow-auto shadow-lg">
                  {searchResults.map((product) => {
                    const available =
                      product.currentStock - product.reservedStock;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addItem(product)}
                        className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-primary/5 transition-colors"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {product.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            SKU: {product.sku}
                            {product.fsn && ` · FSN: ${product.fsn}`}
                            {product.category &&
                              ` · ${(product.category as any).name || product.category}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold">
                            {formatCurrency(Number(product.sellingPrice))}
                          </p>
                          <p
                            className={cn(
                              'text-xs',
                              available <= 5
                                ? 'text-red-600'
                                : 'text-muted-foreground'
                            )}
                          >
                            Stock: {available}
                          </p>
                        </div>
                        <Plus className="h-5 w-5 text-primary shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent / Favorites */}
          {items.length === 0 && !loadingRecent && recentProducts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Star className="h-4 w-4" />
                  Recent Products — Quick Add
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  {recentProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addItem(product)}
                      className="flex items-center gap-3 rounded-xl border p-3 text-left hover:bg-primary/5 hover:border-primary/30 transition-all"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {product.sku}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {product.title}
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-primary shrink-0" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Today's Order Items */}
          {items.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Today's Orders
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {items.length} products · {totalItems} units
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                            {item.sku}
                          </span>
                          {item.category && (
                            <span className="text-[10px] text-muted-foreground">
                              {item.category}
                            </span>
                          )}
                        </div>
                        <p className="text-sm mt-0.5 truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.sellingPrice)} each · Stock:{' '}
                          {item.currentStock}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            setQuantity(
                              item.productId,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-16 h-8 text-center font-bold text-base"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <span className="text-sm font-semibold w-24 text-right">
                        {formatCurrency(item.sellingPrice * item.quantity)}
                      </span>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Summary */}
        <div className="space-y-4">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Products</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Units</span>
                  <span className="font-medium">{totalItems}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Total Value</span>
                  <span className="text-primary">{formatCurrency(totalValue)}</span>
                </div>
              </div>

              <Button
                className="w-full h-12 text-base"
                onClick={handleSubmit}
                disabled={isPending || items.length === 0}
              >
                {isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
                Create Order
              </Button>

              {items.length === 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  Search by SKU and add products to create an order
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
