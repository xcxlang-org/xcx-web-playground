<script setup lang="ts">
import { useTheme } from '@/composables';
import { onMounted } from 'vue';
const { init: initTheme } = useTheme();
onMounted(() => initTheme());
</script>

<template>
  <RouterView />
</template>