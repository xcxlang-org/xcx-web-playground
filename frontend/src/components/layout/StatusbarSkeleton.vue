<script setup lang="ts">
import Skeleton from '@/components/ui/Skeleton.vue';
</script>

<template>
  <div class="flex items-center justify-between px-4 py-1 bg-bg-tertiary border-t border-border text-xs">
    <div class="flex items-center gap-4">
      <Skeleton class="h-3 w-16" />
      <Skeleton class="h-3 w-20" />
      <Skeleton class="h-3 w-24" />
    </div>
    <div class="flex items-center gap-4">
      <Skeleton class="h-3 w-12" />
      <Skeleton class="h-3 w-12" />
      <Skeleton class="h-3 w-12" />
    </div>
  </div>
</template>
