<script setup lang="ts">
import type { OrderStatus } from '@/types';

defineProps<{ status: OrderStatus }>();

// Monochrome: each status is told apart by fill and weight, not hue.
const styles: Record<OrderStatus, string> = {
  PENDING: 'border border-line text-soft',
  CONFIRMED: 'bg-raised text-paper',
  SHIPPED: 'bg-soft text-void',
  DELIVERED: 'bg-paper text-void',
  CANCELLED: 'border border-line text-muted line-through',
};
const labels: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};
</script>

<template>
  <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium" :class="styles[status]">
    {{ labels[status] }}
  </span>
</template>
