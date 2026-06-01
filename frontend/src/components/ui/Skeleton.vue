<script setup lang="ts">
interface Props {
  className?: string;
}

withDefaults(defineProps<Props>(), {
  className: '',
});
</script>

<template>
  <div
    class="animate-shimmer bg-gray-200 dark:bg-bg-tertiary rounded relative overflow-hidden"
    :class="className"
  >
    <div class="absolute inset-0 -translate-x-full animate-shimmer-slide bg-gradient-to-r from-transparent via-gray-300 dark:via-bg-secondary to-transparent" />
  </div>
</template>

<style scoped>
@keyframes shimmer-slide {
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer-slide {
  animation: shimmer-slide 2s infinite;
}
</style>