import { ref, watchEffect } from 'vue';
import type { ThemeMode } from '@/types';

const STORAGE_KEY = 'xcx-theme-preference';

const mode = ref<ThemeMode>('dark');

let suppressTimer: ReturnType<typeof setTimeout> | undefined;

const setMode = (newMode: ThemeMode): void => {
  // Recolor instantly: without this, elements with CSS transitions (topbar
  // buttons, body background) fade to the new palette at different speeds and
  // briefly mismatch the rest of the UI after a theme switch.
  const root = document.documentElement;
  root.setAttribute('data-theme-switching', '');
  clearTimeout(suppressTimer);
  suppressTimer = setTimeout(() => root.removeAttribute('data-theme-switching'), 300);

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