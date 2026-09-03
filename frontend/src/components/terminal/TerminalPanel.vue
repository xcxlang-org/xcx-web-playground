<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useTerminal } from '@/composables';
import TerminalBody from './TerminalBody.vue';
import TerminalInput from './TerminalInput.vue';
import IconButton from '@/components/ui/IconButton.vue';
import IconTrash from '@/components/ui/icons/IconTrash.vue';

const { lines, processCommand, navigateHistory, clear, isWaitingForInput, isRunning } = useTerminal();
const termInput = ref<InstanceType<typeof TerminalInput> | null>(null);

watch([isWaitingForInput, isRunning], async ([waiting, running]) => {
  if (waiting || running) {
    await nextTick();
    if (termInput.value) {
      termInput.value.focus();
    }
  }
});

const onHistoryNav = (dir: 'up' | 'down'): void => {
  const value = navigateHistory(dir);
  if (value !== null && termInput.value) {
    const input = (termInput.value as unknown as { $el: HTMLElement }).$el?.querySelector('input');
    if (input) input.value = value;
  }
};
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between px-3.5 h-[34px] bg-bg-secondary border-b border-border">
      <span class="text-[11px] font-semibold uppercase tracking-wider text-text-dim">Terminal</span>
      <IconButton title="Clear" @click="clear">
        <IconTrash class="w-3.5 h-3.5" />
      </IconButton>
    </div>
    <TerminalBody :lines="lines" />
    <TerminalInput 
      ref="termInput"
      @submit="processCommand" 
      @history-nav="onHistoryNav" 
    />
  </div>
</template>

