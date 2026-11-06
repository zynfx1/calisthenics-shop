<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Search } from 'lucide-vue-next';
import { adminApi } from '@/api/endpoints';
import { useToastStore } from '@/stores/toast';
import type { Customer, PageMeta } from '@/types';
import { apiError } from '@/utils/errors';
import { formatDate } from '@/utils/format';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseToggle from '@/components/ui/BaseToggle.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import Pagination from '@/components/ui/Pagination.vue';

const toast = useToastStore();

const customers = ref<Customer[]>([]);
const meta = ref<PageMeta | null>(null);
const page = ref(1);
const search = ref('');
const loading = ref(true);
const error = ref('');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const res = await adminApi.customers({ page: page.value, q: search.value.trim() || undefined });
    customers.value = res.data;
    meta.value = res.meta;
  } catch (e) {
    error.value = apiError(e).message;
  } finally {
    loading.value = false;
  }
}
onMounted(load);
watch(page, load);

let timer: ReturnType<typeof setTimeout>;
watch(search, () => {
  clearTimeout(timer);
  timer = setTimeout(() => ((page.value = 1), load()), 350);
});
onBeforeUnmount(() => clearTimeout(timer));

async function toggle(c: Customer, isActive: boolean) {
  try {
    const updated = await adminApi.setCustomerActive(c.id, isActive);
    c.isActive = updated.isActive;
    toast.push(isActive ? `${c.name} can sign in again` : `${c.name} has been deactivated`);
  } catch (e) {
    toast.push(apiError(e).message);
    await load();
  }
}

const th = 'px-4 py-3 text-left text-sm font-normal text-muted';
</script>

<template>
  <div>
    <header>
      <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Customers</h1>
      <p class="mt-1 text-muted">{{ meta ? `${meta.total} registered` : ' ' }}</p>
    </header>

    <div class="relative mt-8 max-w-md">
      <Search class="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
        v-model="search"
        type="search"
        placeholder="Search by name or email"
        aria-label="Search customers"
        class="h-12 w-full rounded-xl border border-line bg-surface pl-11 pr-4 placeholder:text-muted focus:border-paper focus:outline-none"
      />
    </div>

    <div v-if="loading" class="mt-6 space-y-2" aria-busy="true">
      <div v-for="n in 5" :key="n" class="h-14 animate-pulse rounded-2xl bg-surface" />
    </div>

    <div v-else-if="error" class="mt-6">
      <EmptyState title="Couldn’t load customers" :text="error">
        <BaseButton variant="secondary" @click="load">Try again</BaseButton>
      </EmptyState>
    </div>

    <div v-else-if="!customers.length" class="mt-6">
      <EmptyState title="Nothing here yet" :text="search ? 'No customers match that search.' : 'Customers appear here after they register.'" />
    </div>

    <template v-else>
      <div class="mt-6 overflow-x-auto rounded-tile border border-line">
        <table class="w-full min-w-[40rem] border-collapse">
          <thead class="border-b border-line">
            <tr>
              <th :class="th">Name</th>
              <th :class="th">Email</th>
              <th :class="th">Joined</th>
              <th :class="[th, 'text-right']">Orders</th>
              <th :class="th">Active</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line">
            <tr v-for="c in customers" :key="c.id">
              <td class="px-4 py-4 font-medium">{{ c.name }}</td>
              <td class="px-4 py-4 text-soft">{{ c.email }}</td>
              <td class="px-4 py-4 text-muted">{{ formatDate(c.createdAt) }}</td>
              <td class="px-4 py-4 text-right tabular-nums">{{ c.orderCount }}</td>
              <td class="px-4 py-4">
                <BaseToggle :model-value="c.isActive" :label="`${c.name} active`" @update:model-value="toggle(c, $event)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination v-model="page" :total-pages="meta?.totalPages ?? 1" />
    </template>
  </div>
</template>
