export const ROLES = ['ADMIN', 'CUSTOMER'] as const;
export type Role = (typeof ROLES)[number];

export const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Allowed order status transitions (System Documentation §3). */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const REFRESH_COOKIE = 'refreshToken';
export const AUTH_COOKIE_PATH = '/api/v1/auth';
