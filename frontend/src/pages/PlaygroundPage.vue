<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { useTheme, useEditor, useTerminal, useLayout } from '@/composables';
import Topbar from '@/components/layout/Topbar.vue';
import WorkspaceLayout from '@/components/layout/WorkspaceLayout.vue';
import Statusbar from '@/components/layout/Statusbar.vue';
import StatusbarSkeleton from '@/components/layout/StatusbarSkeleton.vue';
import Sidebar from '@/components/layout/Sidebar.vue';
import SidebarSkeleton from '@/components/layout/SidebarSkeleton.vue';

const { init: initTheme } = useTheme();
const { content, cursorLine, cursorColumn, selectedFile, sessionFiles, entryPoint } = useEditor();
const { runCode } = useTerminal();
const { terminalPosition, splitSize, isResizing, startResize, onMouseMove, stopResize } = useLayout();

const isSidebarOpen = ref(false);
const isLoading = ref(true);

const onRun = (): void => {
  const entrySource = sessionFiles.value[entryPoint.value] ?? content.value;
  runCode(entrySource, { ...sessionFiles.value });
};

onMounted(() => {
  initTheme();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isLoading.value = false;
    });
  });
});
</script>

<template>
  <div
    class="flex flex-col h-screen w-screen overflow-hidden"
    @mousemove="onMouseMove"
    @mouseup="stopResize"
    @mouseleave="stopResize"
  >
    <SidebarSkeleton v-if="isLoading && isSidebarOpen" />
    <Sidebar v-else v-model:is-open="isSidebarOpen" />
    <Topbar @run="onRun" @file-change="(f) => selectedFile = f" @logo-click="isSidebarOpen = true" />

    <WorkspaceLayout
      :is-loading="isLoading"
      :terminal-position="terminalPosition"
      :split-size="splitSize"
      :is-resizing="isResizing"
      v-model:content="content"
      @cursor-change="(l, c) => { cursorLine = l; cursorColumn = c; }"
      @start-resize="startResize"
    />

    <StatusbarSkeleton v-if="isLoading" />
    <Statusbar v-else :line="cursorLine" :column="cursorColumn" />
  </div>
</template>


