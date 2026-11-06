<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { X } from 'lucide-vue-next';

defineProps<{ title: string }>();
const open = defineModel<boolean>({ required: true });
const dialog = ref<HTMLDialogElement>();

// Native <dialog> gives us focus trapping and Esc-to-close.
watch(
  open,
  (isOpen) =>
    nextTick(() => {
      if (isOpen && !dialog.value?.open) dialog.value?.showModal();
      if (!isOpen && dialog.value?.open) dialog.value.close();
    }),
  { immediate: true },
);

const onBackdropClick = (e: MouseEvent) => {
  if (e.target === dialog.value) open.value = false;
};
</script>

<template>
  <dialog
    ref="dialog"
    class="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-3xl border border-line bg-surface p-0 text-paper backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    @close="open = false"
    @click="onBackdropClick"
  >
    <div class="p-6 sm:p-8">
      <header class="mb-6 flex items-start justify-between gap-4">
        <h2 class="text-2xl font-semibold tracking-tight">{{ title }}</h2>
        <button
          type="button"
          class="-mr-2 -mt-1 rounded-full p-2 text-muted hover:bg-raised hover:text-paper"
          aria-label="Close"
          @click="open = false"
        >
          <X class="size-5" />
        </button>
      </header>
      <slot />
    </div>
  </dialog>
</template>
