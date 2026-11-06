<script setup lang="ts">
import { useToastStore } from '@/stores/toast';

const toasts = useToastStore();
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4"
    role="status"
    aria-live="polite"
  >
    <button
      v-for="t in toasts.items"
      :key="t.id"
      type="button"
      class="pointer-events-auto rounded-full bg-paper px-5 py-3 text-sm font-medium text-void shadow-2xl shadow-black"
      @click="toasts.dismiss(t.id)"
    >
      {{ t.message }}
    </button>
  </div>
</template>
