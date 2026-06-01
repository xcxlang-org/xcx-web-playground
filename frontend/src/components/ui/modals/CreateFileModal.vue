<script setup lang="ts">
import { ref } from 'vue';

const isOpen = defineModel<boolean>('isOpen', { default: false });
const emit = defineEmits<{ (e: 'create', filename: string): void }>();
const newFileName = ref('');

const handleCreateFile = () => {
  if (newFileName.value.trim()) {
    emit('create', newFileName.value.trim());
    newFileName.value = '';
    isOpen.value = false;
  }
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="isOpen = false"
  >
    <div class="bg-bg-secondary border border-border rounded-lg p-4 w-96 shadow-2xl">
      <h3 class="text-sm font-semibold mb-3">Create new file</h3>
      <input
        v-model="newFileName"
        type="text"
        placeholder="filename"
        class="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-sm text-text placeholder-text-dim outline-none focus:border-accent transition-colors"
        @keyup.enter="handleCreateFile"
      />
      <div class="flex justify-end gap-2 mt-4">
        <button
          type="button"
          class="px-3 py-1.5 text-xs text-text-dim hover:text-text transition-colors"
          @click="isOpen = false"
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-xs bg-accent text-white rounded hover:opacity-90 transition-opacity"
          @click="handleCreateFile"
        >
          Create
        </button>
      </div>
    </div>
  </div>
</template>
