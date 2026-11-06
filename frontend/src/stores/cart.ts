import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { cartApi } from '@/api/endpoints';
import type { Cart } from '@/types';

const empty = (): Cart => ({ items: [], itemCount: 0, subtotal: 0 });

export const useCartStore = defineStore('cart', () => {
  const cart = ref<Cart>(empty());
  const loaded = ref(false);

  const count = computed(() => cart.value.itemCount);
  const hasUnavailable = computed(() => cart.value.items.some((i) => !i.isAvailable));

  async function fetch() {
    cart.value = await cartApi.get();
    loaded.value = true;
  }
  async function add(productId: number, quantity: number) {
    cart.value = await cartApi.add(productId, quantity);
  }
  async function setQuantity(productId: number, quantity: number) {
    cart.value = await cartApi.setQuantity(productId, quantity);
  }
  async function remove(productId: number) {
    cart.value = await cartApi.remove(productId);
  }
  function reset() {
    cart.value = empty();
    loaded.value = false;
  }

  return { cart, loaded, count, hasUnavailable, fetch, add, setQuantity, remove, reset };
});
