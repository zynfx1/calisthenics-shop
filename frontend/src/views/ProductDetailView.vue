<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft } from 'lucide-vue-next';
import { productsApi } from '@/api/endpoints';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { useToastStore } from '@/stores/toast';
import type { Product } from '@/types';
import { apiError } from '@/utils/errors';
import { formatPrice } from '@/utils/format';
import BaseButton from '@/components/ui/BaseButton.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ProductImage from '@/components/ui/ProductImage.vue';
import QuantityStepper from '@/components/ui/QuantityStepper.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const cart = useCartStore();
const toast = useToastStore();

const product = ref<Product | null>(null);
const loading = ref(true);
const notFound = ref(false);
const quantity = ref(1);
const adding = ref(false);

async function load(id: string) {
  loading.value = true;
  notFound.value = false;
  quantity.value = 1;
  try {
    product.value = await productsApi.get(id);
    document.title = `${product.value.name} · Calisthenics Shop`;
  } catch (e) {
    product.value = null;
    if (apiError(e).code === 'NOT_FOUND') notFound.value = true;
    else toast.push(apiError(e).message);
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.params.id,
  (id) => {
    if (route.name === 'product') load(String(id));
  },
  { immediate: true },
);

const stockLabel = computed(() => {
  const stock = product.value?.stock ?? 0;
  if (stock === 0) return 'Sold out';
  if (stock <= 5) return `Only ${stock} left`;
  return 'In stock';
});

async function addToCart() {
  if (!product.value) return;
  if (!auth.user) {
    router.push({ name: 'login', query: { redirect: route.fullPath } });
    return;
  }
  adding.value = true;
  try {
    await cart.add(product.value.id, quantity.value);
    toast.push('Added to cart');
  } catch (e) {
    toast.push(apiError(e).message);
  } finally {
    adding.value = false;
  }
}
</script>

<template>
  <div class="page-x py-8 sm:py-12">
    <RouterLink :to="{ name: 'home' }" class="inline-flex items-center gap-2 text-sm text-muted hover:text-paper">
      <ArrowLeft class="size-4" /> All gear
    </RouterLink>

    <div v-if="loading" class="mt-8 grid gap-12 lg:grid-cols-2" aria-busy="true">
      <div class="aspect-square animate-pulse rounded-tile bg-surface lg:aspect-[4/5]" />
      <div class="space-y-4">
        <div class="h-4 w-24 animate-pulse rounded bg-surface" />
        <div class="h-12 w-3/4 animate-pulse rounded bg-surface" />
        <div class="h-8 w-32 animate-pulse rounded bg-surface" />
      </div>
    </div>

    <div v-else-if="notFound || !product" class="mt-8">
      <EmptyState title="Product not found" text="It may have been removed or is no longer for sale.">
        <BaseButton :to="{ name: 'home' }">Browse gear</BaseButton>
      </EmptyState>
    </div>

    <div v-else class="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
      <ProductImage
        :src="product.imageUrl"
        :name="product.name"
        class="aspect-square rounded-tile lg:sticky lg:top-24 lg:aspect-[4/5] lg:self-start"
      />

      <div class="flex flex-col">
        <RouterLink
          :to="{ name: 'home', query: { category: product.category.id } }"
          class="text-sm text-muted hover:text-paper"
        >
          {{ product.category.name }}
        </RouterLink>
        <h1 class="mt-2 text-4xl font-semibold tracking-tighter sm:text-6xl">{{ product.name }}</h1>
        <p class="mt-6 text-3xl font-medium tabular-nums">{{ formatPrice(product.price) }}</p>

        <p v-if="product.description" class="mt-8 max-w-prose whitespace-pre-line text-lg text-soft">
          {{ product.description }}
        </p>

        <div class="mt-10 border-t border-line pt-8">
          <p class="mb-5 text-sm" :class="product.stock === 0 ? 'text-muted' : 'text-soft'">{{ stockLabel }}</p>

          <div v-if="auth.isAdmin" class="text-sm text-muted">
            You’re signed in as admin.
            <RouterLink :to="{ name: 'admin-products' }" class="text-paper underline underline-offset-4">
              Manage products
            </RouterLink>
          </div>
          <div v-else class="flex flex-wrap items-center gap-4">
            <QuantityStepper v-model="quantity" :max="product.stock" :disabled="product.stock === 0" />
            <BaseButton size="lg" class="min-w-56 flex-1 sm:flex-none" :loading="adding" :disabled="product.stock === 0" @click="addToCart">
              {{ product.stock === 0 ? 'Sold out' : 'Add to cart' }}
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
