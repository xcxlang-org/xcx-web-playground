<script setup lang="ts">
import IconX from '@/components/ui/icons/IconX.vue';

const isOpen = defineModel<boolean>('isOpen', { default: false });
defineProps<{
  title: string;
  widthClass?: string;
}>();
</script>

<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div 
        class="bg-bg-secondary border border-border rounded-lg shadow-xl w-full flex flex-col overflow-hidden"
        :class="widthClass || 'max-w-md'"
        @click.stop
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-border">
          <slot name="title">
            <h2 class="text-text font-medium text-lg">{{ title }}</h2>
          </slot>
          <button 
            type="button"
            class="p-1.5 text-text-dim hover:text-text hover:bg-bg-tertiary rounded transition-colors"
            @click="isOpen = false"
          >
            <IconX class="w-5 h-5" />
          </button>
        </div>
        
        <div class="overflow-y-auto max-h-[70vh]">
          <slot />
        </div>
        
        <div v-if="$slots.footer" class="bg-bg-tertiary px-4 py-3 flex items-center border-t border-border">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>