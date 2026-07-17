import { ref, computed, watch } from 'vue';
import LZString from 'lz-string';
import { examples } from '@/examples';


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

  return {
    'README.md': `# XCX Project

This is the basic project structure:
- \`src/main.xcx\`: The main entry point.
- \`README.md\`: This file.

Documentation can be found below:
- Official Documentation: http://xcxlang.com/docs/index.html
- Playground: https://xcxlang.com/
`,
    'src/main.xcx': `--- src/main.xcx
--- Basic XCX template project

>! "Hello World!";
`
  };
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
  return files['src/main.xcx'] ? 'src/main.xcx' : Object.keys(files)[0] ?? 'src/main.xcx';
};

const getInitialFolders = (files: Record<string, string>): string[] => {
  const foldersSet = new Set<string>();
  for (const file of Object.keys(files)) {
    const parts = file.split('/');
    let current = '';
    for (let i = 0; i < parts.length - 1; i++) {
      current = current ? `${current}/${parts[i]}` : parts[i]!;
      foldersSet.add(current);
    }
  }

  try {
    const saved = localStorage.getItem('xcx_session_folders');
    if (saved) {
      const parsed = JSON.parse(saved) as string[];
      if (Array.isArray(parsed)) {
        parsed.forEach(f => foldersSet.add(f));
      }
    }
  } catch (e) {
    // ignore
  }
  return Array.from(foldersSet);
};

const _initialFiles = getInitialFiles();

const sessionFiles = ref<Record<string, string>>(_initialFiles);
const sessionFolders = ref<string[]>(getInitialFolders(_initialFiles));
const selectedFile = ref<string>(getInitialSelectedFile(_initialFiles));
const entryPoint = ref<string>(localStorage.getItem('xcx_entry_point') || (_initialFiles['src/main.xcx'] ? 'src/main.xcx' : Object.keys(_initialFiles)[0] ?? 'src/main.xcx'));
const isExplorerOpen = ref<boolean>(localStorage.getItem('xcx_is_explorer_open') !== 'false');

watch(isExplorerOpen, (v) => localStorage.setItem('xcx_is_explorer_open', String(v)));
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

watch(
  sessionFolders,
  (newVal) => {
    try {
      localStorage.setItem('xcx_session_folders', JSON.stringify(newVal));
    } catch (e) {
      console.error('Failed to persist session folders', e);
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

const loadFont = (fontFamilyString: string) => {
  if (typeof document === 'undefined') return;
  const fontMap: Record<string, string> = {
    '"Fira Code"': 'Fira+Code:wght@400;500;600',
    '"JetBrains Mono"': 'JetBrains+Mono:wght@400;500;600',
    '"Source Code Pro"': 'Source+Code+Pro:wght@400;500;600',
    '"Inconsolata"': 'Inconsolata:wght@400;500;600',
    '"Roboto Mono"': 'Roboto+Mono:wght@400;500;600',
    '"Ubuntu Mono"': 'Ubuntu+Mono:wght@400;700',
    '"Comic Neue"': 'Comic+Neue:wght@400;700',
    '"Press Start 2P"': 'Press+Start+2P',
    '"Inter"': 'Inter:wght@400;500;600',
    '"Playfair Display"': 'Playfair+Display:ital,wght@0,400;0,700;1,400',
    '"Cinzel"': 'Cinzel:wght@400;700'
  };

  for (const [key, familyName] of Object.entries(fontMap)) {
    if (fontFamilyString.includes(key)) {
      const id = `font-${familyName.split(':')[0]}`;
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${familyName}&display=swap`;
        document.head.appendChild(link);
      }
    }
  }
};

watch(fontSize, (newVal) => localStorage.setItem('xcx_fontSize', newVal));
watch(fontFamily, (newVal) => {
  localStorage.setItem('xcx_fontFamily', newVal);
  loadFont(newVal);
});
watch(wordWrap, (newVal) => localStorage.setItem('xcx_wordWrap', JSON.stringify(newVal)));
watch(tabSize, (newVal) => localStorage.setItem('xcx_tabSize', newVal.toString()));
watch(vimMode, (newVal) => localStorage.setItem('xcx_vimMode', JSON.stringify(newVal)));
watch(lineNumbers, (newVal) => localStorage.setItem('xcx_lineNumbers', JSON.stringify(newVal)));

if (typeof document !== 'undefined') {
  loadFont(fontFamily.value);
}

export function useEditor() {
  const files = computed(() => examples.map(e => e.name));

  const createFile = (path: string, fileContent?: string) => {
    if (!path) return;
    const cleanPath = path.replace(/\\/g, '/');
    const parts = cleanPath.split('/');
    let current = '';
    for (let i = 0; i < parts.length - 1; i++) {
      current = current ? `${current}/${parts[i]}` : parts[i]!;
      if (!sessionFolders.value.includes(current)) {
        sessionFolders.value.push(current);
      }
    }
    const contentVal = fileContent !== undefined ? fileContent : `--- ${parts[parts.length - 1]}\n`;
    sessionFiles.value[cleanPath] = contentVal;
    selectedFile.value = cleanPath;
  };

  const createFolder = (path: string) => {
    if (!path) return;
    const cleanPath = path.replace(/\\/g, '/');
    if (!sessionFolders.value.includes(cleanPath)) {
      sessionFolders.value.push(cleanPath);
    }
    const parts = cleanPath.split('/');
    let current = '';
    for (let i = 0; i < parts.length - 1; i++) {
      current = current ? `${current}/${parts[i]}` : parts[i]!;
      if (!sessionFolders.value.includes(current)) {
        sessionFolders.value.push(current);
      }
    }
  };

  const deleteFile = (path: string) => {
    delete sessionFiles.value[path];
    if (selectedFile.value === path) {
      const remaining = Object.keys(sessionFiles.value);
      if (remaining.length > 0) {
        selectedFile.value = remaining[0]!;
      } else {
        createFile('main.xcx', '--- main.xcx\n');
      }
    }
    if (entryPoint.value === path) {
      entryPoint.value = selectedFile.value;
    }
  };

  const deleteFolder = (path: string) => {
    const cleanPath = path.replace(/\\/g, '/');
    const prefix = cleanPath + '/';
    sessionFolders.value = sessionFolders.value.filter(
      f => f !== cleanPath && !f.startsWith(prefix)
    );
    for (const file of Object.keys(sessionFiles.value)) {
      if (file.startsWith(prefix) || file === cleanPath) {
        deleteFile(file);
      }
    }
  };

  const renameFile = (oldPath: string, newPath: string) => {
    if (oldPath === newPath) return;
    const fileContent = sessionFiles.value[oldPath] || '';
    delete sessionFiles.value[oldPath];
    createFile(newPath, fileContent);
    if (selectedFile.value === oldPath) {
      selectedFile.value = newPath;
    }
    if (entryPoint.value === oldPath) {
      entryPoint.value = newPath;
    }
  };

  const renameFolder = (oldPath: string, newPath: string) => {
    if (oldPath === newPath) return;
    const oldPrefix = oldPath + '/';
    const newPrefix = newPath + '/';

    sessionFolders.value = sessionFolders.value.map(f => {
      if (f === oldPath) return newPath;
      if (f.startsWith(oldPrefix)) {
        return newPrefix + f.slice(oldPrefix.length);
      }
      return f;
    });

    for (const [file, valContent] of Object.entries(sessionFiles.value)) {
      if (file.startsWith(oldPrefix)) {
        const renamedFile = newPrefix + file.slice(oldPrefix.length);
        delete sessionFiles.value[file];
        sessionFiles.value[renamedFile] = valContent;
        if (selectedFile.value === file) {
          selectedFile.value = renamedFile;
        }
        if (entryPoint.value === file) {
          entryPoint.value = renamedFile;
        }
      }
    }
  };

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
    sessionFolders,
    isExplorerOpen,
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
    createFile,
    createFolder,
    deleteFile,
    deleteFolder,
    renameFile,
    renameFolder,
  };
}