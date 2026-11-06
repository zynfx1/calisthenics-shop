<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Pencil, Plus, Trash2 } from 'lucide-vue-next';
import { categoriesApi } from '@/api/endpoints';
import { useToastStore } from '@/stores/toast';
import type { Category } from '@/types';
import { apiError, fieldErrors } from '@/utils/errors';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import BaseModal from '@/components/ui/BaseModal.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import EmptyState from '@/components/ui/EmptyState.vue';

const toast = useToastStore();

const categories = ref<Category[]>([]);
const loading = ref(true);
const error = ref('');

const formOpen = ref(false);
const editing = ref<Category | null>(null);
const name = ref('');
const nameError = ref('');
const saving = ref(false);

const deleteOpen = ref(false);
const deleting = ref<Category | null>(null);
const deleteBusy = ref(false);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    categories.value = await categoriesApi.list();
  } catch (e) {
    error.value = apiError(e).message;
  } finally {
    loading.value = false;
  }
}
onMounted(load);

function openForm(category: Category | null) {
  editing.value = category;
  name.value = category?.name ?? '';
  nameError.value = '';
  formOpen.value = true;
}

async function save() {
  nameError.value = '';
  if (!name.value.trim()) {
    nameError.value = 'Enter a category name.';
    return;
  }
  saving.value = true;
  try {
    if (editing.value) await categoriesApi.update(editing.value.id, name.value.trim());
    else await categoriesApi.create(name.value.trim());
    toast.push(editing.value ? 'Category updated' : 'Category created');
    formOpen.value = false;
    await load();
  } catch (e) {
    const err = apiError(e);
    nameError.value = fieldErrors(err).name ?? (err.code === 'CATEGORY_NAME_TAKEN' ? 'A category with that name already exists.' : '');
    if (!nameError.value) toast.push(err.message);
  } finally {
    saving.value = false;
  }
}

function askDelete(c: Category) {
  deleting.value = c;
  deleteOpen.value = true;
}
async function confirmDelete() {
  if (!deleting.value) return;
  deleteBusy.value = true;
  try {
    await categoriesApi.remove(deleting.value.id);
    toast.push('Category deleted');
    await load();
  } catch (e) {
    toast.push(apiError(e).message, 6000);
  } finally {
    deleteBusy.value = false;
    deleteOpen.value = false;
  }
}

const th = 'px-4 py-3 text-left text-sm font-normal text-muted';
</script>

<template>
  <div>
    <header class="flex flex-wrap items-end justify-between gap-4">
      <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Categories</h1>
      <BaseButton @click="openForm(null)"><Plus class="size-4" /> New category</BaseButton>
    </header>

    <div v-if="loading" class="mt-8 space-y-2" aria-busy="true">
      <div v-for="n in 4" :key="n" class="h-14 animate-pulse rounded-2xl bg-surface" />
    </div>

    <div v-else-if="error" class="mt-8">
      <EmptyState title="Couldn’t load categories" :text="error">
        <BaseButton variant="secondary" @click="load">Try again</BaseButton>
      </EmptyState>
    </div>

    <div v-else-if="!categories.length" class="mt-8">
      <EmptyState title="Nothing here yet" text="Create a category before adding products.">
        <BaseButton @click="openForm(null)">New category</BaseButton>
      </EmptyState>
    </div>

    <div v-else class="mt-8 overflow-x-auto rounded-tile border border-line">
      <table class="w-full min-w-[32rem] border-collapse">
        <thead class="border-b border-line">
          <tr>
            <th :class="th">Name</th>
            <th :class="th">Slug</th>
            <th :class="[th, 'text-right']">Products</th>
            <th :class="[th, 'text-right']"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-for="c in categories" :key="c.id">
            <td class="px-4 py-4 font-medium">{{ c.name }}</td>
            <td class="px-4 py-4 text-muted">{{ c.slug }}</td>
            <td class="px-4 py-4 text-right tabular-nums">{{ c.productCount ?? 0 }}</td>
            <td class="px-4 py-2">
              <div class="flex justify-end gap-1">
                <button type="button" class="rounded-full p-2.5 text-muted hover:bg-raised hover:text-paper" :aria-label="`Edit ${c.name}`" @click="openForm(c)">
                  <Pencil class="size-4" />
                </button>
                <button type="button" class="rounded-full p-2.5 text-muted hover:bg-raised hover:text-paper" :aria-label="`Delete ${c.name}`" @click="askDelete(c)">
                  <Trash2 class="size-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseModal v-model="formOpen" :title="editing ? 'Rename category' : 'New category'">
      <form class="flex flex-col gap-5" @submit.prevent="save">
        <BaseInput v-model="name" label="Name" :error="nameError" />
        <div class="flex justify-end gap-3">
          <BaseButton variant="ghost" @click="formOpen = false">Cancel</BaseButton>
          <BaseButton type="submit" :loading="saving">{{ editing ? 'Save' : 'Create' }}</BaseButton>
        </div>
      </form>
    </BaseModal>

    <ConfirmDialog
      v-model="deleteOpen"
      title="Delete this category?"
      :message="`“${deleting?.name}” will be removed. Categories that still have products can’t be deleted.`"
      confirm-label="Delete category"
      :loading="deleteBusy"
      @confirm="confirmDelete"
    />
  </div>
</template>
