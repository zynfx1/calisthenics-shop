<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Pencil, Plus, Search, Trash2 } from 'lucide-vue-next';
import { categoriesApi, productsApi } from '@/api/endpoints';
import { useToastStore } from '@/stores/toast';
import type { Category, PageMeta, Product } from '@/types';
import { apiError } from '@/utils/errors';
import { formatPrice } from '@/utils/format';
import ProductFormModal from '@/components/admin/ProductFormModal.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseSelect from '@/components/ui/BaseSelect.vue';
import BaseToggle from '@/components/ui/BaseToggle.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import Pagination from '@/components/ui/Pagination.vue';
import ProductImage from '@/components/ui/ProductImage.vue';

const toast = useToastStore();

const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const meta = ref<PageMeta | null>(null);
const loading = ref(true);
const error = ref('');

const page = ref(1);
const search = ref('');
const categoryId = ref<string | number>('');
const status = ref<string | number>('');

const formOpen = ref(false);
const editing = ref<Product | null>(null);
const deleteOpen = ref(false);
const deleting = ref<Product | null>(null);
const deleteBusy = ref(false);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const res = await productsApi.adminList({
      page: page.value,
      q: search.value.trim() || undefined,
      categoryId: categoryId.value ? Number(categoryId.value) : undefined,
      isActive: status.value ? (status.value as 'true' | 'false') : undefined,
    });
    products.value = res.data;
    meta.value = res.meta;
  } catch (e) {
    error.value = apiError(e).message;
  } finally {
    loading.value = false;
  }
}

const loadCategories = () => categoriesApi.list().then((c) => (categories.value = c)).catch(() => {});
onMounted(() => {
  load();
  loadCategories();
});

let timer: ReturnType<typeof setTimeout>;
watch(search, () => {
  clearTimeout(timer);
  timer = setTimeout(() => ((page.value = 1), load()), 350);
});
watch([categoryId, status], () => ((page.value = 1), load()));
watch(page, load);
onBeforeUnmount(() => clearTimeout(timer));

const openCreate = () => ((editing.value = null), (formOpen.value = true));
const openEdit = (p: Product) => ((editing.value = p), (formOpen.value = true));

async function toggleActive(p: Product, isActive: boolean) {
  try {
    await productsApi.update(p.id, { isActive });
    p.isActive = isActive;
    toast.push(isActive ? `${p.name} is now visible` : `${p.name} is now hidden`);
  } catch (e) {
    toast.push(apiError(e).message);
    await load();
  }
}

function askDelete(p: Product) {
  deleting.value = p;
  deleteOpen.value = true;
}
async function confirmDelete() {
  if (!deleting.value) return;
  deleteBusy.value = true;
  try {
    await productsApi.remove(deleting.value.id);
    toast.push('Product deleted');
    await load();
  } catch (e) {
    toast.push(apiError(e).message, 6000); // e.g. "appears in existing orders. Deactivate it instead."
  } finally {
    deleteBusy.value = false;
    deleteOpen.value = false;
  }
}

const th = 'px-4 py-3 text-left text-sm font-normal text-muted';
</script>

<template>
  <div>
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Products</h1>
        <p class="mt-1 text-muted">{{ meta ? `${meta.total} total` : ' ' }}</p>
      </div>
      <BaseButton @click="openCreate"><Plus class="size-4" /> New product</BaseButton>
    </header>

    <div class="mt-8 flex flex-col gap-3 sm:flex-row">
      <div class="relative flex-1">
        <Search class="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          v-model="search"
          type="search"
          placeholder="Search products"
          aria-label="Search products"
          class="h-12 w-full rounded-xl border border-line bg-surface pl-11 pr-4 placeholder:text-muted focus:border-paper focus:outline-none"
        />
      </div>
      <BaseSelect
        v-model="categoryId"
        placeholder="All categories"
        :options="categories.map((c) => ({ value: c.id, label: c.name }))"
        class="sm:w-52"
      />
      <BaseSelect
        v-model="status"
        placeholder="Any status"
        :options="[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]"
        class="sm:w-40"
      />
    </div>

    <div v-if="loading" class="mt-6 space-y-2" aria-busy="true">
      <div v-for="n in 6" :key="n" class="h-16 animate-pulse rounded-2xl bg-surface" />
    </div>

    <div v-else-if="error" class="mt-6">
      <EmptyState title="Couldn’t load products" :text="error">
        <BaseButton variant="secondary" @click="load">Try again</BaseButton>
      </EmptyState>
    </div>

    <div v-else-if="!products.length" class="mt-6">
      <EmptyState title="Nothing here yet" text="No products match. Create your first product to get started.">
        <BaseButton @click="openCreate">New product</BaseButton>
      </EmptyState>
    </div>

    <template v-else>
      <div class="mt-6 overflow-x-auto rounded-tile border border-line">
        <table class="w-full min-w-[44rem] border-collapse">
          <thead class="border-b border-line">
            <tr>
              <th :class="th">Product</th>
              <th :class="th">Category</th>
              <th :class="[th, 'text-right']">Price</th>
              <th :class="[th, 'text-right']">Stock</th>
              <th :class="th">Active</th>
              <th :class="[th, 'text-right']"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line">
            <tr v-for="p in products" :key="p.id">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <ProductImage :src="p.imageUrl" :name="p.name" class="size-12 shrink-0 rounded-xl [&>span]:text-2xl" />
                  <span class="font-medium">{{ p.name }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-soft">{{ p.category.name }}</td>
              <td class="px-4 py-3 text-right tabular-nums">{{ formatPrice(p.price) }}</td>
              <td class="px-4 py-3 text-right tabular-nums" :class="p.stock === 0 && 'text-muted'">{{ p.stock }}</td>
              <td class="px-4 py-3">
                <BaseToggle :model-value="p.isActive" :label="`${p.name} active`" @update:model-value="toggleActive(p, $event)" />
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-1">
                  <button type="button" class="rounded-full p-2.5 text-muted hover:bg-raised hover:text-paper" :aria-label="`Edit ${p.name}`" @click="openEdit(p)">
                    <Pencil class="size-4" />
                  </button>
                  <button type="button" class="rounded-full p-2.5 text-muted hover:bg-raised hover:text-paper" :aria-label="`Delete ${p.name}`" @click="askDelete(p)">
                    <Trash2 class="size-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination v-model="page" :total-pages="meta?.totalPages ?? 1" />
    </template>

    <ProductFormModal v-model="formOpen" :product="editing" :categories="categories" @saved="load" />
    <ConfirmDialog
      v-model="deleteOpen"
      title="Delete this product?"
      :message="`“${deleting?.name}” will be removed from the catalog and from any carts. If it appears in past orders, deactivate it instead.`"
      confirm-label="Delete product"
      :loading="deleteBusy"
      @confirm="confirmDelete"
    />
  </div>
</template>
