import { PageHeader } from '@/components/shared/page-header';
import { OrderForm } from '@/components/orders/order-form';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'New Order' };

export default function NewOrderPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Create New Order" description="Add a new customer order with product items" />
      <OrderForm />
    </div>
  );
}
