/**
 * Authentication Server Actions
 * Handles login, logout, and user registration.
 */

'use server';

import { db } from '@/lib/db';
import {
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
  getCurrentUser,
} from '@/lib/auth';
import { loginSchema, registerSchema } from '@/lib/validations/auth';
import { redirect } from 'next/navigation';
import type { ActionResponse } from '@/types';

/**
 * Login action — validates credentials and creates session.
 */
export async function loginAction(
  _prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  // Validate input
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid email or password format.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { email, password } = parsed.data;

  // Find user
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return { success: false, error: 'Invalid email or password.' };
  }

  // Verify password
  const isValid = await verifyPassword(password, user.hashedPassword);
  if (!isValid) {
    return { success: false, error: 'Invalid email or password.' };
  }

  // Create session
  await createSession(user.id, user.role);

  redirect('/dashboard');
}

/**
 * Logout action — destroys session and redirects to login.
 */
export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect('/login');
}

/**
 * Register action — admin-only user creation.
 */
export async function registerAction(
  _prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  // Only admins can register new users
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized. Only admins can create users.' };
  }

  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    role: formData.get('role') as string,
  };

  // Validate input
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix the form errors.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, email, password, role } = parsed.data;

  // Check if email already exists
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: 'A user with this email already exists.' };
  }

  // Hash password and create user
  const hashedPassword = await hashPassword(password);
  await db.user.create({
    data: { name, email, hashedPassword, role },
  });

  return { success: true };
}

/**
 * Seed action — create initial admin user if none exists.
 * Call this once during initial setup.
 */
export async function seedAdminAction(): Promise<ActionResponse> {
  const existingAdmin = await db.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (existingAdmin) {
    return { success: false, error: 'Admin user already exists.' };
  }

  const hashedPassword = await hashPassword('admin123');
  await db.user.create({
    data: {
      name: 'Admin',
      email: 'admin@stickerbiz.com',
      hashedPassword,
      role: 'ADMIN',
    },
  });

  return { success: true };
}
