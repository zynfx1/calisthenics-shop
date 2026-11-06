<script setup lang="ts">
import { ref, watch } from 'vue';
import { ImagePlus } from 'lucide-vue-next';
import { uploadsApi } from '@/api/endpoints';
import { apiError } from '@/utils/errors';
import BaseButton from '@/components/ui/BaseButton.vue';

defineProps<{ error?: string }>();
const emit = defineEmits<{ uploading: [boolean] }>();
const model = defineModel<string>({ default: '' });

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const input = ref<HTMLInputElement>();
const uploading = ref(false);
const dragging = ref(false);
const localError = ref('');
const broken = ref(false);

watch(model, () => (broken.value = false));
watch(uploading, (v) => emit('uploading', v));

async function handleFile(file: File | undefined) {
  if (!file) return;
  localError.value = '';
  // Quick checks here for instant feedback; the server validates again.
  if (!TYPES.includes(file.type)) {
    localError.value = 'Use a JPG, PNG, WebP or GIF image.';
    return;
  }
  if (file.size > MAX_BYTES) {
    localError.value = 'Image must be 5 MB or smaller.';
    return;
  }

  uploading.value = true;
  try {
    model.value = await uploadsApi.productImage(file);
  } catch (e) {
    localError.value = apiError(e).message;
  } finally {
    uploading.value = false;
    if (input.value) input.value.value = ''; // allow picking the same file again
  }
}

const onPick = (e: Event) => handleFile((e.target as HTMLInputElement).files?.[0]);
const onDrop = (e: DragEvent) => {
  dragging.value = false;
  handleFile(e.dataTransfer?.files?.[0]);
};
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-sm font-medium text-soft">Product image</span>

    <div
      class="flex items-center gap-4 rounded-2xl border border-dashed p-4 transition-colors"
      :class="dragging ? 'border-paper bg-raised' : 'border-line'"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <div class="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-raised">
        <img
          v-if="model && !broken"
          :src="model"
          alt="Product preview"
          class="size-full object-cover"
          @error="broken = true"
        />
        <ImagePlus v-else class="size-7 text-muted" aria-hidden="true" />
        <div v-if="uploading" class="absolute inset-0 grid place-items-center bg-void/70">
          <span class="size-5 animate-spin rounded-full border-2 border-paper border-t-transparent" aria-label="Uploading" />
        </div>
      </div>

      <div class="min-w-0 flex-1">
        <p class="text-sm text-soft">{{ model ? 'Drop a new image to replace it.' : 'Drag an image here, or choose a file.' }}</p>
        <p class="mt-0.5 text-sm text-muted">JPG, PNG, WebP or GIF, up to 5 MB.</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <BaseButton variant="secondary" size="sm" :disabled="uploading" @click="input?.click()">
            {{ model ? 'Replace image' : 'Choose image' }}
          </BaseButton>
          <BaseButton v-if="model" variant="ghost" size="sm" :disabled="uploading" @click="model = ''">Remove</BaseButton>
        </div>
      </div>

      <input ref="input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="sr-only" tabindex="-1" @change="onPick" />
    </div>

    <p v-if="localError || error" class="text-sm text-paper" role="alert">{{ localError || error }}</p>
  </div>
</template>
