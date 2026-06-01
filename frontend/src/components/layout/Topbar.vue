<script setup lang="ts">
import ThemeToggle from '@/components/ui/ThemeToggle.vue';
import CommandPalette from '@/components/layout/CommandPalette.vue';
import CreateFileModal from '@/components/ui/modals/CreateFileModal.vue';
import IconSearch from '@/components/ui/icons/IconSearch.vue';
import IconChevronDown from '@/components/ui/icons/IconChevronDown.vue';
import IconFilePlus from '@/components/ui/icons/IconFilePlus.vue';
import IconShare from '@/components/ui/icons/IconShare.vue';
import IconDownload from '@/components/ui/icons/IconDownload.vue';
import IconPlay from '@/components/ui/icons/IconPlay.vue';
import { useEditor, useLayout, useExamples, useTerminal } from '@/composables';
import type { PanelPosition } from '@/composables/useLayout';
import { ref } from 'vue';

const { selectedFile, content, shareUrl } = useEditor();
const { terminalPosition, setPosition } = useLayout();
const { examples, loadExample, createFile, downloadFile } = useExamples();
const { isRunning, stopCode } = useTerminal();

const emit = defineEmits<{
  (e: 'run'): void;
  (e: 'fileChange', file: string): void;
  (e: 'logoClick'): void;
}>();

const positions: { pos: PanelPosition; label: string; icon: string }[] = [
  {
    pos: 'right',
    label: 'Terminal right',
    icon: '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="9" y="1" width="6" height="14" rx="1"/><rect x="1" y="1" width="7" height="14" rx="1" opacity="0.4"/></svg>',
  },
  {
    pos: 'left',
    label: 'Terminal left',
    icon: '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="14" rx="1"/><rect x="8" y="1" width="7" height="14" rx="1" opacity="0.4"/></svg>',
  },
  {
    pos: 'bottom',
    label: 'Terminal bottom',
    icon: '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="9" width="14" height="6" rx="1"/><rect x="1" y="1" width="14" height="7" rx="1" opacity="0.4"/></svg>',
  },
  {
    pos: 'top',
    label: 'Terminal top',
    icon: '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="14" height="6" rx="1"/><rect x="1" y="8" width="14" height="7" rx="1" opacity="0.4"/></svg>',
  },
];

const showExamplesDropdown = ref(false);
const showCreateModal = ref(false);
const showLogoTooltip = ref(false);

const commandPalette = ref<InstanceType<typeof CommandPalette>>();

const handleSelectExample = (fileName: string): void => {
  loadExample(content, selectedFile, fileName);
  emit('fileChange', fileName);
  showExamplesDropdown.value = false;
};

const handleCreateFile = (name: string): void => {
  createFile(content, selectedFile, name);
  emit('fileChange', name + '.xcx');
  showCreateModal.value = false;
};

const showCopied = ref(false);

const handleShare = (): void => {
  shareUrl();
  showCopied.value = true;
  window.history.replaceState(null, '', shareUrl());
  setTimeout(() => showCopied.value = false, 2000);
};

const handleDownload = (): void => {
  downloadFile(content.value, selectedFile.value);
};
</script>

<template>
  <header class="flex items-center justify-between px-4 h-11 bg-bg-secondary border-b border-border">

    <!-- LEFT: Logo -->
    <div
      class="relative flex items-center gap-2.5 cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-200"
      @click="emit('logoClick')"
      @mouseenter="showLogoTooltip = true"
      @mouseleave="showLogoTooltip = false"
    >
      <img src="@/assets/img/logo.png" alt="xcx" class="h-6 w-auto" />
      <span class="hidden sm:inline text-text-dim font-normal text-xs ml-1">playground</span>

      <!-- Tooltip -->
      <Transition name="tooltip">
        <div
          v-if="showLogoTooltip"
          class="absolute left-0 top-full mt-2 px-2 py-1 bg-bg-tertiary border border-border rounded text-xs text-text whitespace-nowrap z-50"
        >
          Open menu
        </div>
      </Transition>
    </div>

    <div class="flex items-center gap-1.5">
<button
  type="button"
  class="group flex items-center gap-2 px-3 py-1 bg-bg-tertiary text-text-dim text-xs font-medium rounded-full hover:bg-border hover:text-text transition-colors"
  title="Search files (Ctrl+P)"
  @click="commandPalette?.open()"
>
  <IconSearch class="w-3.5 h-3.5 flex-shrink-0" />
  <span class="hidden sm:inline-block opacity-80">Search files...</span>
  <kbd class="hidden sm:inline-block ml-2 font-sans bg-bg px-1.5 py-0.5 rounded-full text-[10px] text-text-dim transition-colors group-hover:text-text">Ctrl P</kbd>
</button>

      <div class="w-px h-4 bg-border mx-1 hidden sm:block"></div>

      <button
        type="button"
        class="flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-tertiary text-text-dim text-xs
               font-medium rounded hover:bg-border hover:text-text transition-colors"
        title="Create new file"
        @click="showCreateModal = true"
      >
        <IconFilePlus class="w-3.5 h-3.5 flex-shrink-0" />
        <span class="hidden md:inline">New</span>
      </button>

      <button
        type="button"
        class="flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-tertiary text-text-dim text-xs
               font-medium rounded hover:bg-border hover:text-text transition-colors"
        title="Download current file"
        @click="handleDownload"
      >
        <IconDownload class="w-3.5 h-3.5 flex-shrink-0" />
        <span class="hidden md:inline">Download</span>
      </button>

      <div class="relative">
        <button
          type="button"
          class="flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-tertiary text-text-dim text-xs
                 font-medium rounded hover:bg-border hover:text-text transition-colors"
          @click="showExamplesDropdown = !showExamplesDropdown"
        >
          <IconFilePlus class="w-3.5 h-3.5 flex-shrink-0" />
          <span class="hidden md:inline">Examples</span>
          <IconChevronDown class="w-2.5 h-2.5 flex-shrink-0" />
        </button>
        <div
          v-if="showExamplesDropdown"
          class="absolute top-full right-0 mt-1.5 bg-bg-secondary border border-border rounded-md shadow-xl z-50 min-w-[210px]"
        >
          <div class="py-1">
            <div
              v-for="example in examples"
              :key="example.name"
              class="px-3 py-2 text-xs text-text hover:bg-bg-tertiary cursor-pointer transition-colors"
              @click="handleSelectExample(example.name)"
            >
              <div class="font-medium">{{ example.name }}</div>
              <div class="text-text-dim text-[10px] mt-0.5">{{ example.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <div class="hidden sm:flex items-center gap-0.5 border border-border rounded-md p-0.5">
        <button
          v-for="{ pos, label, icon } in positions"
          :key="pos"
          type="button"
          :title="label"
          :aria-label="label"
          class="w-6 h-6 flex items-center justify-center rounded transition-colors"
          :class="terminalPosition === pos
            ? 'bg-accent text-white'
            : 'text-text-dim hover:text-text hover:bg-bg-tertiary'"
          @click="setPosition(pos)"
        >
          <span v-html="icon" class="w-3.5 h-3.5" />
        </button>
      </div>

      <button
        type="button"
        class="flex items-center gap-1.5 px-2.5 py-1.5 border border-border text-text-dim text-xs
               font-medium rounded hover:bg-bg-tertiary hover:text-text transition-colors"
        title="Get shareable link (copied to clipboard)"
        @click="handleShare"
      >
        <IconShare class="w-3.5 h-3.5 flex-shrink-0" />
        <span class="hidden lg:inline text-accent" v-if="showCopied">Copied!</span>
        <span class="hidden lg:inline" v-else>Share</span>
      </button>

      <!-- Stop button — visible only when code is running -->
      <button
        v-if="isRunning"
        type="button"
        class="flex items-center gap-1.5 px-3.5 py-1.5 bg-accent/20 border border-accent text-accent text-xs
               font-semibold rounded hover:bg-accent hover:text-white transition-colors"
        title="Stop running program"
        @click="stopCode"
      >
        <!-- Square stop icon -->
        <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
          <rect x="1" y="1" width="10" height="10" rx="1.5"/>
        </svg>
        Stop
      </button>

      <!-- Run button — hidden when running -->
      <button
        v-else
        type="button"
        class="flex items-center gap-1.5 px-3.5 py-1.5 bg-accent text-white text-xs
               font-semibold rounded hover:opacity-90 transition-opacity"
        @click="emit('run')"
      >
        <IconPlay class="w-3 h-3" />
        Run
      </button>

      <ThemeToggle />
    </div>
  </header>

  <CreateFileModal v-model:is-open="showCreateModal" @create="handleCreateFile" />
  <CommandPalette ref="commandPalette" />
</template>

<style scoped>
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>