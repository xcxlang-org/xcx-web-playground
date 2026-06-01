<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  (e: 'submit', command: string): void;
  (e: 'historyNav', direction: 'up' | 'down'): void;
}>();

const input = ref<HTMLInputElement | null>(null);

const onKeydown = (e: KeyboardEvent): void => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const value = input.value?.value.trim();
    if (value) {
      emit('submit', value);
      if (input.value) input.value.value = '';
    }
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    emit('historyNav', 'up');
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    emit('historyNav', 'down');
  }
};

const focus = (): void => {
  input.value?.focus();
};

defineExpose({ focus });
</script>

<template>
  <div class="flex items-center px-3 py-2 border-t border-border bg-bg-secondary">
    <span class="text-terminal-prompt text-xs select-none mr-2">❯</span>
    <input
      ref="input"
      type="text"
      class="flex-1 bg-transparent border-0 outline-none text-sm font-mono 
             text-terminal-text caret-accent placeholder-text-dim"
      placeholder="Type command..."
      @keydown="onKeydown"
    />
  </div>
</template>