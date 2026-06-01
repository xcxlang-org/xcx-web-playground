<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { useEditor } from '@/composables/useEditor';

const { sessionFiles, selectedFile } = useEditor();

const isOpen = ref(false);
const searchQuery = ref('');
const inputRef = ref<HTMLInputElement>();
const selectedIndex = ref(0);

const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

const togglePalette = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    searchQuery.value = '';
    selectedIndex.value = 0;
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
};

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'p') {
    e.preventDefault();
    togglePalette();
  }
  if (isOpen.value && e.key === 'Escape') {
    isOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});

const filteredFiles = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  const allFiles = Object.keys(sessionFiles.value);
  if (!query) return allFiles;
  
  return allFiles.filter(file => file.toLowerCase().includes(query))
    .sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(query);
      const bStarts = b.toLowerCase().startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    });
});

watch(searchQuery, () => {
  selectedIndex.value = 0;
});

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedIndex.value = (selectedIndex.value + 1) % filteredFiles.value.length;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedIndex.value = (selectedIndex.value - 1 + filteredFiles.value.length) % filteredFiles.value.length;
  } else if (e.key === 'Enter') {
    e.preventDefault();
    selectFile(filteredFiles.value[selectedIndex.value]);
  }
};

const selectFile = (fileName?: string) => {
  if (fileName) {
    selectedFile.value = fileName;
    isOpen.value = false;
  }
};

defineExpose({ open: togglePalette });
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[100] flex items-start justify-center pt-[18vh] pb-4 px-4"
      style="background: rgba(0,0,0,0.55); backdrop-filter: blur(6px);"
      @click="isOpen = false"
    >
      <div
        class="w-full max-w-lg flex flex-col overflow-hidden"
        style="
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04);
        "
        @click.stop
      >
        <!-- Search input row -->
        <div
          class="flex items-center gap-3 px-4"
          style="padding-top: 14px; padding-bottom: 14px; border-bottom: 1px solid var(--border);"
        >
          <!-- Magnifier -->
          <svg
            class="flex-shrink-0"
            style="width:16px;height:16px;color:var(--accent);opacity:0.85;"
            viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round"
          >
            <circle cx="6.5" cy="6.5" r="4.5"/>
            <line x1="10.5" y1="10.5" x2="14" y2="14"/>
          </svg>

          <input
            ref="inputRef"
            v-model="searchQuery"
            type="text"
            class="flex-1 bg-transparent outline-none font-mono"
            style="
              color: var(--text);
              font-size: 13px;
              letter-spacing: 0.01em;
            "
            placeholder="search files..."
            @keydown="handleKeydown"
          />

          <!-- ESC badge -->
          <kbd
            style="
              font-family: inherit;
              font-size: 10px;
              color: var(--text-dim);
              background: var(--bg-tertiary);
              border: 1px solid var(--border);
              border-radius: 5px;
              padding: 2px 6px;
              flex-shrink: 0;
              opacity: 0.7;
            "
          >esc</kbd>
        </div>

        <!-- Results -->
        <div class="overflow-y-auto" style="max-height: 52vh; padding: 6px;">
          <div
            v-if="filteredFiles.length === 0"
            style="padding: 32px 16px; text-align:center; color:var(--text-dim); font-size:12px;"
          >
            no files matching "{{ searchQuery }}"
          </div>

          <div
            v-for="(file, index) in filteredFiles"
            :key="file"
            class="flex items-center gap-3 cursor-pointer transition-all"
            style="
              padding: 8px 12px;
              border-radius: 9px;
              margin-bottom: 2px;
              font-size: 12px;
              font-family: monospace;
            "
            :style="index === selectedIndex
              ? 'background: var(--accent); color: #fff;'
              : 'color: var(--text);'"
            @mouseenter="selectedIndex = index"
            @click="selectFile(file)"
          >
            <!-- File icon -->
            <svg
              class="flex-shrink-0"
              style="width:13px;height:13px;"
              :style="index === selectedIndex ? 'color:#fff;opacity:0.8;' : 'color:var(--text-dim);'"
              viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round"
            >
              <path d="M3 3v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6l-3-3H4a1 1 0 0 0-1 1z"/>
              <polyline points="9 3 9 6 12 6"/>
            </svg>

            <!-- Filename — highlight .xcx extension -->
            <span class="flex-1 truncate">
              <span>{{ file.replace(/\.xcx$/, '') }}</span>
              <span :style="index === selectedIndex ? 'opacity:0.65;' : 'color:var(--text-dim);'">.xcx</span>
            </span>

            <!-- Enter hint on selected -->
            <span
              v-if="index === selectedIndex"
              style="font-size:10px;opacity:0.6;flex-shrink:0;font-family:inherit;"
            >↵</span>
          </div>
        </div>

        <!-- Footer hints -->
        <div
          class="flex items-center gap-4"
          style="
            padding: 8px 16px;
            border-top: 1px solid var(--border);
            background: var(--bg-tertiary);
            border-radius: 0 0 16px 16px;
          "
        >
          <span class="flex items-center gap-1" style="font-size:10px;color:var(--text-dim);">
            <kbd style="background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:1px 5px;font-family:inherit;">↑</kbd>
            <kbd style="background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:1px 5px;font-family:inherit;">↓</kbd>
            navigate
          </span>
          <span class="flex items-center gap-1" style="font-size:10px;color:var(--text-dim);">
            <kbd style="background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:1px 5px;font-family:inherit;">↵</kbd>
            open
          </span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s ease-out, transform 0.12s ease-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}

input::placeholder {
  color: var(--text-dim);
  opacity: 0.5;
}
</style>