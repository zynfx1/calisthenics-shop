import type { AxiosResponse } from 'axios';
import { http } from './http';
import type {
  Cart, Category, Customer, Order, OrderStatus, Paginated, Product, ProductInput, Profile, Session, User,
} from '@/types';

const unwrap = <T>(req: Promise<AxiosResponse<{ data: T }>>) => req.then((r) => r.data.data);
const paged = <T>(req: Promise<AxiosResponse<Paginated<T>>>) => req.then((r) => r.data);

export interface ProductQuery {
  page?: number; limit?: number; q?: string; categoryId?: number;
  sort?: string; isActive?: 'true' | 'false';
}
export interface PageQuery { page?: number; limit?: number; status?: OrderStatus; q?: string }

export const authApi = {
  register: (b: { name: string; email: string; password: string }) =>
    unwrap<User>(http.post('/auth/register', b)),
  login: (b: { email: string; password: string }) => unwrap<Session>(http.post('/auth/login', b)),
  logout: () => http.post('/auth/logout'),
};

export const usersApi = {
  me: () => unwrap<Profile>(http.get('/users/me')),
  update: (b: Partial<{ name: string; phone: string | null; address: string | null }>) =>
    unwrap<Profile>(http.patch('/users/me', b)),
  changePassword: (b: { currentPassword: string; newPassword: string }) =>
    http.post('/users/me/password', b),
};

export const categoriesApi = {
  list: () => unwrap<Category[]>(http.get('/categories')),
  create: (name: string) => unwrap<Category>(http.post('/categories', { name })),
  update: (id: number, name: string) => unwrap<Category>(http.patch(`/categories/${id}`, { name })),
  remove: (id: number) => http.delete(`/categories/${id}`),
};

export const productsApi = {
  list: (params: ProductQuery) => paged<Product>(http.get('/products', { params })),
  get: (id: number | string) => unwrap<Product>(http.get(`/products/${id}`)),
  adminList: (params: ProductQuery) => paged<Product>(http.get('/admin/products', { params })),
  create: (b: ProductInput) => unwrap<Product>(http.post('/products', b)),
  update: (id: number, b: Partial<ProductInput>) => unwrap<Product>(http.patch(`/products/${id}`, b)),
  remove: (id: number) => http.delete(`/products/${id}`),
};

export const uploadsApi = {
  /** Uploads a product image and returns its public URL. */
  productImage: (file: File) => {
    const body = new FormData();
    body.append('image', file);
    return unwrap<{ url: string }>(http.post('/uploads/product-image', body)).then((r) => r.url);
  },
};

export const cartApi = {
  get: () => unwrap<Cart>(http.get('/cart')),
  add: (productId: number, quantity: number) => unwrap<Cart>(http.post('/cart/items', { productId, quantity })),
  setQuantity: (productId: number, quantity: number) =>
    unwrap<Cart>(http.patch(`/cart/items/${productId}`, { quantity })),
  remove: (productId: number) => unwrap<Cart>(http.delete(`/cart/items/${productId}`)),
};

export const ordersApi = {
  create: (b: { recipientName: string; phone: string; shippingAddress: string }) =>
    unwrap<Order>(http.post('/orders', b)),
  list: (params: PageQuery) => paged<Order>(http.get('/orders', { params })),
  get: (id: number | string) => unwrap<Order>(http.get(`/orders/${id}`)),
  cancel: (id: number) => unwrap<Order>(http.post(`/orders/${id}/cancel`)),
};

export const adminApi = {
  orders: (params: PageQuery) => paged<Order>(http.get('/admin/orders', { params })),
  order: (id: number | string) => unwrap<Order>(http.get(`/admin/orders/${id}`)),
  setStatus: (id: number, status: OrderStatus) =>
    unwrap<Order>(http.patch(`/admin/orders/${id}/status`, { status })),
  customers: (params: PageQuery) => paged<Customer>(http.get('/admin/customers', { params })),
  setCustomerActive: (id: number, isActive: boolean) =>
    unwrap<Customer>(http.patch(`/admin/customers/${id}/active`, { isActive })),
};
