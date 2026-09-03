<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import { useEditor } from '@/composables/useEditor';

const CodeMirrorEditor = defineAsyncComponent(() => import('./CodeMirrorEditor.vue'));

const { sessionFiles, selectedFile, entryPoint } = useEditor();

defineProps<{ modelValue: string }>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'cursorChange', line: number, col: number): void;
}>();

const handleTabClose = (name: string, ev: MouseEvent) => {
  ev.stopPropagation();
  const keys = Object.keys(sessionFiles.value);
  if (keys.length === 1) return; // at least one file required
  delete sessionFiles.value[name];
  if (entryPoint.value === name) entryPoint.value = Object.keys(sessionFiles.value)[0] ?? '';
  if (selectedFile.value === name) selectedFile.value = Object.keys(sessionFiles.value)[0] ?? '';
};
</script>

<template>
  <div class="flex flex-col h-full w-full">
    <!-- Tab bar -->
    <div class="flex items-center overflow-x-auto bg-bg-secondary border-b border-border flex-shrink-0 min-h-[34px] scrollbar-none">
      <button
        v-for="name in Object.keys(sessionFiles)"
        :key="name"
        class="group relative flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium whitespace-nowrap border-r border-border transition-colors flex-shrink-0"
        :class="selectedFile === name
          ? 'bg-code-bg text-code-text border-t-2 border-t-accent -mt-px'
          : 'text-text-dim hover:bg-bg-tertiary hover:text-text'"
        @click="selectedFile = name"
        :title="name"
      >
        <!-- Entry point star -->
        <span
          class="transition-opacity"
          :class="entryPoint === name ? 'text-accent opacity-100' : 'text-text-dim opacity-0 group-hover:opacity-60'"
          :title="entryPoint === name ? 'Entry point' : 'Set as entry point'"
          @click.stop="entryPoint = name"
        >
          <svg class="w-2.5 h-2.5" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 1l1.4 3h3.1l-2.5 1.8.9 3L6 7l-2.9 1.8.9-3L1.5 4h3.1z"/>
          </svg>
        </span>

        <span class="max-w-[120px] truncate">{{ name }}</span>

        <!-- Close button -->
        <span
          v-if="Object.keys(sessionFiles).length > 1"
          class="opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-accent transition-opacity ml-0.5"
          title="Close file"
          @click.stop="handleTabClose(name, $event)"
        >
          <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/>
          </svg>
        </span>
      </button>
    </div>

    <!-- Editor -->
    <div class="flex-1 overflow-hidden bg-code-bg w-full">
      <CodeMirrorEditor
        :model-value="modelValue"
        @update:model-value="(v) => emit('update:modelValue', v)"
        @cursor-change="(l, c) => emit('cursorChange', l, c)"
      />
    </div>
  </div>
</template>