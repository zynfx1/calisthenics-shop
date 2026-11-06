<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { productsApi } from '@/api/endpoints';
import { useToastStore } from '@/stores/toast';
import type { Category, Product, ProductInput } from '@/types';
import { apiError, fieldErrors } from '@/utils/errors';
import { toCentavos } from '@/utils/format';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import BaseModal from '@/components/ui/BaseModal.vue';
import BaseSelect from '@/components/ui/BaseSelect.vue';
import BaseToggle from '@/components/ui/BaseToggle.vue';
import ImageUpload from './ImageUpload.vue';

const props = defineProps<{ product: Product | null; categories: Category[] }>();
const emit = defineEmits<{ saved: [] }>();
const open = defineModel<boolean>({ required: true });

const toast = useToastStore();
const saving = ref(false);
const imageUploading = ref(false);
const errors = ref<Record<string, string>>({});
const form = reactive({
  name: '',
  categoryId: '' as string | number,
  price: '',
  stock: '0',
  imageUrl: '',
  description: '',
  isActive: true,
});

// Reset the form every time the modal opens.
watch(open, (isOpen) => {
  if (!isOpen) return;
  const p = props.product;
  errors.value = {};
  form.name = p?.name ?? '';
  form.categoryId = p?.category.id ?? '';
  form.price = p ? String(p.price / 100) : '';
  form.stock = String(p?.stock ?? 0);
  form.imageUrl = p?.imageUrl ?? '';
  form.description = p?.description ?? '';
  form.isActive = p?.isActive ?? true;
});

async function submit() {
  errors.value = {};
  const price = Number(form.price);
  const stock = Number(form.stock);
  if (!form.name.trim()) errors.value.name = 'Give the product a name.';
  if (!form.categoryId) errors.value.categoryId = 'Choose a category.';
  if (!(price > 0)) errors.value.price = 'Enter a price above zero.';
  if (!Number.isInteger(stock) || stock < 0) errors.value.stock = 'Stock must be a whole number, 0 or more.';
  if (Object.keys(errors.value).length) return;

  const payload: ProductInput = {
    name: form.name.trim(),
    categoryId: Number(form.categoryId),
    price: toCentavos(price),
    stock,
    imageUrl: String(form.imageUrl).trim() || null,
    description: String(form.description).trim() || null,
    isActive: form.isActive,
  };

  saving.value = true;
  try {
    if (props.product) await productsApi.update(props.product.id, payload);
    else await productsApi.create(payload);
    toast.push(props.product ? 'Product updated' : 'Product created');
    emit('saved');
    open.value = false;
  } catch (e) {
    const err = apiError(e);
    errors.value = fieldErrors(err);
    if (err.code === 'CATEGORY_NOT_FOUND') errors.value.categoryId = err.message;
    else if (!Object.keys(errors.value).length) toast.push(err.message);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseModal v-model="open" :title="product ? 'Edit product' : 'New product'">
    <form class="flex flex-col gap-5" @submit.prevent="submit">
      <BaseInput v-model="form.name" label="Name" :error="errors.name" />
      <BaseSelect
        v-model="form.categoryId"
        label="Category"
        placeholder="Select a category"
        :options="categories.map((c) => ({ value: c.id, label: c.name }))"
        :error="errors.categoryId"
      />
      <div class="grid grid-cols-2 gap-4">
        <BaseInput v-model="form.price" label="Price (₱)" type="number" min="0" step="0.01" :error="errors.price" />
        <BaseInput v-model="form.stock" label="Stock" type="number" min="0" step="1" :error="errors.stock" />
      </div>
      <ImageUpload v-model="form.imageUrl" :error="errors.imageUrl" @uploading="imageUploading = $event" />
      <BaseInput v-model="form.description" label="Description" textarea :rows="4" :error="errors.description" />

      <div class="flex items-center justify-between rounded-2xl border border-line px-4 py-3">
        <div>
          <p class="text-sm font-medium">Visible in the store</p>
          <p class="text-sm text-muted">Inactive products are hidden from shoppers.</p>
        </div>
        <BaseToggle v-model="form.isActive" label="Visible in the store" />
      </div>

      <div class="mt-2 flex justify-end gap-3">
        <BaseButton variant="ghost" @click="open = false">Cancel</BaseButton>
        <BaseButton type="submit" :loading="saving" :disabled="imageUploading">{{ product ? 'Save changes' : 'Create product' }}</BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
