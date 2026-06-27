'use client';

/**
 * OrderFiltersClient — status tab filter for orders.
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { SearchInput } from '@/components/shared/search-input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PACKING', label: 'Packing' },
  { value: 'PACKED', label: 'Packed' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function OrderFiltersClient({ currentStatus }: { currentStatus: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setStatus(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    params.delete('page');
    router.push(`/dashboard/orders?${params.toString()}`);
  }

  function setSearch(search: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    params.delete('page');
    router.push(`/dashboard/orders?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={currentStatus === tab.value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setStatus(tab.value)}
            className={cn('h-8')}
          >
            {tab.label}
          </Button>
        ))}
      </div>
      <SearchInput
        placeholder="Search orders..."
        value={searchParams.get('search') || ''}
        onChange={setSearch}
        className="w-full sm:w-[280px]"
      />
    </div>
  );
}
