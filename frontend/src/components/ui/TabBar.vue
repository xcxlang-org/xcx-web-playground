<script setup lang="ts">
interface Props {
  tabs: string[];
  active: string;
}
defineProps<Props>();
const emit = defineEmits<{
  (e: 'change', file: string): void;
}>();
</script>

<template>
  <div class="flex items-center gap-1 bg-bg-tertiary border border-border rounded-md p-0.5">
    <button
      v-for="tab in tabs"
      :key="tab"
      type="button"
      class="px-3.5 py-1 text-xs rounded transition-colors font-medium"
      :class="active === tab ? 'bg-accent text-white' : 'text-text-dim hover:text-text'"
      @click="emit('change', tab)"
    >
      {{ tab }}
    </button>
  </div>
</template>