<script setup lang="ts">
import { watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import ToastHost from '@/components/ui/ToastHost.vue';

const auth = useAuthStore();
const cart = useCartStore();

// The cart follows the signed-in customer.
watch(
  () => auth.user,
  (user) => {
    if (user?.role === 'CUSTOMER') cart.fetch().catch(() => {});
    else cart.reset();
  },
  { immediate: true },
);
</script>

<template>
  <RouterView />
  <ToastHost />
</template>
