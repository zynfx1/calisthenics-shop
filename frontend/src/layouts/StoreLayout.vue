<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ChevronDown, ShoppingBag } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import BaseButton from '@/components/ui/BaseButton.vue';

const auth = useAuthStore();
const cart = useCartStore();
const route = useRoute();
const router = useRouter();

const menuOpen = ref(false);
const menuRef = ref<HTMLElement>();

const onDocClick = (e: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) menuOpen.value = false;
};
onMounted(() => document.addEventListener('click', onDocClick));
onBeforeUnmount(() => document.removeEventListener('click', onDocClick));
watch(() => route.fullPath, () => (menuOpen.value = false));

async function signOut() {
  menuOpen.value = false;
  await auth.logout();
  router.push({ name: 'home' });
}
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <header class="sticky top-0 z-40 border-b border-line bg-void/80 backdrop-blur-md">
      <div class="page-x flex h-16 items-center justify-between">
        <RouterLink to="/" class="text-xl font-semibold tracking-tight">calishop</RouterLink>

        <nav class="flex items-center gap-1 sm:gap-2" aria-label="Main">
          <RouterLink
            v-if="auth.isCustomer"
            :to="{ name: 'cart' }"
            class="relative grid size-11 place-items-center rounded-full text-soft hover:bg-raised hover:text-paper"
            aria-label="Cart"
          >
            <ShoppingBag class="size-5" />
            <span
              v-if="cart.count > 0"
              class="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-paper px-1 text-[10px] font-semibold leading-4 text-void"
            >
              {{ cart.count }}
            </span>
          </RouterLink>

          <template v-if="!auth.user">
            <BaseButton to="/login" variant="ghost" size="sm">Sign in</BaseButton>
            <BaseButton to="/register" size="sm">Create account</BaseButton>
          </template>

          <div v-else ref="menuRef" class="relative">
            <button
              type="button"
              class="flex h-11 items-center gap-2 rounded-full px-4 text-sm text-soft hover:bg-raised hover:text-paper"
              :aria-expanded="menuOpen"
              aria-haspopup="menu"
              @click="menuOpen = !menuOpen"
            >
              <span class="max-w-28 truncate">{{ auth.user.name }}</span>
              <ChevronDown class="size-4" />
            </button>
            <div
              v-if="menuOpen"
              role="menu"
              class="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 text-sm shadow-2xl shadow-black"
            >
              <template v-if="auth.isAdmin">
                <RouterLink role="menuitem" :to="{ name: 'admin-products' }" class="block rounded-xl px-3 py-2.5 hover:bg-raised">
                  Dashboard
                </RouterLink>
              </template>
              <template v-else>
                <RouterLink role="menuitem" :to="{ name: 'orders' }" class="block rounded-xl px-3 py-2.5 hover:bg-raised">
                  My orders
                </RouterLink>
                <RouterLink role="menuitem" :to="{ name: 'profile' }" class="block rounded-xl px-3 py-2.5 hover:bg-raised">
                  Profile
                </RouterLink>
              </template>
              <button
                type="button"
                role="menuitem"
                class="block w-full rounded-xl px-3 py-2.5 text-left text-soft hover:bg-raised hover:text-paper"
                @click="signOut"
              >
                Sign out
              </button>
            </div>
          </div>
        </nav>
      </div>
    </header>

    <main class="flex-1"><RouterView /></main>

    <footer class="border-t border-line">
      <div class="page-x flex flex-col gap-2 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <span class="font-semibold tracking-tight text-soft">calishop</span>
        <span>Bars, rings and bands for bodyweight training. Pay on delivery.</span>
      </div>
    </footer>
  </div>
</template>
