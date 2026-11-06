<script setup lang="ts">
defineProps<{ title: string; text?: string }>();
</script>

<template>
  <div class="flex flex-col items-center rounded-tile border border-dashed border-line px-6 py-16 text-center">
    <h3 class="text-xl font-semibold tracking-tight">{{ title }}</h3>
    <p v-if="text" class="mt-2 max-w-sm text-muted">{{ text }}</p>
    <div v-if="$slots.default" class="mt-6"><slot /></div>
  </div>
</template>
