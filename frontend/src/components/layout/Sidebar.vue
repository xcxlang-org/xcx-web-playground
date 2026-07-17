<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';

const SettingsModal = defineAsyncComponent(() => import('./SettingsModal.vue'));
const FilesModal = defineAsyncComponent(() => import('./FilesModal.vue'));
const ShortcutsModal = defineAsyncComponent(() => import('./ShortcutsModal.vue'));

import IconFileTree from '@/components/ui/icons/IconFileTree.vue';
import IconSettings from '@/components/ui/icons/IconSettings.vue';
import IconCode from '@/components/ui/icons/IconCode.vue';
import IconInfo from '@/components/ui/icons/IconInfo.vue';
import IconKeyboard from '@/components/ui/icons/IconKeyboard.vue';
import IconGithub from '@/components/ui/icons/IconGithub.vue';
import IconX from '@/components/ui/icons/IconX.vue';

import { useEditor } from '@/composables/useEditor';

const isOpen = defineModel<boolean>('isOpen', { default: false });
const isSettingsOpen = ref(false);
const isFilesOpen = ref(false);
const isShortcutsOpen = ref(false);
const router = useRouter();

const { isExplorerOpen } = useEditor();

const openExternalWarning = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

const handleMenuClick = (label: string) => {
  if (label === 'Settings') {
    isSettingsOpen.value = true;
    isOpen.value = false;
  } else if (label === 'Files') {
    isExplorerOpen.value = !isExplorerOpen.value;
    isOpen.value = false;
  } else if (label === 'Shortcuts') {
    isShortcutsOpen.value = true;
    isOpen.value = false;
  } else if (label === 'Documentation') {
    openExternalWarning('https://xcxlang.com/docs/index.html');
  } else if (label === 'About') {
    isOpen.value = false;
    router.push('/about');
  }
};

const currentTime = ref('');

const updateTime = (): void => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  currentTime.value = `${displayHours}:${minutes} ${ampm}`;
};

let timeInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  updateTime();
  timeInterval = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});

const menuItems = [
  {
    icon: IconFileTree,
    label: 'Files',
    description: 'Browse your files'
  },
  {
    icon: IconSettings,
    label: 'Settings',
    description: 'Configure editor'
  },
  {
    icon: IconCode,
    label: 'Documentation',
    description: 'Learn xcx'
  },
  {
    icon: IconInfo,
    label: 'About',
    description: 'About xcx playground'
  },
  {
    icon: IconKeyboard,
    label: 'Shortcuts',
    description: 'Keyboard shortcuts'
  }
];
</script>

<template>
  <!-- Overlay backdrop -->
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/30 z-40"
      @click="isOpen = false"
    />
  </Transition>

  <!-- Sidebar -->
  <Transition name="slide">
    <aside
      v-if="isOpen"
      class="fixed left-0 top-0 bottom-0 w-72 bg-bg-secondary border-r border-border z-50 shadow-2xl"
    >
      <div class="flex flex-col h-full">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-border">
          <div class="flex items-center gap-2.5">
            <img src="@/assets/img/logo.png" alt="xcx" class="h-5 w-auto" />
            <span class="text-text font-medium text-sm">Menu</span>
          </div>
          <button
            type="button"
            class="p-1.5 text-text-dim hover:text-text hover:bg-bg-tertiary rounded transition-colors"
            @click="isOpen = false"
            aria-label="Close menu"
          >
            <IconX class="w-4 h-4" />
          </button>
        </div>

        <!-- Clock -->
        <div class="px-4 py-4 border-b border-border">
          <div class="text-text-dim text-2xl font-mono text-center">
            {{ currentTime }}
          </div>
        </div>

        <!-- Menu items -->
        <div class="flex-1 overflow-y-auto py-2 flex flex-col">
          <div
            v-for="(item, index) in menuItems"
            :key="index"
            class="px-4 py-3 hover:bg-bg-tertiary cursor-pointer transition-colors group"
            @click="handleMenuClick(item.label)"
          >
            <div class="flex items-center gap-3">
              <component :is="item.icon" class="w-5 h-5 flex-shrink-0 text-text-dim group-hover:text-accent transition-colors" />
              <div>
                <div class="text-text text-sm font-medium group-hover:text-accent transition-colors">{{ item.label }}</div>
                <div class="text-text-dim text-xs mt-0.5">{{ item.description }}</div>
              </div>
            </div>
          </div>

          <!-- External links at bottom -->
          <div class="mt-auto px-4 py-8 border-t border-border flex items-center justify-center gap-6">
            <!-- Pax link -->
            <button
              @click="openExternalWarning('https://pax.xcxlang.com')"
              class="relative group flex items-center justify-center text-text-dim hover:text-text transition-colors"
              aria-label="Pax Package Manager"
            >
              <img src="@/assets/img/pax_icon.svg" alt="Pax" class="w-12 h-12" />
              <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-bg-tertiary border border-border rounded text-xs text-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Pax Package Manager
              </div>
            </button>

            <!-- XCX link -->
            <button
              @click="openExternalWarning('https://xcxlang.com')"
              class="relative group flex items-center justify-center text-text-dim hover:text-text transition-colors"
              aria-label="XCX official website"
            >
              <img src="@/assets/img/xcx_icon.svg" alt="XCX" class="w-12 h-12" />
              <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-bg-tertiary border border-border rounded text-xs text-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                XCX official website
              </div>
            </button>

            <!-- GitHub link -->
            <a
              href="https://github.com/xcxlang-org/xcx-web-playground"
              target="_blank"
              rel="noopener noreferrer"
              class="relative group flex items-center justify-center text-text-dim"
              aria-label="GitHub Repository"
            >
              <IconGithub class="w-10 h-10" />
              <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-bg-tertiary border border-border rounded text-xs text-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                GitHub Repository
              </div>
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-3 border-t border-border">
          <div class="text-text-dim text-xs">
            xcx playground v2.0.0
          </div>
        </div>
      </div>
    </aside>
  </Transition>

  <SettingsModal v-model:isOpen="isSettingsOpen" />
  <FilesModal v-model:isOpen="isFilesOpen" />
  <ShortcutsModal v-model:isOpen="isShortcutsOpen" />
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
