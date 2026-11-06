import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: (to, from, saved) => saved ?? (to.path === from.path ? false : { top: 0 }),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/StoreLayout.vue'),
      children: [
        { path: '', name: 'home', component: () => import('@/views/HomeView.vue') },
        { path: 'products/:id', name: 'product', component: () => import('@/views/ProductDetailView.vue') },
        { path: 'cart', name: 'cart', meta: { role: 'CUSTOMER', title: 'Cart' }, component: () => import('@/views/CartView.vue') },
        { path: 'checkout', name: 'checkout', meta: { role: 'CUSTOMER', title: 'Checkout' }, component: () => import('@/views/CheckoutView.vue') },
        { path: 'orders', name: 'orders', meta: { role: 'CUSTOMER', title: 'My orders' }, component: () => import('@/views/OrdersView.vue') },
        { path: 'orders/:id', name: 'order', meta: { role: 'CUSTOMER', title: 'Order' }, component: () => import('@/views/OrderDetailView.vue') },
        { path: 'profile', name: 'profile', meta: { role: 'CUSTOMER', title: 'Profile' }, component: () => import('@/views/ProfileView.vue') },
      ],
    },
    { path: '/login', name: 'login', meta: { guestOnly: true, title: 'Sign in' }, component: () => import('@/views/LoginView.vue') },
    { path: '/register', name: 'register', meta: { guestOnly: true, title: 'Create account' }, component: () => import('@/views/RegisterView.vue') },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { role: 'ADMIN' },
      redirect: { name: 'admin-products' },
      children: [
        { path: 'products', name: 'admin-products', meta: { title: 'Products' }, component: () => import('@/views/admin/AdminProductsView.vue') },
        { path: 'categories', name: 'admin-categories', meta: { title: 'Categories' }, component: () => import('@/views/admin/AdminCategoriesView.vue') },
        { path: 'orders', name: 'admin-orders', meta: { title: 'Orders' }, component: () => import('@/views/admin/AdminOrdersView.vue') },
        { path: 'orders/:id', name: 'admin-order', meta: { title: 'Order' }, component: () => import('@/views/admin/AdminOrderDetailView.vue') },
        { path: 'customers', name: 'admin-customers', meta: { title: 'Customers' }, component: () => import('@/views/admin/AdminCustomersView.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.init();

  // `role` can sit on a parent route (e.g. /admin), so check every matched record.
  const requiredRole = to.matched.find((r) => r.meta.role)?.meta.role;
  const home = auth.isAdmin ? { name: 'admin-products' } : { name: 'home' };

  if (requiredRole) {
    if (!auth.user) return { name: 'login', query: { redirect: to.fullPath } };
    if (auth.user.role !== requiredRole) return home;
  }
  if (to.meta.guestOnly && auth.user) return home;
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Calisthenics Shop` : 'Calisthenics Shop';
});

export default router;
