<script setup lang="ts">
import Skeleton from '@/components/ui/Skeleton.vue';

const lineWidths = [70, 45, 85, 55, 90, 60, 75, 40];
</script>

<template>
  <div class="flex flex-col h-full w-full">
    <div class="flex items-center justify-between px-4 py-2 border-b border-border">
      <Skeleton class="h-5 w-32" />
      <div class="flex gap-2">
        <Skeleton class="h-4 w-4 rounded" />
        <Skeleton class="h-4 w-4 rounded" />
      </div>
    </div>

    <div class="flex-1 overflow-hidden p-4 font-mono text-sm">
      <Skeleton
        v-for="(w, i) in lineWidths"
        :key="i"
        class="h-4 mb-2"
        :style="{ width: `${w}%` }"
      />
    </div>

    <div class="flex items-center gap-2 px-4 py-3 border-t border-border">
      <Skeleton class="h-4 w-6" />
      <Skeleton class="h-4 flex-1" />
    </div>
  </div>
</template>