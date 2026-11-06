export type Role = 'ADMIN' | 'CUSTOMER';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

/** Mirrors the backend transition table. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export interface User { id: number; name: string; email: string; role: Role }
export interface Session { accessToken: string; expiresIn: number; user: User }
export interface Profile {
  id: number; name: string; email: string;
  phone: string | null; address: string | null; createdAt: string;
}

export interface Category { id: number; name: string; slug: string; productCount?: number }

export interface Product {
  id: number; name: string; description: string | null;
  price: number; stock: number; imageUrl: string | null; isActive: boolean;
  category: { id: number; name: string; slug: string };
  createdAt: string; updatedAt: string;
}
export interface ProductInput {
  name: string; description: string | null; price: number; stock: number;
  categoryId: number; imageUrl: string | null; isActive: boolean;
}

export interface CartItem {
  productId: number; name: string; imageUrl: string | null;
  unitPrice: number; quantity: number; stock: number; lineTotal: number; isAvailable: boolean;
}
export interface Cart { items: CartItem[]; itemCount: number; subtotal: number }

export interface OrderItem {
  productId: number; productName: string; unitPrice: number; quantity: number; lineTotal: number;
}
export interface Order {
  id: number; status: OrderStatus; total: number; paymentMethod: string;
  recipientName: string; phone: string; shippingAddress: string;
  customer?: { id: number; name: string; email: string };
  items?: OrderItem[];
  createdAt: string; updatedAt: string;
}

export interface Customer {
  id: number; name: string; email: string; isActive: boolean; orderCount: number; createdAt: string;
}

export interface PageMeta { page: number; limit: number; total: number; totalPages: number }
export interface Paginated<T> { data: T[]; meta: PageMeta }

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Array<Record<string, any>>;
}

declare module 'vue-router' {
  interface RouteMeta {
    role?: Role;
    guestOnly?: boolean;
    title?: string;
  }
}
