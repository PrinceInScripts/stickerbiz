'use client';

/**
 * OrderForm — create new orders with product search and item management.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createOrder } from '@/actions/orders';
import { getProducts } from '@/actions/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, Search, Save } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

type OrderItem = {
  productId: string;
  productTitle: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  maxStock: number;
};

export function OrderForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Form fields
  const [marketplace, setMarketplace] = useState('FLIPKART');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [shippingFee, setShippingFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const total = subtotal + shippingFee - discount;

  async function searchProducts() {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const result = await getProducts({ search: searchQuery, pageSize: 10 });
      setSearchResults(result.data);
    } finally {
      setIsSearching(false);
    }
  }

  function addItem(product: any) {
    if (items.find((i) => i.productId === product.id)) {
      toast.error('Product already added');
      return;
    }
    const available = product.currentStock - product.reservedStock;
    setItems([...items, {
      productId: product.id,
      productTitle: product.title,
      sku: product.sku,
      quantity: 1,
      unitPrice: Number(product.sellingPrice),
      maxStock: available,
    }]);
    setSearchResults([]);
    setSearchQuery('');
  }

  function removeItem(productId: string) {
    setItems(items.filter((i) => i.productId !== productId));
  }

  function updateQuantity(productId: string, quantity: number) {
    setItems(items.map((i) =>
      i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) } : i
    ));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Add at least one product');
      return;
    }

    startTransition(async () => {
      const result = await createOrder({
        marketplace,
        customerName,
        customerPhone,
        shippingAddress,
        city,
        state,
        pincode,
        shippingFee,
        discount,
        notes,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      });

      if (result.success) {
        toast.success('Order created successfully');
        router.push(`/dashboard/orders/${result.data?.id}`);
      } else {
        toast.error(result.error || 'Failed to create order');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Marketplace</Label>
                <Select value={marketplace} onValueChange={setMarketplace}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLIPKART">Flipkart</SelectItem>
                    <SelectItem value="AMAZON">Amazon</SelectItem>
                    <SelectItem value="MEESHO">Meesho</SelectItem>
                    <SelectItem value="WEBSITE">Website</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Shipping Address *</Label>
              <Textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} required rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={state} onChange={(e) => setState(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input value={pincode} onChange={(e) => setPincode(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Shipping Fee (₹)</Label>
                <Input type="number" value={shippingFee} onChange={(e) => setShippingFee(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Discount (₹)</Label>
                <Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatCurrency(shippingFee)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Search products by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchProducts())}
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={searchProducts} disabled={isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="rounded-lg border divide-y max-h-[200px] overflow-auto">
              {searchResults.map((product) => {
                const available = product.currentStock - product.reservedStock;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addItem(product)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                    disabled={available <= 0}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{product.title}</p>
                      <p className="text-xs text-muted-foreground">{product.sku} · Stock: {available}</p>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(Number(product.sellingPrice))}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected Items */}
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-4 rounded-lg border p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.productTitle}</p>
                    <p className="text-xs text-muted-foreground">{item.sku} · Max: {item.maxStock}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={item.maxStock}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                      className="w-20 text-center"
                    />
                    <span className="text-sm font-medium w-24 text-right">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.productId)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Search and add products to the order
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isPending || items.length === 0}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Create Order
        </Button>
      </div>
    </form>
  );
}
