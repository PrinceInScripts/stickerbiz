/**
 * Settings Page — app configuration and user management.
 */

import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const [currentUser, users] = await Promise.all([
    getCurrentUser(),
    db.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Settings" description="Manage your account and system configuration" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{currentUser?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{currentUser?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <Badge variant="secondary">{currentUser?.role}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business</CardTitle>
            <CardDescription>Business configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Business Name</p>
              <p className="font-medium">StickerBiz</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Currency</p>
              <p className="font-medium">Indian Rupee (₹ INR)</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Default Low Stock Threshold</p>
              <p className="font-medium">10 units</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users */}
      {currentUser?.role === 'ADMIN' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users</CardTitle>
            <CardDescription>Manage team access and roles</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{user.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3"><Badge variant="outline">{user.role}</Badge></td>
                      <td className="px-4 py-3">
                        <Badge variant={user.isActive ? 'default' : 'destructive'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
