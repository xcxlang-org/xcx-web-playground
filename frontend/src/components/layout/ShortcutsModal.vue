<script setup lang="ts">
import BaseModal from '../ui/modals/BaseModal.vue';
import IconKeyboard from '../ui/icons/IconKeyboard.vue';
const isOpen = defineModel<boolean>('isOpen', { default: false });

const shortcuts = [
  {
    category: 'Editor',
    items: [
      { keys: ['Ctrl', 'P'], description: 'Open file search' },
      { keys: ['Ctrl', 'Enter'], description: 'Run code' },
      { keys: ['Tab'], description: 'Indent (2 spaces)' },
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Ctrl', 'A'], description: 'Select all' },
      { keys: ['Ctrl', 'C'], description: 'Copy' },
      { keys: ['Ctrl', 'X'], description: 'Cut' },
      { keys: ['Ctrl', 'V'], description: 'Paste' },
    ]
  },
  {
    category: 'File Palette',
    items: [
      { keys: ['Ctrl', 'P'], description: 'Toggle file search' },
      { keys: ['↑ / ↓'], description: 'Navigate results' },
      { keys: ['↵ Enter'], description: 'Open selected file' },
      { keys: ['Esc'], description: 'Close palette' },
    ]
  },
  {
    category: 'Navigation',
    items: [
      { keys: ['Ctrl', 'Home'], description: 'Jump to top of file' },
      { keys: ['Ctrl', 'End'], description: 'Jump to end of file' },
      { keys: ['Ctrl', 'F'], description: 'Find in editor (browser)' },
    ]
  },
];
</script>

<template>
  <BaseModal v-model:is-open="isOpen" title="Keyboard Shortcuts" width-class="max-w-lg">
    <template #title>
      <div class="flex items-center gap-2.5">
        <IconKeyboard class="w-4 h-4 text-text-dim" />
        <h2 class="text-text font-medium text-sm">Keyboard Shortcuts</h2>
      </div>
    </template>
    
    <div class="divide-y divide-border">
      <div v-for="section in shortcuts" :key="section.category" class="px-4 py-4">
        <div class="text-text-dim text-[10px] font-semibold uppercase tracking-widest mb-3">{{ section.category }}</div>
        <div class="space-y-2">
          <div 
            v-for="shortcut in section.items" 
            :key="shortcut.description"
            class="flex items-center justify-between"
          >
            <span class="text-text text-sm">{{ shortcut.description }}</span>
            <div class="flex items-center gap-1">
              <kbd 
                v-for="key in shortcut.keys" 
                :key="key"
                class="font-sans bg-bg border border-border rounded px-1.5 py-0.5 text-[11px] text-text-dim leading-tight min-w-[1.5rem] text-center"
              >{{ key }}</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>
