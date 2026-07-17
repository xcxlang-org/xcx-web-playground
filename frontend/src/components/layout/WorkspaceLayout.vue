<script setup lang="ts">
import { ref } from 'vue';
import { useEditor } from '@/composables/useEditor';
import FileTree from './FileTree.vue';
import EditorPanel from '@/components/editor/EditorPanel.vue';
import EditorSkeleton from '@/components/editor/EditorSkeleton.vue';
import TerminalPanel from '@/components/terminal/TerminalPanel.vue';
import TerminalSkeleton from '@/components/terminal/TerminalSkeleton.vue';
import type { PanelPosition } from '@/composables/useLayout';
import { useLayout } from '@/composables/useLayout';

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

const { isExplorerOpen } = useEditor();
const { activeMobileTab } = useLayout();

const explorerWidth = ref<number>(parseInt(localStorage.getItem('xcx_explorer_width') || '220', 10));
const isExplorerResizing = ref(false);

const startExplorerResize = (_e: MouseEvent) => {
  isExplorerResizing.value = true;
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'col-resize';
  
  const handleMouseMove = (evt: MouseEvent) => {
    if (!isExplorerResizing.value) return;
    const newWidth = evt.clientX;
    if (newWidth > 140 && newWidth < 450) {
      explorerWidth.value = newWidth;
      localStorage.setItem('xcx_explorer_width', String(newWidth));
    }
  };
  
  const handleMouseUp = () => {
    isExplorerResizing.value = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };
  
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
};
</script>

<template>
  <main
    id="layout-main"
    class="flex flex-1 overflow-hidden min-h-0 w-full bg-bg relative"
  >
    <!-- Mobile view: Select between Editor and Terminal with tab switcher (hidden on desktop md:) -->
    <div class="flex flex-col flex-1 overflow-hidden md:hidden">
      <!-- Editor Panel Container -->
      <div v-show="activeMobileTab === 'editor'" class="flex-1 overflow-hidden flex flex-col">
        <EditorSkeleton v-if="isLoading" />
        <EditorPanel v-else v-model="content" @cursor-change="(l, c) => emit('cursorChange', l, c)" />
      </div>

      <!-- Terminal Panel Container -->
      <div v-show="activeMobileTab === 'terminal'" class="flex-1 overflow-hidden flex flex-col bg-bg-secondary">
        <TerminalSkeleton v-if="isLoading" />
        <TerminalPanel v-else />
      </div>

      <!-- Mobile Tab Bar Switcher -->
      <div class="flex border-t border-border bg-bg-secondary h-12 flex-shrink-0">
        <button
          @click="activeMobileTab = 'editor'"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
          :class="activeMobileTab === 'editor' ? 'text-accent bg-bg/50 font-semibold' : 'text-text-dim hover:text-text'"
        >
          <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <span class="text-[10px]">Editor</span>
        </button>
        <button
          @click="activeMobileTab = 'terminal'"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
          :class="activeMobileTab === 'terminal' ? 'text-accent bg-bg/50 font-semibold' : 'text-text-dim hover:text-text'"
        >
          <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span class="text-[10px]">Terminal</span>
        </button>
      </div>
    </div>

    <!-- Desktop view: Outer Row layout containing FileExplorer + Split Editor/Terminal -->
    <div class="hidden md:flex flex-1 overflow-hidden min-h-0 w-full flex-row">
      <!-- File Explorer Sidebar -->
      <aside
        v-if="isExplorerOpen"
        class="h-full flex-shrink-0 relative select-none"
        :style="{ width: `${explorerWidth}px` }"
      >
        <FileTree />
      </aside>
      <!-- Resize Bar for Explorer -->
      <div
        v-if="isExplorerOpen"
        class="w-1 h-full cursor-col-resize hover:bg-accent/40 active:bg-accent transition-colors z-20 flex-shrink-0 bg-border"
        @mousedown="startExplorerResize"
      />

      <div 
        v-if="isExplorerResizing" 
        class="absolute inset-0 z-50 cursor-col-resize"
      />

      <!-- Main Editor / Terminal Split (original div) -->
      <div
        class="flex-1 flex overflow-hidden min-h-0 relative"
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
      </div>
    </div>
  </main>
</template>