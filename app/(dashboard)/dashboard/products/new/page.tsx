import { getCategories, getBrands } from '@/actions/products';
import { PageHeader } from '@/components/shared/page-header';
import { ProductForm } from '@/components/products/product-form';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'New Product' };

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Add New Product" description="Create a new sticker product for your catalog" />
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}
