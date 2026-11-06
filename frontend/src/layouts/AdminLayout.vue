<script setup lang="ts">
import { useRouter } from 'vue-router';
import { LogOut, Package, ShoppingBag, Tag, Users } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

const links = [
  { to: { name: 'admin-products' }, label: 'Products', icon: Package },
  { to: { name: 'admin-categories' }, label: 'Categories', icon: Tag },
  { to: { name: 'admin-orders' }, label: 'Orders', icon: ShoppingBag },
  { to: { name: 'admin-customers' }, label: 'Customers', icon: Users },
];

async function signOut() {
  await auth.logout();
  router.push({ name: 'login' });
}
</script>

<template>
  <div class="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
    <aside class="border-b border-line lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-b-0 lg:border-r">
      <div class="flex items-center justify-between px-5 py-4 lg:block lg:px-6 lg:py-8">
        <RouterLink :to="{ name: 'admin-products' }" class="text-xl font-semibold tracking-tight">calishop</RouterLink>
        <RouterLink :to="{ name: 'home' }" class="text-sm text-muted hover:text-paper lg:mt-1 lg:block">
          View store
        </RouterLink>
      </div>

      <nav class="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Admin">
        <RouterLink
          v-for="l in links"
          :key="l.label"
          :to="l.to"
          class="flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm text-soft hover:bg-raised hover:text-paper"
          active-class="bg-paper! text-void!"
        >
          <component :is="l.icon" class="size-4" />
          {{ l.label }}
        </RouterLink>
      </nav>

      <div class="hidden border-t border-line p-4 lg:block">
        <p class="truncate px-3 text-sm text-muted">{{ auth.user?.email }}</p>
        <button
          type="button"
          class="mt-2 flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-sm text-soft hover:bg-raised hover:text-paper"
          @click="signOut"
        >
          <LogOut class="size-4" />
          Sign out
        </button>
      </div>
    </aside>

    <main class="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-12"><RouterView /></main>
  </div>
</template>
