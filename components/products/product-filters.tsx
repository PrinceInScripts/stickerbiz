'use client';

/**
 * ProductFilters — search + filter controls for the products list.
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { SearchInput } from '@/components/shared/search-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductFiltersProps {
  categories: { id: string; name: string }[];
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Reset to page 1 on filter change
    router.push(`/dashboard/products?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <SearchInput
        placeholder="Search products..."
        value={searchParams.get('search') || ''}
        onChange={(value) => updateFilter('search', value)}
        className="w-full sm:w-[300px]"
      />

      <Select
        value={searchParams.get('category') || 'all'}
        onValueChange={(value) => updateFilter('category', value)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('marketplace') || 'all'}
        onValueChange={(value) => updateFilter('marketplace', value)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Marketplace" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Marketplaces</SelectItem>
          <SelectItem value="FLIPKART">Flipkart</SelectItem>
          <SelectItem value="AMAZON">Amazon</SelectItem>
          <SelectItem value="MEESHO">Meesho</SelectItem>
          <SelectItem value="WEBSITE">Website</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('stockStatus') || 'all'}
        onValueChange={(value) => updateFilter('stockStatus', value)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Stock" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stock</SelectItem>
          <SelectItem value="in_stock">In Stock</SelectItem>
          <SelectItem value="low_stock">Low Stock</SelectItem>
          <SelectItem value="out_of_stock">Out of Stock</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
