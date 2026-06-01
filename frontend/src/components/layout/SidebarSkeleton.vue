<script setup lang="ts">
import Skeleton from '@/components/ui/Skeleton.vue';
</script>

<template>
  <aside class="fixed left-0 top-0 bottom-0 w-72 bg-bg-secondary border-r border-border z-50 shadow-2xl">
    <div class="flex flex-col h-full">
      <!-- Header skeleton -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-border">
        <Skeleton class="h-5 w-24" />
        <Skeleton class="h-6 w-6 rounded" />
      </div>

      <!-- Clock skeleton -->
      <div class="px-4 py-4 border-b border-border">
        <Skeleton class="h-8 w-full mx-auto" />
      </div>

      <!-- Menu items skeleton -->
      <div class="flex-1 overflow-y-auto py-2 flex flex-col">
        <div v-for="i in 6" :key="i" class="px-4 py-3">
          <div class="flex items-center gap-3">
            <Skeleton class="w-5 h-5 rounded" />
            <div class="flex-1">
              <Skeleton class="h-4 w-24 mb-1" />
              <Skeleton class="h-3 w-32" />
            </div>
          </div>
        </div>
      </div>

      <!-- External links skeleton -->
      <div class="mt-auto px-4 py-8 border-t border-border flex items-center justify-center gap-6">
        <Skeleton class="w-12 h-12 rounded" />
        <Skeleton class="w-12 h-12 rounded" />
        <Skeleton class="w-10 h-10 rounded" />
      </div>

      <!-- Footer skeleton -->
      <div class="px-4 py-3 border-t border-border">
        <Skeleton class="h-3 w-24" />
      </div>
    </div>
  </aside>
</template>
