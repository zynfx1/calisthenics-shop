<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowLeft } from 'lucide-vue-next';
import { ordersApi } from '@/api/endpoints';
import { useToastStore } from '@/stores/toast';
import type { Order, OrderStatus } from '@/types';
import { apiError } from '@/utils/errors';
import { formatDateTime, formatPrice } from '@/utils/format';
import BaseButton from '@/components/ui/BaseButton.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const route = useRoute();
const toast = useToastStore();

const order = ref<Order | null>(null);
const loading = ref(true);
const notFound = ref(false);
const cancelOpen = ref(false);
const cancelling = ref(false);

const steps: Array<{ status: OrderStatus; label: string }> = [
  { status: 'PENDING', label: 'Placed' },
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'SHIPPED', label: 'Shipped' },
  { status: 'DELIVERED', label: 'Delivered' },
];
const currentStep = computed(() => steps.findIndex((s) => s.status === order.value?.status));

onMounted(async () => {
  try {
    order.value = await ordersApi.get(String(route.params.id));
  } catch (e) {
    const err = apiError(e);
    if (err.code === 'NOT_FOUND') notFound.value = true;
    else toast.push(err.message);
  } finally {
    loading.value = false;
  }
});

async function cancel() {
  if (!order.value) return;
  cancelling.value = true;
  try {
    order.value = await ordersApi.cancel(order.value.id);
    toast.push('Order cancelled');
  } catch (e) {
    toast.push(apiError(e).message);
  } finally {
    cancelling.value = false;
    cancelOpen.value = false;
  }
}
</script>

<template>
  <div class="page-x py-8 sm:py-12">
    <RouterLink :to="{ name: 'orders' }" class="inline-flex items-center gap-2 text-sm text-muted hover:text-paper">
      <ArrowLeft class="size-4" /> My orders
    </RouterLink>

    <div v-if="loading" class="mt-8 h-96 animate-pulse rounded-tile bg-surface" aria-busy="true" />

    <div v-else-if="notFound || !order" class="mt-8">
      <EmptyState title="Order not found" text="Check the link, or look for it in your order history.">
        <BaseButton :to="{ name: 'orders' }">My orders</BaseButton>
      </EmptyState>
    </div>

    <template v-else>
      <div class="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-4xl font-semibold tracking-tighter sm:text-5xl">Order #{{ order.id }}</h1>
          <p class="mt-2 text-muted">Placed {{ formatDateTime(order.createdAt) }}</p>
        </div>
        <StatusBadge :status="order.status" />
      </div>

      <ol v-if="order.status !== 'CANCELLED'" class="mt-10 flex items-center" aria-label="Order progress">
        <li v-for="(s, i) in steps" :key="s.status" class="flex items-center" :class="i < steps.length - 1 && 'flex-1'">
          <span class="size-3 shrink-0 rounded-full" :class="i <= currentStep ? 'bg-paper' : 'bg-line'" />
          <span class="mx-2 text-xs sm:text-sm" :class="i <= currentStep ? 'text-paper' : 'text-muted'">{{ s.label }}</span>
          <span v-if="i < steps.length - 1" class="h-px flex-1" :class="i < currentStep ? 'bg-paper' : 'bg-line'" />
        </li>
      </ol>

      <div class="mt-12 grid items-start gap-10 lg:grid-cols-[1fr_22rem]">
        <ul class="divide-y divide-line border-y border-line">
          <li v-for="item in order.items" :key="item.productId" class="flex items-center justify-between gap-4 py-5">
            <div class="min-w-0">
              <p class="truncate font-medium">{{ item.productName }}</p>
              <p class="text-sm text-muted">{{ formatPrice(item.unitPrice) }} × {{ item.quantity }}</p>
            </div>
            <p class="font-medium tabular-nums">{{ formatPrice(item.lineTotal) }}</p>
          </li>
          <li class="flex items-baseline justify-between py-5">
            <span class="font-medium">Total</span>
            <span class="text-2xl font-semibold tracking-tight tabular-nums">{{ formatPrice(order.total) }}</span>
          </li>
        </ul>

        <aside class="rounded-tile bg-surface p-6">
          <h2 class="font-semibold tracking-tight">Delivery</h2>
          <p class="mt-4">{{ order.recipientName }}</p>
          <p class="text-soft">{{ order.phone }}</p>
          <p class="mt-2 whitespace-pre-line text-soft">{{ order.shippingAddress }}</p>
          <p class="mt-6 border-t border-line pt-4 text-sm text-muted">Payment: cash on delivery</p>
          <BaseButton v-if="order.status === 'PENDING'" variant="secondary" block class="mt-6" @click="cancelOpen = true">
            Cancel order
          </BaseButton>
        </aside>
      </div>

      <ConfirmDialog
        v-model="cancelOpen"
        title="Cancel this order?"
        message="The items will be returned to stock. This can’t be undone."
        confirm-label="Cancel order"
        :loading="cancelling"
        @confirm="cancel"
      />
    </template>
  </div>
</template>
