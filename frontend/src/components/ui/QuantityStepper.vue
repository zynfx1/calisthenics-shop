<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next';

const props = withDefaults(defineProps<{ max?: number; min?: number; disabled?: boolean }>(), { min: 1 });
const model = defineModel<number>({ required: true });

const set = (n: number) => {
  const upper = props.max ?? Infinity;
  model.value = Math.min(Math.max(n, props.min), upper);
};
</script>

<template>
  <div class="inline-flex items-center rounded-full border border-line">
    <button
      type="button"
      class="grid size-10 place-items-center rounded-full text-soft hover:bg-raised hover:text-paper disabled:opacity-30"
      :disabled="disabled || model <= min"
      aria-label="Decrease quantity"
      @click="set(model - 1)"
    >
      <Minus class="size-4" />
    </button>
    <span class="w-8 text-center text-sm font-medium tabular-nums" aria-live="polite">{{ model }}</span>
    <button
      type="button"
      class="grid size-10 place-items-center rounded-full text-soft hover:bg-raised hover:text-paper disabled:opacity-30"
      :disabled="disabled || (max !== undefined && model >= max)"
      aria-label="Increase quantity"
      @click="set(model + 1)"
    >
      <Plus class="size-4" />
    </button>
  </div>
</template>
