/**
 * Notifications Page — system notifications feed.
 */

import { db } from '@/lib/db';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getRelativeTime } from '@/lib/utils';
import { Bell, AlertTriangle, ShoppingCart, Truck, RotateCcw, Package, Info } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Notifications' };

const NOTIFICATION_ICONS = {
  LOW_STOCK: AlertTriangle,
  NEW_ORDER: ShoppingCart,
  ORDER_SHIPPED: Truck,
  RETURN_REQUEST: RotateCcw,
  PURCHASE_RECEIVED: Package,
  SYSTEM: Info,
};

export default async function NotificationsPage() {
  const notifications = await db.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Mark all as read
  await db.notification.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Notifications" description={`${notifications.length} notifications`} />

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-6 w-6 text-muted-foreground" />}
          title="No notifications"
          description="You'll see notifications for low stock, new orders, and returns here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = NOTIFICATION_ICONS[notif.type as keyof typeof NOTIFICATION_ICONS] || Info;
            return (
              <Card key={notif.id} className={`${!notif.isRead ? 'border-primary/30 bg-primary/5' : ''}`}>
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{notif.title}</p>
                    <p className="text-sm text-muted-foreground">{notif.message}</p>
                    {notif.link && (
                      <Link href={notif.link} className="text-xs text-primary hover:underline mt-1 inline-block">
                        View details →
                      </Link>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {getRelativeTime(notif.createdAt)}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
