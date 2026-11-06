<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { adminApi } from '@/api/endpoints';
import { ORDER_STATUSES, type Order, type OrderStatus, type PageMeta } from '@/types';
import { apiError } from '@/utils/errors';
import { formatDate, formatPrice } from '@/utils/format';
import BaseButton from '@/components/ui/BaseButton.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import Pagination from '@/components/ui/Pagination.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const orders = ref<Order[]>([]);
const meta = ref<PageMeta | null>(null);
const page = ref(1);
const status = ref<OrderStatus | ''>('');
const loading = ref(true);
const error = ref('');

const labels: Record<OrderStatus, string> = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', SHIPPED: 'Shipped', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
};

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const res = await adminApi.orders({ page: page.value, status: status.value || undefined });
    orders.value = res.data;
    meta.value = res.meta;
  } catch (e) {
    error.value = apiError(e).message;
  } finally {
    loading.value = false;
  }
}
onMounted(load);
watch(status, () => ((page.value = 1), load()));
watch(page, load);

const th = 'px-4 py-3 text-left text-sm font-normal text-muted';
</script>

<template>
  <div>
    <header>
      <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Orders</h1>
      <p class="mt-1 text-muted">{{ meta ? `${meta.total} ${status ? labels[status].toLowerCase() : 'total'}` : ' ' }}</p>
    </header>

    <div class="-mx-5 mt-8 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0" role="group" aria-label="Filter by status">
      <button
        type="button"
        class="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors"
        :class="!status ? 'bg-paper text-void' : 'border border-line text-soft hover:text-paper'"
        :aria-pressed="!status"
        @click="status = ''"
      >
        All
      </button>
      <button
        v-for="s in ORDER_STATUSES"
        :key="s"
        type="button"
        class="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors"
        :class="status === s ? 'bg-paper text-void' : 'border border-line text-soft hover:text-paper'"
        :aria-pressed="status === s"
        @click="status = s"
      >
        {{ labels[s] }}
      </button>
    </div>

    <div v-if="loading" class="mt-6 space-y-2" aria-busy="true">
      <div v-for="n in 6" :key="n" class="h-14 animate-pulse rounded-2xl bg-surface" />
    </div>

    <div v-else-if="error" class="mt-6">
      <EmptyState title="Couldn’t load orders" :text="error">
        <BaseButton variant="secondary" @click="load">Try again</BaseButton>
      </EmptyState>
    </div>

    <div v-else-if="!orders.length" class="mt-6">
      <EmptyState title="Nothing here yet" :text="status ? 'No orders with this status.' : 'Orders will show up here as customers check out.'" />
    </div>

    <template v-else>
      <div class="mt-6 overflow-x-auto rounded-tile border border-line">
        <table class="w-full min-w-[40rem] border-collapse">
          <thead class="border-b border-line">
            <tr>
              <th :class="th">Order</th>
              <th :class="th">Customer</th>
              <th :class="th">Date</th>
              <th :class="[th, 'text-right']">Total</th>
              <th :class="th">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line">
            <tr v-for="o in orders" :key="o.id" class="hover:bg-surface">
              <td class="px-4 py-4">
                <RouterLink :to="{ name: 'admin-order', params: { id: o.id } }" class="font-medium underline-offset-4 hover:underline">
                  #{{ o.id }}
                </RouterLink>
              </td>
              <td class="px-4 py-4 text-soft">{{ o.customer?.name }}</td>
              <td class="px-4 py-4 text-muted">{{ formatDate(o.createdAt) }}</td>
              <td class="px-4 py-4 text-right tabular-nums">{{ formatPrice(o.total) }}</td>
              <td class="px-4 py-4"><StatusBadge :status="o.status" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination v-model="page" :total-pages="meta?.totalPages ?? 1" />
    </template>
  </div>
</template>
