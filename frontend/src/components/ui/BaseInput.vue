<script setup lang="ts">
import { useId } from 'vue';
import { AlertCircle } from 'lucide-vue-next';

withDefaults(
  defineProps<{
    label: string;
    type?: string;
    error?: string;
    hint?: string;
    textarea?: boolean;
    rows?: number;
    placeholder?: string;
    autocomplete?: string;
    required?: boolean;
    min?: number | string;
    step?: number | string;
  }>(),
  { type: 'text', rows: 3 },
);

const model = defineModel<string>({ default: '' });
const id = useId();
</script>

<template>
  <div class="flex flex-col gap-2">
    <label :for="id" class="text-sm font-medium text-soft">{{ label }}</label>

    <textarea
      v-if="textarea"
      :id="id"
      v-model="model"
      :rows="rows"
      :placeholder="placeholder"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${id}-error` : undefined"
      class="w-full resize-y rounded-xl border bg-surface px-4 py-3 text-paper placeholder:text-muted focus:border-paper focus:outline-none"
      :class="error ? 'border-soft' : 'border-line'"
    />
    <input
      v-else
      :id="id"
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :required="required"
      :min="min"
      :step="step"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${id}-error` : undefined"
      class="h-12 w-full rounded-xl border bg-surface px-4 text-paper placeholder:text-muted focus:border-paper focus:outline-none"
      :class="error ? 'border-soft' : 'border-line'"
    />

    <p v-if="error" :id="`${id}-error`" class="flex items-center gap-1.5 text-sm text-paper">
      <AlertCircle class="size-4 shrink-0" aria-hidden="true" />
      {{ error }}
    </p>
    <p v-else-if="hint" class="text-sm text-muted">{{ hint }}</p>
  </div>
</template>
