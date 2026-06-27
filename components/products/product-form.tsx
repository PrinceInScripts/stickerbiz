'use client';

/**
 * ProductForm — React Hook Form + Zod validated product creation/edit form.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { productSchema, type ProductFormValues } from '@/lib/validations/product';
import { createProduct, updateProduct } from '@/actions/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface ProductFormProps {
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  initialData?: ProductFormValues & { id: string };
}

export function ProductForm({ categories, brands, initialData }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      title: '',
      sku: '',
      fsn: '',
      costPrice: 0,
      sellingPrice: 0,
      currentStock: 0,
      reorderPoint: 10,
      marketplace: 'FLIPKART',
      isActive: true,
    },
  });

  async function onSubmit(values: ProductFormValues) {
    setIsSubmitting(true);
    try {
      const result = isEditing
        ? await updateProduct(initialData!.id, values as Record<string, unknown>)
        : await createProduct(values as Record<string, unknown>);

      if (result.success) {
        toast.success(isEditing ? 'Product updated' : 'Product created');
        router.push('/dashboard/products');
      } else {
        toast.error(result.error || 'Something went wrong');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Product Title *</Label>
              <Input id="title" {...form.register('title')} placeholder="Anime Sticker Pack" />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" {...form.register('sku')} placeholder="Auto-generated" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fsn">FSN</Label>
                <Input id="fsn" {...form.register('fsn')} placeholder="Flipkart Serial" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Input id="theme" {...form.register('theme')} placeholder="e.g., Anime, Marvel, Cute" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...form.register('description' as any)} placeholder="Product description..." rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Stock */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing & Stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price (₹) *</Label>
                <Input id="costPrice" type="number" step="0.01" {...form.register('costPrice', { valueAsNumber: true })} />
                {form.formState.errors.costPrice && (
                  <p className="text-xs text-destructive">{form.formState.errors.costPrice.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling Price (₹) *</Label>
                <Input id="sellingPrice" type="number" step="0.01" {...form.register('sellingPrice', { valueAsNumber: true })} />
                {form.formState.errors.sellingPrice && (
                  <p className="text-xs text-destructive">{form.formState.errors.sellingPrice.message}</p>
                )}
              </div>
            </div>

            {!isEditing && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentStock">Initial Stock</Label>
                  <Input id="currentStock" type="number" {...form.register('currentStock', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorderPoint">Reorder Point</Label>
                  <Input id="reorderPoint" type="number" {...form.register('reorderPoint', { valueAsNumber: true })} />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Marketplace</Label>
              <Select
                value={form.watch('marketplace')}
                onValueChange={(val) => form.setValue('marketplace', val as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FLIPKART">Flipkart</SelectItem>
                  <SelectItem value="AMAZON">Amazon</SelectItem>
                  <SelectItem value="MEESHO">Meesho</SelectItem>
                  <SelectItem value="WEBSITE">Website</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.watch('categoryId') || ''}
                onValueChange={(val) => form.setValue('categoryId', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Brand</Label>
              <Select
                value={form.watch('brandId') || ''}
                onValueChange={(val) => form.setValue('brandId', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input id="barcode" {...form.register('barcode')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shelfLocation">Shelf Location</Label>
                <Input id="shelfLocation" {...form.register('shelfLocation')} placeholder="e.g., A-3-2" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Product is visible in catalog</p>
              </div>
              <Switch
                checked={form.watch('isActive')}
                onCheckedChange={(val) => form.setValue('isActive', val)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEditing ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}
