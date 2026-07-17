<script setup lang="ts">
interface Props {
  line: number;
  column: number;
}
defineProps<Props>();
</script>

<template>
  <footer class="flex items-center justify-between px-3.5 h-6 bg-bg-secondary border-t border-border text-[11px] text-text-dim">
    <div class="flex items-center gap-3.5">
      <span>xcx 4.2.0</span>
    </div>
    <div class="flex items-center gap-3.5">
      <span>Ln {{ line }}, Col {{ column }}</span>
      <span>UTF-8</span>
      <span>XCX</span>
    </div>
  </footer>
</template>