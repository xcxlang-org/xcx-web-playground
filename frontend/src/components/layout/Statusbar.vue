<script setup lang="ts">
import { XCX_LANGUAGE_VERSION } from '@/config/version';

interface Props {
  line: number;
  column: number;
}
defineProps<Props>();
</script>

<template>
  <footer class="flex items-center justify-between px-3.5 h-6 bg-bg-secondary border-t border-border text-[11px] text-text-dim">
    <div class="flex items-center gap-3.5">
      <span>xcx {{ XCX_LANGUAGE_VERSION }}</span>
    </div>
    <div class="flex items-center gap-3.5">
      <span>Ln {{ line }}, Col {{ column }}</span>
      <span>UTF-8</span>
      <span>XCX</span>
    </div>
  </footer>
</template>