<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useEditor } from '@/composables/useEditor';

const {
  sessionFiles,
  sessionFolders,
  selectedFile,
  entryPoint,
  createFile,
  createFolder,
  deleteFile,
  deleteFolder,
  renameFile,
  renameFolder
} = useEditor();

// Expand state: folder path -> boolean. Default expanded.
const expandedFolders = ref<Record<string, boolean>>({});

// Creating: null | { parentPath: string | null; isFolder: boolean }
const creatingNode = ref<{ parentPath: string | null; isFolder: boolean } | null>(null);
// Renaming: null | string (original path)
const renamingNode = ref<string | null>(null);

const inputName = ref('');

interface TreeItem {
  path: string;
  name: string;
  isFolder: boolean;
  level: number;
}

const getTreeItems = (parent: string | null, level: number): TreeItem[] => {
  const result: TreeItem[] = [];
  const parentPrefix = parent ? parent + '/' : '';

  // Filter immediate subfolders
  const folderChildren = sessionFolders.value.filter(f => {
    if (parent === null) {
      return !f.includes('/');
    } else {
      if (!f.startsWith(parentPrefix) || f === parent) return false;
      const sub = f.slice(parentPrefix.length);
      return !sub.includes('/');
    }
  });

  // Filter immediate files
  const fileChildren = Object.keys(sessionFiles.value).filter(f => {
    if (parent === null) {
      return !f.includes('/');
    } else {
      if (!f.startsWith(parentPrefix)) return false;
      const sub = f.slice(parentPrefix.length);
      return !sub.includes('/');
    }
  });

  // Sort logically
  folderChildren.sort((a, b) => a.localeCompare(b));
  fileChildren.sort((a, b) => a.localeCompare(b));

  for (const folder of folderChildren) {
    const name = folder.slice(parentPrefix.length);
    result.push({ path: folder, name, isFolder: true, level });

    const isExpanded = expandedFolders.value[folder] !== false;
    if (isExpanded) {
      result.push(...getTreeItems(folder, level + 1));
    }
  }

  for (const file of fileChildren) {
    const name = file.slice(parentPrefix.length);
    result.push({ path: file, name, isFolder: false, level });
  }

  return result;
};

const visibleItems = computed(() => {
  const items = getTreeItems(null, 0);

  // If creating at root
  if (creatingNode.value && creatingNode.value.parentPath === null) {
    const dummy: TreeItem = {
      path: '__dummy__',
      name: '',
      isFolder: creatingNode.value.isFolder,
      level: 0
    };
    if (dummy.isFolder) {
      items.unshift(dummy);
    } else {
      let lastFolderIdx = -1;
      for (let idx = items.length - 1; idx >= 0; idx--) {
        if (items[idx]!.isFolder) {
          lastFolderIdx = idx;
          break;
        }
      }
      items.splice(lastFolderIdx + 1, 0, dummy);
    }
  }

  // If creating nested
  if (creatingNode.value && creatingNode.value.parentPath !== null) {
    const parent = creatingNode.value.parentPath;
    const parentIdx = items.findIndex(i => i.path === parent);
    if (parentIdx !== -1) {
      const parentLevel = items[parentIdx]!.level;
      let insertIdx = parentIdx + 1;
      while (insertIdx < items.length && items[insertIdx]!.level > parentLevel) {
        insertIdx++;
      }
      const dummy: TreeItem = {
        path: '__dummy__',
        name: '',
        isFolder: creatingNode.value.isFolder,
        level: parentLevel + 1
      };
      items.splice(insertIdx, 0, dummy);
    }
  }

  return items;
});

// Auto-focus input on open
watch([creatingNode, renamingNode], async ([newC, newR]) => {
  if (newC || newR) {
    await nextTick();
    const el = document.querySelector('.tree-input') as HTMLInputElement | null;
    if (el) {
      el.focus();
      if (newR) {
        const dotIdx = el.value.lastIndexOf('.');
        if (dotIdx > 0 && !visibleItems.value.find((i: TreeItem) => i.path === newR)?.isFolder) {
          el.setSelectionRange(0, dotIdx);
        } else {
          el.select();
        }
      }
    }
  }
});

const handleItemClick = (item: TreeItem) => {
  if (item.path === '__dummy__') return;
  
  if (item.isFolder) {
    // Toggle expand
    expandedFolders.value[item.path] = expandedFolders.value[item.path] === false;
  } else {
    // Select file
    selectedFile.value = item.path;
  }
};

const startCreate = (parentPath: string | null, isFolder: boolean, event?: Event) => {
  if (event) event.stopPropagation();
  
  // Expand parent folder first
  if (parentPath) {
    expandedFolders.value[parentPath] = true;
  }
  
  creatingNode.value = { parentPath, isFolder };
  inputName.value = '';
};

const cancelCreate = () => {
  creatingNode.value = null;
  inputName.value = '';
};

const submitCreate = () => {
  if (!creatingNode.value) return;
  const name = inputName.value.trim();
  if (name) {
    const parent = creatingNode.value.parentPath;
    const isFolder = creatingNode.value.isFolder;
    let fullPath = parent ? `${parent}/${name}` : name;
    
    if (isFolder) {
      createFolder(fullPath);
    } else {
      if (!fullPath.endsWith('.xcx')) {
        fullPath += '.xcx';
      }
      createFile(fullPath);
    }
  }
  creatingNode.value = null;
  inputName.value = '';
};

const startRename = (item: TreeItem, event: Event) => {
  event.stopPropagation();
  renamingNode.value = item.path;
  inputName.value = item.name;
};

const cancelRename = () => {
  renamingNode.value = null;
  inputName.value = '';
};

const submitRename = (item: TreeItem) => {
  if (!renamingNode.value) return;
  const name = inputName.value.trim();
  if (name && name !== item.name) {
    const parent = item.path.includes('/')
      ? item.path.slice(0, item.path.lastIndexOf('/'))
      : '';
    const newPath = parent ? `${parent}/${name}` : name;
    
    if (item.isFolder) {
      renameFolder(item.path, newPath);
    } else {
      renameFile(item.path, newPath);
    }
  }
  renamingNode.value = null;
  inputName.value = '';
};

const handleDeleteClick = (item: TreeItem, event: Event) => {
  event.stopPropagation();
  if (confirm(`Are you sure you want to delete ${item.isFolder ? 'folder' : 'file'} "${item.name}"?`)) {
    if (item.isFolder) {
      deleteFolder(item.path);
    } else {
      deleteFile(item.path);
    }
  }
};

const resetWorkspace = () => {
  if (confirm('Are you sure you want to reset workspace to default? All custom files will be lost.')) {
    localStorage.removeItem('xcx_session_files');
    localStorage.removeItem('xcx_session_folders');
    localStorage.removeItem('xcx_selected_file');
    localStorage.removeItem('xcx_entry_point');
    window.location.reload();
  }
};
</script>

<template>
  <div class="flex flex-col h-full bg-bg-secondary select-none text-xs border-r border-border">
    <!-- Header with VS Code action keys -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-border select-none">
      <span class="font-bold text-text-dim uppercase text-[10px] tracking-wider">Explorer</span>
      <div class="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
        <button
          @click="startCreate(null, false)"
          title="New File"
          class="p-1 hover:text-accent rounded hover:bg-bg-tertiary transition-colors"
        >
          <!-- New File SVG -->
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
        <button
          @click="startCreate(null, true)"
          title="New Folder"
          class="p-1 hover:text-accent rounded hover:bg-bg-tertiary transition-colors"
        >
          <!-- New Folder SVG -->
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
        </button>
        <button
          @click="resetWorkspace"
          title="Reset Workspace to Default"
          class="p-1 hover:text-accent rounded hover:bg-bg-tertiary transition-colors"
        >
          <!-- Reset / Refresh SVG -->
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Tree items list -->
    <div class="flex-1 overflow-y-auto py-1 font-mono text-[13px] leading-6 scrollbar-none">
      <div v-if="visibleItems.length === 0" class="p-4 text-center text-text-dim text-xs">
        Empty Workspace
      </div>
      <div
        v-for="item in visibleItems"
        :key="item.path"
        class="group flex items-center justify-between py-0.5 px-3 cursor-pointer hover:bg-bg-tertiary transition-colors relative"
        :class="[
          selectedFile === item.path && !item.isFolder
            ? 'bg-accent-dim text-accent font-medium border-l-2 border-l-accent'
            : 'text-text hover:text-text-bright'
        ]"
        :style="{ paddingLeft: `${item.level * 12 + 10}px` }"
        @click="handleItemClick(item)"
      >
        <!-- Icon and Name column -->
        <div class="flex items-center gap-1.5 flex-1 min-w-0">
          <!-- Chevron for Folder -->
          <span v-if="item.isFolder" class="text-text-dim w-3 h-3 flex items-center justify-center">
            <svg
              v-if="expandedFolders[item.path] !== false"
              class="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            <svg
              v-else
              class="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
          <!-- Indent spacing placeholder for Files to align with folders chevrons -->
          <span v-else class="w-3" />

          <!-- Folder Icon -->
          <span v-if="item.isFolder" class="text-accent flex-shrink-0">
            <svg
              v-if="expandedFolders[item.path] !== false"
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h5l2 2h9a2 2 0 012 2v5a2 2 0 01-2 2H5" />
            </svg>
            <svg
              v-else
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </span>

          <!-- File Icon -->
          <span v-else class="text-text-dim flex-shrink-0">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>

          <!-- Label OR Input edit box -->
          <input
            v-if="renamingNode === item.path || (item.path === '__dummy__' && creatingNode)"
            v-model="inputName"
            type="text"
            class="tree-input bg-bg border border-accent rounded px-1.5 py-0.5 text-xs text-text outline-none w-full font-mono font-normal"
            @keyup.enter="item.path === '__dummy__' ? submitCreate() : submitRename(item)"
            @keyup.escape="item.path === '__dummy__' ? cancelCreate() : cancelRename()"
            @blur="item.path === '__dummy__' ? submitCreate() : submitRename(item)"
          />
          <span v-else class="truncate text-text text-xs" :class="{ 'font-semibold': entryPoint === item.path }">
            {{ item.name }}
            <span v-if="entryPoint === item.path" class="text-accent text-[9px] font-bold ml-1">★</span>
          </span>
        </div>

        <!-- VS Code style hover actions -->
        <div
          v-if="item.path !== '__dummy__' && renamingNode !== item.path"
          class="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 ml-2 mr-1 absolute right-2 bg-gradient-to-l from-bg-tertiary pl-4 py-0.5 z-10"
        >
          <!-- New File inside folder -->
          <button
            v-if="item.isFolder"
            @click.stop="startCreate(item.path, false)"
            title="New File"
            class="p-0.5 text-text-dim hover:text-accent hover:bg-bg rounded transition-all"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          <!-- New Folder inside folder -->
          <button
            v-if="item.isFolder"
            @click.stop="startCreate(item.path, true)"
            title="New Folder"
            class="p-0.5 text-text-dim hover:text-accent hover:bg-bg rounded transition-all"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </button>

          <!-- Rename -->
          <button
            @click.stop="startRename(item, $event)"
            title="Rename"
            class="p-0.5 text-text-dim hover:text-accent hover:bg-bg rounded transition-all"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>

          <!-- Delete -->
          <button
            @click.stop="handleDeleteClick(item, $event)"
            title="Delete"
            class="p-0.5 text-text-dim hover:text-accent hover:bg-bg rounded transition-all"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
