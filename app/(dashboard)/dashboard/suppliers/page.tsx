/**
 * Suppliers Page — supplier directory with add/edit.
 */

import { db } from '@/lib/db';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, Plus, Phone, Mail } from 'lucide-react';
import { SupplierDialog } from '@/components/suppliers/supplier-dialog';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Suppliers' };

export default async function SuppliersPage() {
  const suppliers = await db.supplier.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { purchaseOrders: true } } },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Suppliers" description={`${suppliers.length} suppliers`}>
        <SupplierDialog />
      </PageHeader>

      {suppliers.length === 0 ? (
        <EmptyState
          icon={<Truck className="h-6 w-6 text-muted-foreground" />}
          title="No suppliers"
          description="Add your first supplier to manage procurement."
          action={<SupplierDialog />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => (
            <Card key={supplier.id} className="card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{supplier.name}</h3>
                    {supplier.contactPerson && (
                      <p className="text-sm text-muted-foreground">{supplier.contactPerson}</p>
                    )}
                  </div>
                  <Badge variant={supplier.isActive ? 'default' : 'secondary'}>
                    {supplier.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1.5">
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {supplier.phone}
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {supplier.email}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {supplier._count.purchaseOrders} purchase orders
                  </span>
                  {supplier.gstNumber && (
                    <span className="text-xs text-muted-foreground font-mono">
                      GST: {supplier.gstNumber}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
