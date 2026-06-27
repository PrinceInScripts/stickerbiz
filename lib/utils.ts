/**
 * Utility functions used across the application.
 * Includes class merging, formatting, and helper functions.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper conflict resolution.
 * Combines clsx for conditional classes + tailwind-merge for deduplication.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as INR currency.
 * @example formatCurrency(1500) => "₹1,500.00"
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format a date to locale string.
 * @example formatDate(new Date()) => "28 Jun 2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Format a date with time.
 * @example formatDateTime(new Date()) => "28 Jun 2026, 12:30 PM"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Generate a unique SKU for sticker products.
 * Format: STK-{CATEGORY_PREFIX}-{RANDOM_5}
 * @example generateSKU("Anime") => "STK-ANI-A3K9F"
 */
export function generateSKU(categoryPrefix?: string): string {
  const prefix = categoryPrefix
    ? categoryPrefix.substring(0, 3).toUpperCase()
    : 'GEN';
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `STK-${prefix}-${random}`;
}

/**
 * Generate a unique order number.
 * Format: ORD-{YYYYMMDD}-{RANDOM_4}
 * @example generateOrderNumber() => "ORD-20260628-A3K9"
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const dateStr =
    date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${dateStr}-${random}`;
}

/**
 * Generate a unique purchase order number.
 * Format: PO-{YYYYMMDD}-{RANDOM_4}
 */
export function generatePONumber(): string {
  const date = new Date();
  const dateStr =
    date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PO-${dateStr}-${random}`;
}

/**
 * Create URL-safe slug from string.
 * @example slugify("Anime Stickers") => "anime-stickers"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate text to a max length with ellipsis.
 * @example truncate("Long text here", 10) => "Long te..."
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Get relative time string from date.
 * @example getRelativeTime(new Date(Date.now() - 3600000)) => "1 hour ago"
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

/**
 * Calculate percentage change between two values.
 */
export function percentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Delay/sleep for async operations.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
