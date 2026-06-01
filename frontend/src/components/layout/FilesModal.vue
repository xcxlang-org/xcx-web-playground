<script setup lang="ts">
import { useEditor } from '@/composables/useEditor';
import BaseModal from '../ui/modals/BaseModal.vue';

const { sessionFiles, selectedFile } = useEditor();

const isOpen = defineModel<boolean>('isOpen', { default: false });

const FALLBACK_FILE = 'main.xcx';
const fallbackContent = () => `--- ${FALLBACK_FILE}\n`;

const handleSelect = (fileName: string) => {
  selectedFile.value = fileName;
  isOpen.value = false;
};

const handleDelete = (fileName: string, event: Event) => {
  event.stopPropagation();
  
  if (Object.keys(sessionFiles.value).length === 1) {
    delete sessionFiles.value[fileName];
    sessionFiles.value[FALLBACK_FILE] = fallbackContent();
    selectedFile.value = FALLBACK_FILE;
    return;
  }
  
  delete sessionFiles.value[fileName];
  
  if (selectedFile.value === fileName) {
    selectedFile.value = Object.keys(sessionFiles.value)[0] ?? FALLBACK_FILE;
  }
};

const handleReset = () => {
  if (confirm('Are you sure you want to delete ALL files? This action cannot be undone.')) {
    sessionFiles.value = {
      [FALLBACK_FILE]: fallbackContent()
    };
    selectedFile.value = FALLBACK_FILE;
  }
};
</script>

<template>
  <BaseModal v-model:is-open="isOpen" title="Open Files" width-class="max-w-sm">
    <div class="p-2 space-y-1 min-h-[200px]">
      <div 
        v-for="fileName in Object.keys(sessionFiles)" 
        :key="fileName"
        class="group px-4 py-2.5 rounded-md cursor-pointer transition-colors flex items-center justify-between"
        :class="selectedFile === fileName ? 'bg-accent-dim text-accent font-medium' : 'text-text hover:bg-bg-tertiary'"
        @click="handleSelect(fileName)"
      >
        <div class="flex items-center gap-3">
          <svg class="w-4 h-4 flex-shrink-0" :class="selectedFile === fileName ? 'text-accent' : 'text-text-dim'" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6l-3-3H4a1 1 0 0 0-1 1z"/>
            <polyline points="9 3 9 6 12 6"/>
          </svg>
          {{ fileName }}
        </div>
        
        <button
          class="p-1 text-text-dim opacity-0 group-hover:opacity-100 hover:text-accent transition-all rounded hover:bg-bg-secondary"
          title="Delete file"
          @click="handleDelete(fileName, $event)"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="4" x2="4" y2="12"/>
            <line x1="4" y1="4" x2="12" y2="12"/>
          </svg>
        </button>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between items-center w-full">
        <button 
          type="button"
          class="px-3 py-1.5 text-text-dim hover:text-accent hover:bg-bg border border-transparent hover:border-border transition-colors rounded text-xs font-medium flex items-center gap-1.5 opacity-80 hover:opacity-100"
          @click="handleReset"
          title="Delete all files and reset to empty state"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2.5 4h11M5.5 4v-1.5a1 1 0 011-1h3a1 1 0 011 1V4M6.5 7v4M9.5 7v4M4.5 4l.5 9.5a1 1 0 001 1h4.5a1 1 0 001-1L11.5 4"/>
          </svg>
          Clear All
        </button>
        
        <button 
          type="button"
          class="px-4 py-2 bg-bg border border-border text-text rounded text-sm font-medium hover:bg-bg-tertiary transition-colors"
          @click="isOpen = false"
        >
          Close
        </button>
      </div>
    </template>
  </BaseModal>
</template>