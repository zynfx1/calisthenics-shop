import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { authApi } from '@/api/endpoints';
import { onSessionChange, refreshSession, setAccessToken } from '@/api/http';
import type { User } from '@/types';
import { useCartStore } from './cart';
import { useToastStore } from './toast';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  let initPromise: Promise<unknown> | null = null;

  const isAdmin = computed(() => user.value?.role === 'ADMIN');
  const isCustomer = computed(() => user.value?.role === 'CUSTOMER');

  // Fired by the HTTP layer whenever a refresh succeeds or fails.
  onSessionChange((session) => {
    const hadUser = !!user.value;
    user.value = session?.user ?? null;
    if (!session && hadUser) handleExpired();
  });

  async function handleExpired() {
    useCartStore().reset();
    useToastStore().push('Your session expired. Sign in again.');
    const { default: router } = await import('@/router');
    const current = router.currentRoute.value;
    if (current.matched.some((r) => r.meta.role)) {
      router.push({ name: 'login', query: { redirect: current.fullPath } });
    }
  }

  /** Called once by the router guard: restores the session from the refresh cookie. */
  function init() {
    initPromise ??= refreshSession();
    return initPromise;
  }

  async function login(email: string, password: string) {
    const session = await authApi.login({ email, password });
    setAccessToken(session.accessToken);
    user.value = session.user;
    return session.user;
  }

  async function register(name: string, email: string, password: string) {
    await authApi.register({ name, email, password });
    return login(email, password);
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      /* clear locally either way */
    } finally {
      setAccessToken(null);
      user.value = null;
      useCartStore().reset();
    }
  }

  function setName(name: string) {
    if (user.value) user.value = { ...user.value, name };
  }

  return { user, isAdmin, isCustomer, init, login, register, logout, setName };
});
