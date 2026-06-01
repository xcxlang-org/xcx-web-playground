<script setup lang="ts">
interface Props {
  title: string;
}
defineProps<Props>();
</script>

<template>
  <button
    type="button"
    class="w-6 h-6 flex items-center justify-center rounded hover:bg-bg-tertiary 
           text-text-dim hover:text-text transition-colors"
    :title="title"
    :aria-label="title"
  >
    <slot />
  </button>
</template>