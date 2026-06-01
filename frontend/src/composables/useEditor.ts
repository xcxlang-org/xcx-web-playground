import { ref, computed, watch } from 'vue';
import LZString from 'lz-string';
import { examples } from '@/examples';

const DEFAULT_CODE = examples[0]?.content || "";

const SESSION_FILES_KEY = 'xcx_session_files';
const SELECTED_FILE_KEY = 'xcx_selected_file';

const getInitialFiles = (): Record<string, string> => {
  // URL hash takes priority (shared link)
  if (typeof window !== 'undefined' && window.location.hash.startsWith('#code=')) {
    try {
      const encoded = window.location.hash.slice(6);
      const decoded = LZString.decompressFromEncodedURIComponent(encoded);
      if (decoded) {
        return JSON.parse(decoded);
      }
    } catch (e) {
      console.error('Failed to parse code from URL', e);
    }
  }

  // Restore from localStorage session
  try {
    const saved = localStorage.getItem(SESSION_FILES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Record<string, string>;
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to restore session files from localStorage', e);
  }

  return { 'main.xcx': DEFAULT_CODE };
};

const getInitialSelectedFile = (files: Record<string, string>): string => {
  try {
    const saved = localStorage.getItem(SELECTED_FILE_KEY);
    if (saved && files[saved]) {
      return saved;
    }
  } catch (e) {
    // ignore
  }
  return Object.keys(files)[0] ?? 'main.xcx';
};

const _initialFiles = getInitialFiles();

const sessionFiles = ref<Record<string, string>>(_initialFiles);
const selectedFile = ref<string>(getInitialSelectedFile(_initialFiles));
const entryPoint = ref<string>(localStorage.getItem('xcx_entry_point') || getInitialSelectedFile(_initialFiles));

watch(entryPoint, (v) => localStorage.setItem('xcx_entry_point', v));

// Persist session files on every change (debounced via watch deep)
watch(
  sessionFiles,
  (newVal) => {
    try {
      localStorage.setItem(SESSION_FILES_KEY, JSON.stringify(newVal));
    } catch (e) {
      console.error('Failed to persist session files', e);
    }
  },
  { deep: true }
);

// Persist selected file
watch(selectedFile, (newVal) => {
  try {
    localStorage.setItem(SELECTED_FILE_KEY, newVal);
  } catch (e) {
    // ignore
  }
});

const content = computed({
  get: () => sessionFiles.value[selectedFile.value] || '',
  set: (val: string) => {
    sessionFiles.value[selectedFile.value] = val;
  }
});
const cursorLine = ref<number>(1);
const cursorColumn = ref<number>(1);
const fontSize = ref<string>(localStorage.getItem('xcx_fontSize') || '13');
const fontFamily = ref<string>(localStorage.getItem('xcx_fontFamily') || 'SF Mono, Fira Code, Cascadia Code, JetBrains Mono, monospace');
const wordWrap = ref<boolean>(JSON.parse(localStorage.getItem('xcx_wordWrap') || 'false'));
const tabSize = ref<number>(parseInt(localStorage.getItem('xcx_tabSize') || '2', 10));
const vimMode = ref<boolean>(JSON.parse(localStorage.getItem('xcx_vimMode') || 'false'));
const lineNumbers = ref<boolean>(JSON.parse(localStorage.getItem('xcx_lineNumbers') || 'true'));

watch(fontSize, (newVal) => localStorage.setItem('xcx_fontSize', newVal));
watch(fontFamily, (newVal) => localStorage.setItem('xcx_fontFamily', newVal));
watch(wordWrap, (newVal) => localStorage.setItem('xcx_wordWrap', JSON.stringify(newVal)));
watch(tabSize, (newVal) => localStorage.setItem('xcx_tabSize', newVal.toString()));
watch(vimMode, (newVal) => localStorage.setItem('xcx_vimMode', JSON.stringify(newVal)));
watch(lineNumbers, (newVal) => localStorage.setItem('xcx_lineNumbers', JSON.stringify(newVal)));

export function useEditor() {
  const files = computed(() => examples.map(e => e.name));

  const shareUrl = () => {
    const json = JSON.stringify(sessionFiles.value);
    const compressed = LZString.compressToEncodedURIComponent(json);
    const url = window.location.origin + window.location.pathname + '#code=' + compressed;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    return url;
  };

  return {
    content,
    sessionFiles,
    cursorLine,
    cursorColumn,
    selectedFile,
    entryPoint,
    files,
    fontSize,
    fontFamily,
    wordWrap,
    tabSize,
    vimMode,
    lineNumbers,
    shareUrl,
  };
}