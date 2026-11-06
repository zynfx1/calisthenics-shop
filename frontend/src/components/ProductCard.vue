<script setup lang="ts">
import type { Product } from '@/types';
import { formatPrice } from '@/utils/format';
import ProductImage from './ui/ProductImage.vue';

defineProps<{ product: Product }>();
</script>

<template>
  <RouterLink :to="{ name: 'product', params: { id: product.id } }" class="group block">
    <div class="relative">
      <ProductImage
        :src="product.imageUrl"
        :name="product.name"
        class="aspect-[4/5] rounded-tile [&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-105"
      />
      <span
        v-if="product.stock === 0"
        class="absolute left-3 top-3 rounded-full bg-void px-3 py-1 text-xs font-medium text-soft"
      >
        Sold out
      </span>
    </div>
    <div class="mt-4 flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h3 class="truncate font-medium">{{ product.name }}</h3>
        <p class="mt-0.5 text-sm text-muted">{{ product.category.name }}</p>
      </div>
      <p class="shrink-0 font-medium tabular-nums">{{ formatPrice(product.price) }}</p>
    </div>
  </RouterLink>
</template>
