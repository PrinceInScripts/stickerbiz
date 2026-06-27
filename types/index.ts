/**
 * Shared TypeScript types and interfaces used across the application.
 * Separates Prisma types from application-specific types.
 */

// Prisma 7 maps Decimal fields to native JS numbers
type Decimal = number;

// ─── Server Action Response Types ────────────────────────────────

/**
 * Standard server action return type for consistent error handling.
 * All server actions should return this shape.
 */
export type ActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// ─── Pagination Types ────────────────────────────────────────────

export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ─── Filter & Sort Types ─────────────────────────────────────────

export type SortDirection = 'asc' | 'desc';

export type SortParams = {
  sortBy: string;
  sortDirection: SortDirection;
};

// ─── Dashboard Types ─────────────────────────────────────────────

export type DashboardStats = {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  lowStockCount: number;
  revenueChange: number;
  ordersChange: number;
};

export type RevenueDataPoint = {
  date: string;
  revenue: number;
  orders: number;
};

export type TopProduct = {
  id: string;
  title: string;
  sku: string;
  totalSold: number;
  revenue: number;
  image?: string;
};

// ─── Product Types ───────────────────────────────────────────────

export type ProductWithRelations = {
  id: string;
  sku: string;
  fsn: string | null;
  title: string;
  description: string | null;
  costPrice: Decimal;
  sellingPrice: Decimal;
  currentStock: number;
  reservedStock: number;
  reorderPoint: number;
  barcode: string | null;
  shelfLocation: string | null;
  marketplace: string;
  theme: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  brand: { id: string; name: string } | null;
  category: { id: string; name: string } | null;
  images: { id: string; url: string; isPrimary: boolean; sortOrder: number }[];
};

// ─── Order Types ─────────────────────────────────────────────────

export type OrderWithRelations = {
  id: string;
  orderNumber: string;
  marketplace: string;
  marketplaceOrderId: string | null;
  customerName: string;
  customerPhone: string | null;
  shippingAddress: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  status: string;
  subtotal: Decimal;
  shippingFee: Decimal;
  discount: Decimal;
  totalAmount: Decimal;
  trackingNumber: string | null;
  shippingCarrier: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    quantity: number;
    unitPrice: Decimal;
    totalPrice: Decimal;
    product: {
      id: string;
      sku: string;
      title: string;
      images: { url: string; isPrimary: boolean }[];
    };
  }[];
  createdBy: { id: string; name: string } | null;
};

// ─── Analytics Types ─────────────────────────────────────────────

export type SalesDataPoint = {
  date: string;
  sales: number;
  orders: number;
  profit: number;
};

export type CategorySales = {
  category: string;
  sales: number;
  percentage: number;
};

export type InventoryValueData = {
  totalValue: number;
  totalCostValue: number;
  totalProducts: number;
  outOfStock: number;
  lowStock: number;
  healthyStock: number;
};

// ─── Search & Filter Types ──────────────────────────────────────

export type ProductFilters = {
  search?: string;
  category?: string;
  brand?: string;
  marketplace?: string;
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  isActive?: boolean;
};

export type OrderFilters = {
  search?: string;
  status?: string;
  marketplace?: string;
  dateFrom?: string;
  dateTo?: string;
};
