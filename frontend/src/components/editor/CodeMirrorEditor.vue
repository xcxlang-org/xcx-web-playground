<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { EditorView, basicSetup } from 'codemirror';
import { xcxLanguage } from '@/composables/useXcxLanguage';
import { xcxCompletions } from '@/composables/useXcxCompletions';
import { autocompletion } from '@codemirror/autocomplete';
import { EditorState, Compartment } from '@codemirror/state';
import { syntaxHighlighting } from '@codemirror/language';
import { keymap, drawSelection } from '@codemirror/view';
import { indentLess, insertTab, redo, insertNewlineAndIndent, indentSelection } from '@codemirror/commands';
import { vim } from '@replit/codemirror-vim';
import { useEditor } from '@/composables/useEditor';
import { xcxHighlightStyle, xcxEditorTheme } from '@/config/editor/theme';

const { fontSize, fontFamily, wordWrap, tabSize, vimMode, lineNumbers } = useEditor();

const settingsCompartment = new Compartment();

const getSettingsExtensions = () => {
  const exts = [
    EditorState.tabSize.of(tabSize.value)
  ];
  if (wordWrap.value) exts.push(EditorView.lineWrapping);
  if (vimMode.value) exts.push(vim());
  return exts;
};

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'cursorChange', line: number, col: number): void;
  (e: 'scroll', scrollTop: number): void;
}>();

const editorContainer = ref<HTMLElement>();
let editorView: EditorView | null = null;

const handleEnter = (view: EditorView) => {
  const state = view.state;
  if (state.selection.ranges.length === 1 && state.selection.main.empty) {
    const pos = state.selection.main.head;
    const before = state.sliceDoc(pos - 1, pos);
    const after = state.sliceDoc(pos, pos + 1);
    
    if ((before === '{' && after === '}') ||
        (before === '[' && after === ']') ||
        (before === '(' && after === ')')) {
        
        view.dispatch(state.update({
            changes: { from: pos, insert: '\n\n' },
            selection: { anchor: pos + 1 }
        }));
        
        indentSelection(view);
        return true;
    }
  }
  return insertNewlineAndIndent(view);
};

const handleTripleLess = EditorView.inputHandler.of((view, from, to, text) => {
  if (text === '<' && from >= 2) {
    const before = view.state.sliceDoc(from - 2, from);
    if (before === '<<') {
      view.dispatch({
        changes: { from: from - 2, to, insert: '<<<{}>>>' },
        selection: { anchor: from - 2 + 4 }
      });
      return true;
    }
  }
  return false;
});

const updateListener = EditorView.updateListener.of((update) => {
  if (update.docChanged) {
    const content = update.state.doc.toString();
    emit('update:modelValue', content);
  }
  if (update.selectionSet) {
    const pos = update.state.selection.main.head;
    const line = update.state.doc.lineAt(pos);
    emit('cursorChange', line.number, pos - line.from + 1);
  }
});

// scrollHandler must return boolean
const scrollListener = EditorView.scrollHandler.of((view, _event) => {
  emit('scroll', view.scrollDOM.scrollTop);
  return false;
});

onMounted(() => {
  if (!editorContainer.value) return;

  const startState = EditorState.create({
    doc: props.modelValue,
    extensions: [
      basicSetup,
      xcxLanguage,
      xcxLanguage.data.of({ autocomplete: xcxCompletions }),
      autocompletion(),
      handleTripleLess,
      updateListener,
      scrollListener,
      keymap.of([
        { key: 'Tab', run: insertTab },
        { key: 'Shift-Tab', run: indentLess },
        { key: 'Enter', run: handleEnter },
        { key: 'Mod-y', run: redo },
      ]),
      drawSelection({ cursorBlinkRate: 1200 }),
      settingsCompartment.of(getSettingsExtensions()),
      syntaxHighlighting(xcxHighlightStyle),
      xcxEditorTheme,
    ],
  });

  editorView = new EditorView({
    state: startState,
    parent: editorContainer.value,
  });
});

watch([wordWrap, tabSize, vimMode], () => {
  if (editorView) {
    editorView.dispatch({
      effects: settingsCompartment.reconfigure(getSettingsExtensions())
    });
  }
});

watch(() => props.modelValue, (newValue) => {
  if (editorView && newValue !== editorView.state.doc.toString()) {
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: newValue,
      },
    });
  }
});

onBeforeUnmount(() => {
  if (editorView) {
    editorView.destroy();
    editorView = null;
  }
});
</script>

<template>
  <div 
    ref="editorContainer" 
    class="flex-1 overflow-hidden h-full cm-host"
    :class="{ 'hide-line-numbers': !lineNumbers }"
    :style="{ '--editor-font-size': fontSize + 'px', '--editor-font-family': fontFamily }"
  ></div>
</template>

<style scoped>
.cm-host :deep(.cm-editor) {
  height: 100%;
  outline: none;
}
.cm-host :deep(.cm-scroller) {
  height: 100%;
  overflow: auto;
}
.cm-host :deep(.cm-content) {
  outline: none;
  border: none;
}
.cm-host :deep(.cm-activeLine) {
  border: none !important;
  box-shadow: none !important;
}
.cm-host.hide-line-numbers :deep(.cm-gutters) {
  display: none !important;
}
.cm-host.hide-line-numbers :deep(.cm-activeLineGutter) {
  display: none !important;
}
</style>