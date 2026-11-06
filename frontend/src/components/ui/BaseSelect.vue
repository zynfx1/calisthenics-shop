<script setup lang="ts">
import { useId } from 'vue';
import { ChevronDown } from 'lucide-vue-next';

defineProps<{
  label?: string;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
  error?: string;
}>();

const model = defineModel<string | number>({ default: '' });
const id = useId();
</script>

<template>
  <div class="flex flex-col gap-2">
    <label v-if="label" :for="id" class="text-sm font-medium text-soft">{{ label }}</label>
    <div class="relative">
      <select
        :id="id"
        v-model="model"
        class="h-12 w-full appearance-none rounded-xl border bg-surface pl-4 pr-10 text-paper focus:border-paper focus:outline-none"
        :class="error ? 'border-soft' : 'border-line'"
      >
        <option v-if="placeholder" value="">{{ placeholder }}</option>
        <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <ChevronDown
        class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
    </div>
    <p v-if="error" class="text-sm text-paper">{{ error }}</p>
  </div>
</template>
