'use client';

/**
 * OrderStatusActions — buttons to transition order status.
 */

import { useState, useTransition } from 'react';
import { updateOrderStatus } from '@/actions/orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Loader2, PackageCheck, Truck, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface OrderStatusActionsProps {
  orderId: string;
  currentStatus: string;
}

const STATUS_TRANSITIONS: Record<string, { next: string; label: string; icon: typeof Truck; variant: 'default' | 'destructive' }[]> = {
  PENDING: [
    { next: 'PACKING', label: 'Start Packing', icon: PackageCheck, variant: 'default' },
    { next: 'CANCELLED', label: 'Cancel Order', icon: XCircle, variant: 'destructive' },
  ],
  PACKING: [
    { next: 'PACKED', label: 'Mark as Packed', icon: PackageCheck, variant: 'default' },
    { next: 'CANCELLED', label: 'Cancel Order', icon: XCircle, variant: 'destructive' },
  ],
  PACKED: [
    { next: 'SHIPPED', label: 'Mark as Shipped', icon: Truck, variant: 'default' },
    { next: 'CANCELLED', label: 'Cancel Order', icon: XCircle, variant: 'destructive' },
  ],
  SHIPPED: [
    { next: 'DELIVERED', label: 'Mark Delivered', icon: CheckCircle, variant: 'default' },
  ],
};

export function OrderStatusActions({ orderId, currentStatus }: OrderStatusActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showCancel, setShowCancel] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('');

  const transitions = STATUS_TRANSITIONS[currentStatus] || [];

  async function handleTransition(nextStatus: string) {
    if (nextStatus === 'CANCELLED') {
      setShowCancel(true);
      return;
    }

    startTransition(async () => {
      const result = await updateOrderStatus({
        orderId,
        status: nextStatus,
        ...(nextStatus === 'SHIPPED' && { trackingNumber, shippingCarrier }),
      });

      if (result.success) {
        toast.success(`Order status updated to ${nextStatus.toLowerCase()}`);
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    });
  }

  async function handleCancel() {
    startTransition(async () => {
      const result = await updateOrderStatus({ orderId, status: 'CANCELLED' });
      if (result.success) {
        toast.success('Order cancelled. Stock has been released.');
        setShowCancel(false);
      } else {
        toast.error(result.error || 'Failed to cancel order');
      }
    });
  }

  if (transitions.length === 0) {
    return <p className="text-sm text-muted-foreground">No actions available</p>;
  }

  return (
    <div className="space-y-3">
      {/* Show tracking input for PACKED → SHIPPED transition */}
      {currentStatus === 'PACKED' && (
        <div className="space-y-2">
          <Label className="text-xs">Tracking Number</Label>
          <Input
            placeholder="Enter tracking number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
          <Label className="text-xs">Carrier</Label>
          <Input
            placeholder="e.g., Delhivery, BlueDart"
            value={shippingCarrier}
            onChange={(e) => setShippingCarrier(e.target.value)}
          />
        </div>
      )}

      {transitions.map((t) => {
        const Icon = t.icon;
        return (
          <Button
            key={t.next}
            variant={t.variant}
            className="w-full"
            onClick={() => handleTransition(t.next)}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            {t.label}
          </Button>
        );
      })}

      <ConfirmDialog
        open={showCancel}
        onOpenChange={setShowCancel}
        title="Cancel Order"
        description="Are you sure? This will release all reserved stock. This action cannot be undone."
        confirmLabel="Cancel Order"
        variant="destructive"
        isLoading={isPending}
        onConfirm={handleCancel}
      />
    </div>
  );
}
