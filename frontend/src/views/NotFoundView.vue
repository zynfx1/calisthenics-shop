<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue';
</script>

<template>
  <div class="grid min-h-dvh place-items-center px-6 text-center">
    <div>
      <h1 class="text-5xl font-semibold tracking-tighter sm:text-7xl">That page doesn’t exist.</h1>
      <p class="mx-auto mt-4 max-w-sm text-muted">The link may be old, or the address was typed wrong.</p>
      <BaseButton to="/" class="mt-8" size="lg">Back to the shop</BaseButton>
    </div>
  </div>
</template>
