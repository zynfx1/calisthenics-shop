<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { Trash2 } from 'lucide-vue-next';
import { useCartStore } from '@/stores/cart';
import { useToastStore } from '@/stores/toast';
import type { CartItem } from '@/types';
import { apiError } from '@/utils/errors';
import { formatPrice } from '@/utils/format';
import BaseButton from '@/components/ui/BaseButton.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ProductImage from '@/components/ui/ProductImage.vue';
import QuantityStepper from '@/components/ui/QuantityStepper.vue';

const cart = useCartStore();
const toast = useToastStore();
const busy = reactive<Record<number, boolean>>({});

onMounted(() => cart.fetch().catch((e) => toast.push(apiError(e).message)));

async function run(item: CartItem, action: () => Promise<void>) {
  busy[item.productId] = true;
  try {
    await action();
  } catch (e) {
    toast.push(apiError(e).message);
  } finally {
    busy[item.productId] = false;
  }
}
const changeQuantity = (item: CartItem, qty: number) =>
  qty !== item.quantity && run(item, () => cart.setQuantity(item.productId, qty));
const remove = (item: CartItem) => run(item, () => cart.remove(item.productId));

const problem = (item: CartItem) => {
  if (item.isAvailable) return '';
  return item.stock === 0 ? 'No longer available. Remove it to continue.' : `Only ${item.stock} left. Lower the quantity to continue.`;
};
</script>

<template>
  <div class="page-x py-10 sm:py-14">
    <h1 class="text-4xl font-semibold tracking-tighter sm:text-5xl">Cart</h1>

    <div v-if="!cart.loaded" class="mt-10 space-y-4" aria-busy="true">
      <div v-for="n in 2" :key="n" class="h-28 animate-pulse rounded-tile bg-surface" />
    </div>

    <div v-else-if="!cart.cart.items.length" class="mt-10">
      <EmptyState title="Your cart is empty" text="Add some gear and it will show up here.">
        <BaseButton :to="{ name: 'home' }">Browse gear</BaseButton>
      </EmptyState>
    </div>

    <div v-else class="mt-10 grid items-start gap-12 lg:grid-cols-[1fr_24rem]">
      <ul class="divide-y divide-line border-y border-line">
        <li v-for="item in cart.cart.items" :key="item.productId" class="flex gap-4 py-6 sm:gap-6">
          <RouterLink :to="{ name: 'product', params: { id: item.productId } }" class="shrink-0">
            <ProductImage :src="item.imageUrl" :name="item.name" class="size-24 rounded-2xl sm:size-28 [&>span]:text-5xl" />
          </RouterLink>

          <div class="flex min-w-0 flex-1 flex-col justify-between gap-3">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <RouterLink :to="{ name: 'product', params: { id: item.productId } }" class="font-medium hover:underline">
                  {{ item.name }}
                </RouterLink>
                <p class="mt-0.5 text-sm text-muted">{{ formatPrice(item.unitPrice) }} each</p>
              </div>
              <p class="font-medium tabular-nums">{{ formatPrice(item.lineTotal) }}</p>
            </div>

            <p v-if="problem(item)" class="text-sm text-paper" role="alert">{{ problem(item) }}</p>

            <div class="flex items-center justify-between">
              <QuantityStepper
                :model-value="item.quantity"
                :max="item.stock"
                :disabled="busy[item.productId] || item.stock === 0"
                @update:model-value="changeQuantity(item, $event)"
              />
              <button
                type="button"
                class="rounded-full p-2.5 text-muted hover:bg-raised hover:text-paper disabled:opacity-40"
                :disabled="busy[item.productId]"
                :aria-label="`Remove ${item.name}`"
                @click="remove(item)"
              >
                <Trash2 class="size-4" />
              </button>
            </div>
          </div>
        </li>
      </ul>

      <aside class="rounded-tile bg-paper p-6 text-void sm:p-8 lg:sticky lg:top-24">
        <h2 class="text-xl font-semibold tracking-tight">Order summary</h2>
        <dl class="mt-6 space-y-3 text-sm">
          <div class="flex justify-between">
            <dt class="text-void/60">Items</dt>
            <dd class="tabular-nums">{{ cart.count }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-void/60">Subtotal</dt>
            <dd class="tabular-nums">{{ formatPrice(cart.cart.subtotal) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-void/60">Payment</dt>
            <dd>Cash on delivery</dd>
          </div>
        </dl>
        <div class="mt-6 flex items-baseline justify-between border-t border-void/15 pt-6">
          <span class="font-medium">Total</span>
          <span class="text-3xl font-semibold tracking-tight tabular-nums">{{ formatPrice(cart.cart.subtotal) }}</span>
        </div>
        <BaseButton :to="{ name: 'checkout' }" variant="inverse" size="lg" block class="mt-8" :class="cart.hasUnavailable && 'pointer-events-none opacity-40'" :aria-disabled="cart.hasUnavailable">
          Checkout
        </BaseButton>
        <p v-if="cart.hasUnavailable" class="mt-3 text-sm text-void/60">Fix the unavailable items to continue.</p>
      </aside>
    </div>
  </div>
</template>
