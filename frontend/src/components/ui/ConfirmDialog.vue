<script setup lang="ts">
import BaseButton from './BaseButton.vue';
import BaseModal from './BaseModal.vue';

defineProps<{ title: string; message: string; confirmLabel: string; loading?: boolean }>();
defineEmits<{ confirm: [] }>();
const open = defineModel<boolean>({ required: true });
</script>

<template>
  <BaseModal v-model="open" :title="title">
    <p class="text-soft">{{ message }}</p>
    <div class="mt-8 flex justify-end gap-3">
      <BaseButton variant="ghost" @click="open = false">Keep it</BaseButton>
      <BaseButton :loading="loading" @click="$emit('confirm')">{{ confirmLabel }}</BaseButton>
    </div>
  </BaseModal>
</template>
