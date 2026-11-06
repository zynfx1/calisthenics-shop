import { ref } from 'vue';
import { defineStore } from 'pinia';

export interface Toast { id: number; message: string }

export const useToastStore = defineStore('toast', () => {
  const items = ref<Toast[]>([]);
  let nextId = 1;

  function push(message: string, duration = 3500) {
    const id = nextId++;
    items.value.push({ id, message });
    setTimeout(() => dismiss(id), duration);
  }
  const dismiss = (id: number) => {
    items.value = items.value.filter((t) => t.id !== id);
  };

  return { items, push, dismiss };
});
