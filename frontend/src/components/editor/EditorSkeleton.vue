<script setup lang="ts">
import Skeleton from '@/components/ui/Skeleton.vue';

const lineWidths = [75, 60, 85, 45, 90, 55, 70, 80, 40, 65, 78, 52, 88, 63, 71, 48, 83, 57, 69, 76];
</script>

<template>
  <div class="flex flex-col h-full w-full">
    <div class="flex items-center gap-2 px-4 py-2 border-b border-border">
      <Skeleton v-for="i in 3" :key="i" class="h-6 w-24 rounded" />
    </div>

    <div class="flex flex-1 overflow-hidden">
      <div class="flex flex-col py-2 px-2 bg-bg-tertiary">
        <Skeleton v-for="i in 20" :key="i" class="h-4 w-6 mb-1" />
      </div>

      <div class="flex-1 overflow-hidden py-2 px-4">
        <Skeleton
          v-for="(w, i) in lineWidths"
          :key="i"
          class="h-4 mb-1"
          :style="{ width: `${w}%` }"
        />
      </div>
    </div>
  </div>
</template>