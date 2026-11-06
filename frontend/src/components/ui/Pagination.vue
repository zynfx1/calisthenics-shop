<script setup lang="ts">
import BaseButton from './BaseButton.vue';

defineProps<{ totalPages: number }>();
const page = defineModel<number>({ required: true });
</script>

<template>
  <nav v-if="totalPages > 1" class="mt-12 flex items-center justify-center gap-4" aria-label="Pagination">
    <BaseButton variant="secondary" size="sm" :disabled="page <= 1" @click="page--">Previous</BaseButton>
    <span class="text-sm text-muted">Page {{ page }} of {{ totalPages }}</span>
    <BaseButton variant="secondary" size="sm" :disabled="page >= totalPages" @click="page++">Next</BaseButton>
  </nav>
</template>
