'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createSupplierAction(data: {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  gstNumber?: string;
}) {
  await db.supplier.create({ data });
  revalidatePath('/dashboard/suppliers');
}
