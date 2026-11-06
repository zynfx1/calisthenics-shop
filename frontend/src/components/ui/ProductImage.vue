<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{ src?: string | null; name: string }>();
const failed = ref(false);
watch(() => props.src, () => (failed.value = false));
const initial = computed(() => props.name.trim().charAt(0).toUpperCase());
</script>

<template>
  <div class="relative overflow-hidden bg-surface">
    <img
      v-if="src && !failed"
      :src="src"
      :alt="name"
      loading="lazy"
      class="size-full object-cover"
      @error="failed = true"
    />
    <span
      v-else
      class="absolute inset-0 grid place-items-center text-[min(40vw,9rem)] font-semibold leading-none text-raised select-none"
      aria-hidden="true"
    >
      {{ initial }}
    </span>
  </div>
</template>
