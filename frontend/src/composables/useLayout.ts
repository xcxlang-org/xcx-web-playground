import { ref } from 'vue';

export type PanelPosition = 'right' | 'left' | 'bottom' | 'top';

const terminalPosition = ref<PanelPosition>('right');
const splitSize = ref<number>(58);
const isResizing = ref(false);
const activeMobileTab = ref<'editor' | 'terminal'>('editor');

export function useLayout() {
  const setPosition = (pos: PanelPosition): void => {
    terminalPosition.value = pos;
    // reset to sensible values
    if (pos === 'right' || pos === 'left') splitSize.value = 58;
    if (pos === 'bottom' || pos === 'top') splitSize.value = 65;
  };

  const startResize = (e: MouseEvent): void => {
    isResizing.value = true;
    document.body.style.userSelect = 'none';
    const isHorizontal = terminalPosition.value === 'right' || terminalPosition.value === 'left';
    document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
    e.preventDefault();
  };

  const onMouseMove = (e: MouseEvent): void => {
    if (!isResizing.value) return;
    const main = document.querySelector('#layout-main') as HTMLElement;
    if (!main) return;
    const rect = main.getBoundingClientRect();

    switch (terminalPosition.value) {
      case 'right':
      case 'left': {
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        if (pct > 20 && pct < 80) splitSize.value = pct;
        break;
      }
      case 'bottom':
      case 'top': {
        const pct = ((e.clientY - rect.top) / rect.height) * 100;
        if (pct > 15 && pct < 85) splitSize.value = pct;
        break;
      }
    }
  };

  const stopResize = (): void => {
    if (isResizing.value) {
      isResizing.value = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  };

  return {
    terminalPosition,
    splitSize,
    isResizing,
    activeMobileTab,
    setPosition,
    startResize,
    onMouseMove,
    stopResize,
  };
}