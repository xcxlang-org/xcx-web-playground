<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { TerminalLine } from '@/types';

interface Props {
  lines: TerminalLine[];
}
const props = defineProps<Props>();

const container = ref<HTMLElement | null>(null);

const scrollToBottom = async (): Promise<void> => {
  await nextTick();
  if (container.value) {
    container.value.scrollTop = container.value.scrollHeight;
  }
};

watch(() => props.lines, () => scrollToBottom(), { deep: true });
</script>

<template>
  <div 
    ref="container"
    class="flex-1 p-3 font-mono text-xs leading-relaxed overflow-auto bg-terminal-bg text-terminal-text"
  >
    <div 
      v-for="line in lines" 
      :key="line.id"
      class="mb-0.5"
      :class="{
        'text-terminal-dim': line.type === 'info',
        'text-accent': line.type === 'error',
        'text-emerald-600': line.type === 'success',
      }"
    >
      <span v-if="line.type === 'prompt'" class="text-terminal-prompt select-none">❯ </span>
      {{ line.content }}
    </div>
  </div>
</template>