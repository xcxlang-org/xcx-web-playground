<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useSyntaxHighlight, useEditor } from '@/composables';

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'cursorChange', line: number, col: number): void;
  (e: 'scroll', scrollTop: number): void;
}>();

const textarea = ref<HTMLTextAreaElement | null>(null);
const pre = ref<HTMLElement | null>(null);
const { cursorLine, cursorColumn } = useEditor();
const { highlighted } = useSyntaxHighlight(() => props.modelValue);

const updateCursor = (target: HTMLTextAreaElement): void => {
  const text = target.value.substring(0, target.selectionStart);
  const lines = text.split('\n');
  cursorLine.value = lines.length;
  cursorColumn.value = (lines[lines.length - 1]?.length ?? 0) + 1;
  emit('cursorChange', cursorLine.value, cursorColumn.value);
};

const handleTab = (target: HTMLTextAreaElement, e: KeyboardEvent): void => {
  if (e.key !== 'Tab') return;
  e.preventDefault();
  const start = target.selectionStart;
  const end = target.selectionEnd;
  const spaces = '  ';
  const value = target.value;
  target.value = value.substring(0, start) + spaces + value.substring(end);
  target.selectionStart = target.selectionEnd = start + spaces.length;
  emit('update:modelValue', target.value);
};

const syncScroll = (): void => {
  if (!textarea.value || !pre.value) return;
  pre.value.scrollTop = textarea.value.scrollTop;
  pre.value.scrollLeft = textarea.value.scrollLeft;
  emit('scroll', textarea.value.scrollTop);
};

const onInput = (e: Event): void => {
  const target = e.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
  updateCursor(target);
};

const onScroll = (): void => {
  syncScroll();
};

const onClick = (): void => {
  if (textarea.value) updateCursor(textarea.value);
};

const onKeydown = (e: KeyboardEvent): void => {
  if (textarea.value) handleTab(textarea.value, e);
};

watch(() => props.modelValue, async () => {
  await nextTick();
  syncScroll();
});
</script>

<template>
  <div class="flex-1 overflow-hidden relative">
    <pre ref="pre"
         class="m-0 p-3.5 pl-4 font-mono text-sm leading-relaxed
                whitespace-pre pointer-events-none text-text absolute inset-0 overflow-hidden"
         v-html="highlighted" />
    <textarea
      ref="textarea"
      class="absolute inset-0 m-0 p-3.5 pl-4 font-mono text-sm leading-relaxed
             whitespace-pre bg-transparent text-transparent
             caret-accent border-0 outline-none resize-none selection:bg-accent-dim
             overflow-auto w-full h-full"
      :value="modelValue"
      spellcheck="false"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      @input="onInput"
      @scroll="onScroll"
      @click="onClick"
      @keydown="onKeydown"
    />
  </div>
</template>