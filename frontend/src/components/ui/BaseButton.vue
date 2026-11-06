<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, type RouteLocationRaw } from 'vue-router';

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    block?: boolean;
    to?: RouteLocationRaw;
    type?: 'button' | 'submit';
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
);

const variants = {
  primary: 'bg-paper text-void hover:bg-soft',
  secondary: 'border border-line text-paper hover:bg-raised',
  ghost: 'text-soft hover:bg-raised hover:text-paper',
  danger: 'border border-paper/40 text-paper hover:bg-paper hover:text-void',
  inverse: 'bg-void text-paper hover:bg-raised',
};
const sizes = { sm: 'h-9 px-4 text-sm', md: 'h-11 px-6 text-sm', lg: 'h-14 px-8 text-base' };

const classes = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-colors',
  'disabled:pointer-events-none disabled:opacity-40',
  variants[props.variant],
  sizes[props.size],
  props.block && 'w-full',
]);
</script>

<template>
  <component
    :is="to ? RouterLink : 'button'"
    v-bind="to ? { to } : { type, disabled: disabled || loading }"
    :class="classes"
  >
    <span
      v-if="loading"
      class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot />
  </component>
</template>
