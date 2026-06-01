<script setup lang="ts">
import EditorPanel from '@/components/editor/EditorPanel.vue';
import EditorSkeleton from '@/components/editor/EditorSkeleton.vue';
import TerminalPanel from '@/components/terminal/TerminalPanel.vue';
import TerminalSkeleton from '@/components/terminal/TerminalSkeleton.vue';
import type { PanelPosition } from '@/composables/useLayout';

defineProps<{
  isLoading: boolean;
  terminalPosition: PanelPosition;
  splitSize: number;
  isResizing: boolean;
}>();

const emit = defineEmits<{
  (e: 'startResize', evt: MouseEvent): void;
  (e: 'cursorChange', line: number, column: number): void;
}>();

const content = defineModel<string>('content', { required: true });
</script>

<template>
  <main
    id="layout-main"
    class="flex flex-1 overflow-hidden min-h-0 w-full bg-bg relative"
    :class="{
      'flex-row': terminalPosition === 'right' || terminalPosition === 'left',
      'flex-col': terminalPosition === 'bottom' || terminalPosition === 'top',
    }"
  >
    <div 
      v-if="isResizing" 
      class="absolute inset-0 z-50"
      :style="{ cursor: terminalPosition === 'left' || terminalPosition === 'right' ? 'col-resize' : 'row-resize' }"
    />

    <template v-if="terminalPosition === 'top'">
      <section class="flex flex-col overflow-hidden w-full flex-shrink-0 bg-bg-secondary" :style="{ height: `${100 - splitSize}%` }">
        <TerminalSkeleton v-if="isLoading" /><TerminalPanel v-else />
      </section>
      <div class="h-1 w-full flex-shrink-0 z-10 transition-colors" :class="isResizing ? 'bg-accent cursor-row-resize' : 'bg-border hover:bg-accent cursor-row-resize'" @mousedown="emit('startResize', $event)" />
      <section class="flex flex-col overflow-hidden w-full flex-1 min-h-0" :style="{ height: `${splitSize}%` }">
        <EditorSkeleton v-if="isLoading" /><EditorPanel v-else v-model="content" @cursor-change="(l, c) => emit('cursorChange', l, c)" />
      </section>
    </template>

    <template v-else-if="terminalPosition === 'left'">
      <section class="flex flex-col overflow-hidden flex-shrink-0 h-full bg-bg-secondary" :style="{ width: `${100 - splitSize}%` }">
        <TerminalSkeleton v-if="isLoading" /><TerminalPanel v-else />
      </section>
      <div class="w-1 h-full flex-shrink-0 z-10 transition-colors" :class="isResizing ? 'bg-accent cursor-col-resize' : 'bg-border hover:bg-accent cursor-col-resize'" @mousedown="emit('startResize', $event)" />
      <section class="flex flex-col overflow-hidden flex-1 min-w-0 h-full" :style="{ width: `${splitSize}%` }">
        <EditorSkeleton v-if="isLoading" /><EditorPanel v-else v-model="content" @cursor-change="(l, c) => emit('cursorChange', l, c)" />
      </section>
    </template>

    <template v-else-if="terminalPosition === 'right'">
      <section class="flex flex-col overflow-hidden flex-shrink-0 h-full" :style="{ width: `${splitSize}%` }">
        <EditorSkeleton v-if="isLoading" /><EditorPanel v-else v-model="content" @cursor-change="(l, c) => emit('cursorChange', l, c)" />
      </section>
      <div class="w-1 h-full flex-shrink-0 z-10 transition-colors" :class="isResizing ? 'bg-accent cursor-col-resize' : 'bg-border hover:bg-accent cursor-col-resize'" @mousedown="emit('startResize', $event)" />
      <section class="flex flex-col overflow-hidden flex-1 min-w-0 h-full bg-bg-secondary">
        <TerminalSkeleton v-if="isLoading" /><TerminalPanel v-else />
      </section>
    </template>

    <template v-else-if="terminalPosition === 'bottom'">
      <section class="flex flex-col overflow-hidden w-full flex-1 min-h-0" :style="{ height: `${splitSize}%` }">
        <EditorSkeleton v-if="isLoading" /><EditorPanel v-else v-model="content" @cursor-change="(l, c) => emit('cursorChange', l, c)" />
      </section>
      <div class="h-1 w-full flex-shrink-0 z-10 transition-colors" :class="isResizing ? 'bg-accent cursor-row-resize' : 'bg-border hover:bg-accent cursor-row-resize'" @mousedown="emit('startResize', $event)" />
      <section class="flex flex-col overflow-hidden w-full flex-shrink-0 bg-bg-secondary" :style="{ height: `${100 - splitSize}%` }">
        <TerminalSkeleton v-if="isLoading" /><TerminalPanel v-else />
      </section>
    </template>
  </main>
</template>