import { ref, watchEffect } from 'vue';
import type { ThemeMode } from '@/types';

const STORAGE_KEY = 'xcx-theme-preference';

const mode = ref<ThemeMode>('dark');

const setMode = (newMode: ThemeMode): void => {
  mode.value = newMode;
  document.documentElement.setAttribute('data-theme', newMode);
  localStorage.setItem(STORAGE_KEY, newMode);
};

const toggle = (): void => {
  setMode(mode.value === 'dark' ? 'light' : 'dark');
};

const init = (): void => {
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  const preferred = saved ?? 'dark';
  setMode(preferred);
};

export function useTheme() {
  watchEffect(() => {
    document.documentElement.setAttribute('data-theme', mode.value);
  });

  return { mode, setMode, toggle, init };
}