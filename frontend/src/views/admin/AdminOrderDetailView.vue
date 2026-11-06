<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowLeft } from 'lucide-vue-next';
import { adminApi } from '@/api/endpoints';
import { useToastStore } from '@/stores/toast';
import { ORDER_TRANSITIONS, type Order, type OrderStatus } from '@/types';
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
const busy = ref(false);
const cancelOpen = ref(false);

const actionLabels: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirm order',
  SHIPPED: 'Mark as shipped',
  DELIVERED: 'Mark as delivered',
  CANCELLED: 'Cancel order',
};

// Only the next valid steps are offered; the backend re-validates anyway.
const nextStatuses = computed(() => (order.value ? ORDER_TRANSITIONS[order.value.status] : []));

onMounted(async () => {
  try {
    order.value = await adminApi.order(String(route.params.id));
  } catch (e) {
    const err = apiError(e);
    if (err.code === 'NOT_FOUND') notFound.value = true;
    else toast.push(err.message);
  } finally {
    loading.value = false;
  }
});

async function setStatus(status: OrderStatus) {
  if (!order.value) return;
  busy.value = true;
  try {
    order.value = await adminApi.setStatus(order.value.id, status);
    toast.push(`Order #${order.value.id} is now ${status.toLowerCase()}`);
  } catch (e) {
    toast.push(apiError(e).message);
  } finally {
    busy.value = false;
    cancelOpen.value = false;
  }
}
const onAction = (s: OrderStatus) => (s === 'CANCELLED' ? (cancelOpen.value = true) : setStatus(s));
</script>

<template>
  <div>
    <RouterLink :to="{ name: 'admin-orders' }" class="inline-flex items-center gap-2 text-sm text-muted hover:text-paper">
      <ArrowLeft class="size-4" /> Orders
    </RouterLink>

    <div v-if="loading" class="mt-8 h-96 animate-pulse rounded-tile bg-surface" aria-busy="true" />

    <div v-else-if="notFound || !order" class="mt-8">
      <EmptyState title="Order not found" text="It may have been mistyped.">
        <BaseButton :to="{ name: 'admin-orders' }">Back to orders</BaseButton>
      </EmptyState>
    </div>

    <template v-else>
      <header class="mt-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Order #{{ order.id }}</h1>
          <p class="mt-1 text-muted">Placed {{ formatDateTime(order.createdAt) }}</p>
        </div>
        <StatusBadge :status="order.status" />
      </header>

      <div v-if="nextStatuses.length" class="mt-8 flex flex-wrap gap-3">
        <BaseButton
          v-for="s in nextStatuses"
          :key="s"
          :variant="s === 'CANCELLED' ? 'secondary' : 'primary'"
          :loading="busy && s !== 'CANCELLED'"
          :disabled="busy"
          @click="onAction(s)"
        >
          {{ actionLabels[s] }}
        </BaseButton>
      </div>

      <div class="mt-10 grid items-start gap-10 xl:grid-cols-[1fr_22rem]">
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

        <div class="space-y-4">
          <section class="rounded-tile bg-surface p-6">
            <h2 class="font-semibold tracking-tight">Customer</h2>
            <p class="mt-3">{{ order.customer?.name }}</p>
            <p class="text-soft">{{ order.customer?.email }}</p>
          </section>
          <section class="rounded-tile bg-surface p-6">
            <h2 class="font-semibold tracking-tight">Ship to</h2>
            <p class="mt-3">{{ order.recipientName }}</p>
            <p class="text-soft">{{ order.phone }}</p>
            <p class="mt-2 whitespace-pre-line text-soft">{{ order.shippingAddress }}</p>
            <p class="mt-4 border-t border-line pt-4 text-sm text-muted">Payment: cash on delivery</p>
          </section>
        </div>
      </div>

      <ConfirmDialog
        v-model="cancelOpen"
        title="Cancel this order?"
        message="The items will be returned to stock. This can’t be undone."
        confirm-label="Cancel order"
        :loading="busy"
        @confirm="setStatus('CANCELLED')"
      />
    </template>
  </div>
</template>
