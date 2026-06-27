/**
 * Application-wide constants, enums, and configuration.
 * Single source of truth for business rules and UI configuration.
 */

import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  PackageCheck,
  CheckCircle,
  RotateCcw,
  Truck,
  ClipboardList,
  BarChart3,
  Settings,
  Bell,
} from 'lucide-react';

// ─── Order Status Configuration ─────────────────────────────────

export const ORDER_STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    dotColor: 'bg-yellow-500',
  },
  PACKING: {
    label: 'Packing',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    dotColor: 'bg-blue-500',
  },
  PACKED: {
    label: 'Packed',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    dotColor: 'bg-indigo-500',
  },
  SHIPPED: {
    label: 'Shipped',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    dotColor: 'bg-purple-500',
  },
  DELIVERED: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    dotColor: 'bg-green-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    dotColor: 'bg-red-500',
  },
  RETURNED: {
    label: 'Returned',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    dotColor: 'bg-orange-500',
  },
} as const;

// ─── Stock Level Thresholds ─────────────────────────────────────

export const STOCK_LEVELS = {
  CRITICAL: 5,     // Red — urgent reorder needed
  LOW: 10,         // Yellow — reorder soon
  HEALTHY: 50,     // Green — good stock level
} as const;

export function getStockLevelColor(stock: number, reorderPoint: number = STOCK_LEVELS.LOW) {
  if (stock <= 0) return 'text-red-600 dark:text-red-400';
  if (stock <= STOCK_LEVELS.CRITICAL) return 'text-red-600 dark:text-red-400';
  if (stock <= reorderPoint) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-green-600 dark:text-green-400';
}

export function getStockLevelBadge(stock: number, reorderPoint: number = STOCK_LEVELS.LOW) {
  if (stock <= 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
  if (stock <= STOCK_LEVELS.CRITICAL) return { label: 'Critical', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
  if (stock <= reorderPoint) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' };
  return { label: 'In Stock', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
}

// ─── Marketplace Configuration ──────────────────────────────────

export const MARKETPLACE_CONFIG = {
  FLIPKART: { label: 'Flipkart', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  AMAZON: { label: 'Amazon', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  MEESHO: { label: 'Meesho', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400' },
  WEBSITE: { label: 'Website', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  OTHER: { label: 'Other', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
} as const;

// ─── Navigation Configuration ───────────────────────────────────

export type NavItem = {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: number;
  group: 'main' | 'orders' | 'procurement' | 'reports' | 'system';
};

export const NAV_ITEMS: NavItem[] = [
  // Main
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'main' },
  { title: 'Products', href: '/dashboard/products', icon: Package, group: 'main' },
  { title: 'Inventory', href: '/dashboard/inventory', icon: Warehouse, group: 'main' },

  // Orders
  { title: 'Orders', href: '/dashboard/orders', icon: ShoppingCart, group: 'orders' },
  { title: 'Packing Queue', href: '/dashboard/packing', icon: PackageCheck, group: 'orders' },
  { title: 'Completed', href: '/dashboard/completed', icon: CheckCircle, group: 'orders' },
  { title: 'Returns', href: '/dashboard/returns', icon: RotateCcw, group: 'orders' },

  // Procurement
  { title: 'Suppliers', href: '/dashboard/suppliers', icon: Truck, group: 'procurement' },
  { title: 'Purchase Orders', href: '/dashboard/purchase-orders', icon: ClipboardList, group: 'procurement' },

  // Reports
  { title: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, group: 'reports' },

  // System
  { title: 'Settings', href: '/dashboard/settings', icon: Settings, group: 'system' },
  { title: 'Notifications', href: '/dashboard/notifications', icon: Bell, group: 'system' },
];

export const NAV_GROUPS = {
  main: 'Overview',
  orders: 'Orders',
  procurement: 'Procurement',
  reports: 'Reports',
  system: 'System',
} as const;

// ─── Role Permissions ───────────────────────────────────────────

export type Resource =
  | 'dashboard'
  | 'products'
  | 'inventory'
  | 'orders'
  | 'packing'
  | 'returns'
  | 'suppliers'
  | 'purchase_orders'
  | 'analytics'
  | 'settings'
  | 'notifications'
  | 'users';

export type Permission = 'view' | 'create' | 'edit' | 'delete';

type PermissionMatrix = Record<string, Record<Resource, Permission[]>>;

export const ROLE_PERMISSIONS: PermissionMatrix = {
  ADMIN: {
    dashboard: ['view'],
    products: ['view', 'create', 'edit', 'delete'],
    inventory: ['view', 'create', 'edit', 'delete'],
    orders: ['view', 'create', 'edit', 'delete'],
    packing: ['view', 'create', 'edit'],
    returns: ['view', 'create', 'edit', 'delete'],
    suppliers: ['view', 'create', 'edit', 'delete'],
    purchase_orders: ['view', 'create', 'edit', 'delete'],
    analytics: ['view'],
    settings: ['view', 'edit'],
    notifications: ['view', 'edit'],
    users: ['view', 'create', 'edit', 'delete'],
  },
  EMPLOYEE: {
    dashboard: ['view'],
    products: ['view', 'create', 'edit'],
    inventory: ['view', 'edit'],
    orders: ['view', 'create', 'edit'],
    packing: ['view', 'create', 'edit'],
    returns: ['view', 'create'],
    suppliers: ['view'],
    purchase_orders: ['view', 'create'],
    analytics: ['view'],
    settings: ['view'],
    notifications: ['view', 'edit'],
    users: [],
  },
  VIEWER: {
    dashboard: ['view'],
    products: ['view'],
    inventory: ['view'],
    orders: ['view'],
    packing: ['view'],
    returns: ['view'],
    suppliers: ['view'],
    purchase_orders: ['view'],
    analytics: ['view'],
    settings: [],
    notifications: ['view'],
    users: [],
  },
};

/**
 * Check if a role has a specific permission on a resource.
 */
export function hasPermission(
  role: string,
  resource: Resource,
  permission: Permission
): boolean {
  const rolePerms = ROLE_PERMISSIONS[role];
  if (!rolePerms) return false;
  return rolePerms[resource]?.includes(permission) ?? false;
}

// ─── Pagination ─────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

// ─── Return Reason Labels ───────────────────────────────────────

export const RETURN_REASON_LABELS = {
  DAMAGED: 'Damaged Product',
  WRONG_ITEM: 'Wrong Item Sent',
  NOT_AS_DESCRIBED: 'Not as Described',
  CUSTOMER_CHANGED_MIND: 'Customer Changed Mind',
  DEFECTIVE: 'Defective Product',
  OTHER: 'Other',
} as const;

// ─── Inventory Log Type Labels ──────────────────────────────────

export const INVENTORY_LOG_TYPE_LABELS = {
  PURCHASE: 'Purchase',
  SALE: 'Sale',
  RETURN: 'Return',
  ADJUSTMENT: 'Manual Adjustment',
  RESERVATION: 'Stock Reserved',
  RELEASE: 'Stock Released',
  DAMAGE: 'Damage/Loss',
} as const;

// ─── Purchase Order Status Labels ───────────────────────────────

export const PO_STATUS_CONFIG = {
  DRAFT: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  },
  ORDERED: {
    label: 'Ordered',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  PARTIAL: {
    label: 'Partially Received',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  RECEIVED: {
    label: 'Received',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
} as const;
