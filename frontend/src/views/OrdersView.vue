<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { ordersApi } from '@/api/endpoints';
import { useToastStore } from '@/stores/toast';
import type { Order, PageMeta } from '@/types';
import { apiError } from '@/utils/errors';
import { formatDate, formatPrice } from '@/utils/format';
import BaseButton from '@/components/ui/BaseButton.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import Pagination from '@/components/ui/Pagination.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const toast = useToastStore();

const orders = ref<Order[]>([]);
const meta = ref<PageMeta | null>(null);
const page = ref(1);
const loading = ref(true);
const error = ref('');

const cancelTarget = ref<Order | null>(null);
const cancelOpen = ref(false);
const cancelling = ref(false);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const res = await ordersApi.list({ page: page.value });
    orders.value = res.data;
    meta.value = res.meta;
  } catch (e) {
    error.value = apiError(e).message;
  } finally {
    loading.value = false;
  }
}
onMounted(load);
watch(page, load);

function askCancel(order: Order) {
  cancelTarget.value = order;
  cancelOpen.value = true;
}
async function confirmCancel() {
  if (!cancelTarget.value) return;
  cancelling.value = true;
  try {
    await ordersApi.cancel(cancelTarget.value.id);
    toast.push(`Order #${cancelTarget.value.id} cancelled`);
    cancelOpen.value = false;
    await load();
  } catch (e) {
    toast.push(apiError(e).message);
    cancelOpen.value = false;
    await load();
  } finally {
    cancelling.value = false;
  }
}
</script>

<template>
  <div class="page-x py-10 sm:py-14">
    <h1 class="text-4xl font-semibold tracking-tighter sm:text-5xl">My orders</h1>

    <div v-if="loading" class="mt-10 space-y-3" aria-busy="true">
      <div v-for="n in 3" :key="n" class="h-20 animate-pulse rounded-2xl bg-surface" />
    </div>

    <div v-else-if="error" class="mt-10">
      <EmptyState title="Couldn’t load your orders" :text="error">
        <BaseButton variant="secondary" @click="load">Try again</BaseButton>
      </EmptyState>
    </div>

    <div v-else-if="!orders.length" class="mt-10">
      <EmptyState title="No orders yet" text="When you place an order, it will show up here.">
        <BaseButton :to="{ name: 'home' }">Browse gear</BaseButton>
      </EmptyState>
    </div>

    <template v-else>
      <ul class="mt-10 divide-y divide-line border-y border-line">
        <li v-for="o in orders" :key="o.id" class="flex flex-wrap items-center gap-x-6 gap-y-3 py-5">
          <div class="min-w-28 flex-1">
            <RouterLink :to="{ name: 'order', params: { id: o.id } }" class="font-medium hover:underline">
              Order #{{ o.id }}
            </RouterLink>
            <p class="text-sm text-muted">{{ formatDate(o.createdAt) }}</p>
          </div>
          <p class="w-32 font-medium tabular-nums sm:text-right">{{ formatPrice(o.total) }}</p>
          <div class="w-28"><StatusBadge :status="o.status" /></div>
          <div class="flex gap-2">
            <BaseButton :to="{ name: 'order', params: { id: o.id } }" variant="secondary" size="sm">View</BaseButton>
            <BaseButton v-if="o.status === 'PENDING'" variant="ghost" size="sm" @click="askCancel(o)">Cancel</BaseButton>
          </div>
        </li>
      </ul>
      <Pagination v-model="page" :total-pages="meta?.totalPages ?? 1" />
    </template>

    <ConfirmDialog
      v-model="cancelOpen"
      title="Cancel this order?"
      :message="`Order #${cancelTarget?.id} will be cancelled and the items returned to stock.`"
      confirm-label="Cancel order"
      :loading="cancelling"
      @confirm="confirmCancel"
    />
  </div>
</template>
