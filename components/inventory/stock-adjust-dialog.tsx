'use client';

/**
 * StockAdjustDialog — modal for manual stock adjustments.
 */

import { useState, useTransition, useEffect } from 'react';
import { adjustStock } from '@/actions/inventory';
import { getProducts } from '@/actions/products';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

export function StockAdjustDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [products, setProducts] = useState<any[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [type, setType] = useState<'ADJUSTMENT' | 'DAMAGE'>('ADJUSTMENT');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      getProducts({ pageSize: 200 }).then((res) => setProducts(res.data));
    }
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await adjustStock({ productId, quantity, type, notes });
      if (result.success) {
        toast.success('Stock adjusted successfully');
        setOpen(false);
        setProductId('');
        setQuantity(0);
        setNotes('');
      } else {
        toast.error(result.error || 'Failed to adjust stock');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> Adjust Stock</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manual Stock Adjustment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title} (Stock: {p.currentStock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity (+ add, - remove)</Label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                  <SelectItem value="DAMAGE">Damage/Loss</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Why are you adjusting stock?" required />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending || !productId || quantity === 0}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Adjust Stock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
