/**
 * Import Center Page — bulk product import from Flipkart exports.
 * Admin-only access with upload, preview, progress, and history.
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getImportStats, getImportHistory } from '@/actions/import';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { ImportCenter } from '@/components/import/import-center';
import { ImportHistoryTable } from '@/components/import/import-history-table';
import { Upload, Package, RefreshCw, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Import Center' };

export default async function ImportPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const [stats, history] = await Promise.all([
    getImportStats(),
    getImportHistory({ pageSize: 10 }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Import Center"
        description="Bulk import products from Flipkart listing exports"
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Imports" value={stats.totalImports} icon={Upload} />
        <StatCard
          title="Products Imported"
          value={stats.totalProductsImported}
          icon={Package}
          iconColor="text-green-600"
        />
        <StatCard
          title="Created / Updated"
          value={`${stats.totalCreated} / ${stats.totalUpdated}`}
          icon={RefreshCw}
          iconColor="text-blue-600"
        />
        <StatCard
          title="Last Import"
          value={stats.lastImport ? formatDate(stats.lastImport.startedAt) : 'Never'}
          icon={Calendar}
        />
      </div>

      {/* Import Flow (client component) */}
      <ImportCenter />

      {/* Import History */}
      <ImportHistoryTable data={history.data as any} total={history.total} />
    </div>
  );
}
