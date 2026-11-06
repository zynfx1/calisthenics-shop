<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router';
import { Search } from 'lucide-vue-next';
import { categoriesApi, productsApi } from '@/api/endpoints';
import type { Category, PageMeta, Product } from '@/types';
import { apiError } from '@/utils/errors';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseSelect from '@/components/ui/BaseSelect.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import Pagination from '@/components/ui/Pagination.vue';
import ProductCard from '@/components/ProductCard.vue';

const route = useRoute();
const router = useRouter();

const products = ref<Product[]>([]);
const meta = ref<PageMeta | null>(null);
const categories = ref<Category[]>([]);
const loading = ref(true);
const error = ref('');

// Filters live in the URL so they survive refresh and the back button.
const page = computed(() => Number(route.query.page) || 1);
const categoryId = computed(() => Number(route.query.category) || undefined);
const sort = computed(() => (typeof route.query.sort === 'string' ? route.query.sort : 'newest'));
const q = computed(() => (typeof route.query.q === 'string' ? route.query.q : ''));
const search = ref(q.value);

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

function setQuery(patch: Record<string, string | number | undefined>, replace = false) {
  const query: LocationQueryRaw = { ...route.query, ...patch };
  if (!('page' in patch)) delete query.page;
  for (const key of Object.keys(query)) if (query[key] === undefined || query[key] === '') delete query[key];
  return replace ? router.replace({ query }) : router.push({ query });
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const res = await productsApi.list({
      page: page.value,
      q: q.value || undefined,
      categoryId: categoryId.value,
      sort: sort.value,
    });
    products.value = res.data;
    meta.value = res.meta;
  } catch (e) {
    error.value = apiError(e).message;
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.query,
  () => {
    if (route.name === 'home') load();
  },
  { immediate: true },
);
categoriesApi.list().then((c) => (categories.value = c)).catch(() => {});

let timer: ReturnType<typeof setTimeout>;
watch(search, (value) => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (value.trim() !== q.value) setQuery({ q: value.trim() || undefined }, true);
  }, 350);
});
onBeforeUnmount(() => clearTimeout(timer));

const pageModel = computed({
  get: () => page.value,
  set: (p: number) => {
    setQuery({ page: p > 1 ? p : undefined });
    scrollToShop();
  },
});
const sortModel = computed<string | number>({
  get: () => sort.value,
  set: (value) => setQuery({ sort: value === 'newest' ? undefined : String(value) }),
});

const scrollToShop = () => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
const clearFilters = () => {
  search.value = '';
  router.push({ query: {} });
};
const hasFilters = computed(() => !!(q.value || categoryId.value));
</script>

<template>
  <section class="page-x">
    <div class="flex min-h-[68vh] flex-col justify-end pb-14 pt-24 sm:pb-20">
      <h1 class="text-[clamp(3rem,10.5vw,9rem)] font-semibold leading-[0.95] tracking-tighter">
        <span class="hero-line"><span>Strength you can</span></span>
        <span class="hero-line"><span>carry anywhere.</span></span>
      </h1>
      <div class="mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <p class="max-w-md text-lg text-soft">
          Pull-up bars, gymnastic rings, bands and parallettes for training with your own bodyweight.
        </p>
        <BaseButton size="lg" @click="scrollToShop">Shop all gear</BaseButton>
      </div>
    </div>
  </section>

  <section id="shop" class="page-x scroll-mt-20 pb-24 pt-8">
    <div class="flex flex-col gap-4 border-y border-line py-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="-mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0" role="group" aria-label="Categories">
        <button
          type="button"
          class="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors"
          :class="!categoryId ? 'bg-paper text-void' : 'border border-line text-soft hover:text-paper'"
          :aria-pressed="!categoryId"
          @click="setQuery({ category: undefined })"
        >
          All
        </button>
        <button
          v-for="c in categories"
          :key="c.id"
          type="button"
          class="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors"
          :class="categoryId === c.id ? 'bg-paper text-void' : 'border border-line text-soft hover:text-paper'"
          :aria-pressed="categoryId === c.id"
          @click="setQuery({ category: c.id })"
        >
          {{ c.name }}
        </button>
      </div>

      <div class="flex gap-3">
        <div class="relative flex-1 lg:w-64 lg:flex-none">
          <Search class="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            v-model="search"
            type="search"
            placeholder="Search gear"
            aria-label="Search gear"
            class="h-11 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-sm placeholder:text-muted focus:border-paper focus:outline-none"
          />
        </div>
        <BaseSelect v-model="sortModel" :options="sortOptions" class="w-48 [&_select]:h-11 [&_select]:rounded-full [&_select]:text-sm" />
      </div>
    </div>

    <div v-if="loading" class="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4" aria-busy="true">
      <div v-for="n in 8" :key="n">
        <div class="aspect-[4/5] animate-pulse rounded-tile bg-surface" />
        <div class="mt-4 h-4 w-2/3 animate-pulse rounded bg-surface" />
        <div class="mt-2 h-3 w-1/3 animate-pulse rounded bg-surface" />
      </div>
    </div>

    <div v-else-if="error" class="mt-10">
      <EmptyState title="Couldn’t load products" :text="error">
        <BaseButton variant="secondary" @click="load">Try again</BaseButton>
      </EmptyState>
    </div>

    <div v-else-if="!products.length" class="mt-10">
      <EmptyState
        title="No products found"
        :text="hasFilters ? 'Nothing matches those filters. Try a different search or category.' : 'New gear is on the way.'"
      >
        <BaseButton v-if="hasFilters" variant="secondary" @click="clearFilters">Clear filters</BaseButton>
      </EmptyState>
    </div>

    <template v-else>
      <p class="mt-6 text-sm text-muted">{{ meta?.total }} {{ meta?.total === 1 ? 'product' : 'products' }}</p>
      <div class="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        <ProductCard v-for="p in products" :key="p.id" :product="p" />
      </div>
      <Pagination v-model="pageModel" :total-pages="meta?.totalPages ?? 1" />
    </template>
  </section>
</template>
