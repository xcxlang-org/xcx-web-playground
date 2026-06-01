<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  lines: number;
}
defineProps<Props>();

const el = ref<HTMLElement | null>(null);
defineExpose({ el });
</script>

<template>
  <div
    ref="el"
    class="w-12 text-right pr-3 py-3.5 font-mono text-sm leading-relaxed text-code-num select-none bg-code-bg overflow-hidden flex-shrink-0"
  >
    <div v-for="n in lines" :key="n">{{ n }}</div>
  </div>
</template>