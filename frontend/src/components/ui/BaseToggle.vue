<script setup lang="ts">
defineProps<{ label: string; disabled?: boolean }>();
const model = defineModel<boolean>({ default: false });
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="model"
    :aria-label="label"
    :disabled="disabled"
    class="relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40"
    :class="model ? 'bg-paper' : 'bg-raised ring-1 ring-inset ring-line'"
    @click="model = !model"
  >
    <span
      class="absolute left-0.5 top-0.5 size-5 rounded-full transition-transform"
      :class="model ? 'translate-x-5 bg-void' : 'translate-x-0 bg-muted'"
    />
  </button>
</template>
