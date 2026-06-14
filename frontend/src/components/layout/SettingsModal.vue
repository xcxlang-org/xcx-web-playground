<script setup lang="ts">
import { useEditor } from '@/composables/useEditor';
import BaseModal from '../ui/modals/BaseModal.vue';

const { fontSize, fontFamily, wordWrap, tabSize, vimMode, lineNumbers } = useEditor();

const isOpen = defineModel<boolean>('isOpen', { default: false });

const fonts = [
  { label: 'Default Monospace', value: 'SF Mono, ui-monospace, Menlo, Monaco, monospace' },
  { label: 'Fira Code', value: '"Fira Code", monospace' },
  { label: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
  { label: 'Source Code Pro', value: '"Source Code Pro", monospace' },
  { label: 'Inconsolata', value: '"Inconsolata", monospace' },
  { label: 'Roboto Mono', value: '"Roboto Mono", monospace' },
  { label: 'Ubuntu Mono', value: '"Ubuntu Mono", monospace' },
  { label: 'Consolas', value: 'Consolas, monospace' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'Comic Neue (Casual)', value: '"Comic Neue", cursive' },
  { label: 'Press Start 2P (Retro)', value: '"Press Start 2P", display' },
  { label: 'Inter (Sans)', value: '"Inter", sans-serif' },
  { label: 'Playfair Display (Serif)', value: '"Playfair Display", serif' },
  { label: 'Cinzel (Fancy)', value: '"Cinzel", serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
];

const sizes = [
  '12', '13', '14', '15', '16', '18', '20'
];
</script>

<template>
  <BaseModal v-model:is-open="isOpen" title="Settings" width-class="max-w-md">
    <div class="p-6 space-y-6 text-text">
      <div class="space-y-2">
        <label class="block text-sm font-medium text-text-dim">Font Family</label>
        <select 
          v-model="fontFamily"
          class="w-full bg-bg font-mono border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-text"
        >
          <option v-for="font in fonts" :key="font.value" :value="font.value">
            {{ font.label }}
          </option>
        </select>
      </div>
      
      <div class="space-y-2">
        <label class="block text-sm font-medium text-text-dim">Font Size (px)</label>
        <select 
          v-model="fontSize"
          class="w-full bg-bg font-mono border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-text"
        >
          <option v-for="size in sizes" :key="size" :value="size">
            {{ size }}px
          </option>
        </select>
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-text-dim">Tab Size (spaces)</label>
        <select 
          v-model="tabSize"
          class="w-full bg-bg font-mono border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-text"
        >
          <option :value="2">2 spaces</option>
          <option :value="4">4 spaces</option>
        </select>
      </div>

      <div class="pt-2 space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-text-dim">Word Wrap</label>
          <input type="checkbox" v-model="wordWrap" class="w-4 h-4 accent-accent" />
        </div>
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-text-dim">Show Line Numbers</label>
          <input type="checkbox" v-model="lineNumbers" class="w-4 h-4 accent-accent" />
        </div>
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-text-dim">Vim Mode</label>
          <input type="checkbox" v-model="vimMode" class="w-4 h-4 accent-accent" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end w-full">
        <button 
          type="button"
          class="px-4 py-2 bg-accent text-white rounded text-sm font-medium hover:bg-opacity-90 transition-opacity"
          @click="isOpen = false"
        >
          Done
        </button>
      </div>
    </template>
  </BaseModal>
</template>
