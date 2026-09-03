<script setup lang="ts">
import { useRouter } from 'vue-router';
import ThemeToggle from '@/components/ui/ThemeToggle.vue';
import IconChevronLeft from '@/components/ui/icons/IconChevronLeft.vue';
import { XCX_LANGUAGE_VERSION as version, PLAYGROUND_VERSION as playgroundVersion, BUILD_DATE as buildDate } from '@/config/version';

const router = useRouter();

const openExternalWarning = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

const stack = [
  { name: 'TypeScript', note: 'interpreter & logic' },
  { name: 'Vue 3', note: 'playground UI' },
  { name: 'Tailwind CSS', note: 'styling' },
  { name: 'Vite', note: 'build tooling' },
];

const links = [
  { label: 'xcxlang.com', href: 'https://xcxlang.com' },
  { label: 'pax.xcxlang.com', href: 'https://pax.xcxlang.com' },
  { label: 'GitHub', href: 'https://github.com/xcxlang-org/xcx-web-playground' },
];
</script>

<template>
  <div class="h-screen bg-bg text-text flex flex-col overflow-y-auto">

    <header class="flex items-center justify-between px-6 py-3 border-b border-border bg-bg-secondary flex-shrink-0">
      <button
        class="flex items-center gap-2 text-text-dim hover:text-text transition-colors text-xs"
        @click="router.push('/')"
      >
        <IconChevronLeft class="w-3.5 h-3.5" />
        Back to playground
      </button>
      <div class="flex items-center gap-4">
        <ThemeToggle />
        <img src="@/assets/img/logo.png" alt="xcx" class="h-5 w-auto opacity-60" />
      </div>
    </header>

    <section class="px-6 pt-16 pb-12 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-12 lg:gap-20 items-start">
      <div>
        <div class="text-text-dim text-sm font-mono mb-6 tracking-wider uppercase">xcx playground v{{ playgroundVersion }}</div>
        <h1 class="text-5xl lg:text-6xl font-semibold mb-5 tracking-tight">
          <span class="text-accent">xcx</span> {{ version }}
        </h1>
        <p class="text-text-dim text-base lg:text-lg leading-relaxed max-w-xl lg:max-w-2xl text-balance">
          A statically typed, multi-paradigm backend programming language. This playground runs a sandboxed, TypeScript-based interpreter directly in your browser.
        </p>
        <div class="flex items-center gap-4 mt-10">
          <button
            class="px-6 py-3 bg-accent text-white rounded-lg text-sm lg:text-base font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
            @click="router.push('/')"
          >
            Open editor
          </button>
          <button
            class="px-6 py-3 bg-bg-secondary border border-border text-text-dim rounded-lg text-sm lg:text-base font-medium hover:text-text hover:border-accent/40 transition-colors whitespace-nowrap"
            @click="openExternalWarning('https://xcxlang.com/docs/index.html')"
          >
            Documentation
          </button>
        </div>
      </div>

      <div class="text-left bg-bg-secondary border border-border rounded-lg p-6 w-full">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-text-dim mb-4">Playground Limitations</h2>
        <ul class="text-text-dim text-sm space-y-2 list-disc list-inside">
          <li>Operates on a virtual file system (no access to real files).</li>
          <li>No support for the <code>http</code> module.</li>
          <li>No support for the <code>database</code> module.</li>
          <li>No support for the <code>crypto</code> module.</li>
          <li>No support for the <code>store</code> module.</li>
          <li>Partial support for the <code>terminal</code> module.</li>
          <li>No support for fibers.</li>
        </ul>
        <div class="mt-6 pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center gap-4 text-xs">
          <div class="flex items-center gap-2">
            <span class="text-text-dim">Playground:</span>
            <span class="font-mono text-text bg-bg px-2 py-0.5 rounded border border-border">v{{ playgroundVersion }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-text-dim">XCX Target Version:</span>
            <span class="font-mono text-text bg-bg px-2 py-0.5 rounded border border-border">v{{ version }}</span>
          </div>
        </div>
      </div>
    </section>



    <div class="border-t border-border" style="max-width: 48rem; margin: 0 auto; width: calc(100% - 3rem);"></div>

    <section class="px-6 py-12 max-w-6xl mx-auto w-full">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-text-dim mb-8">Built with</h2>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          v-for="item in stack"
          :key="item.name"
          class="bg-bg-secondary border border-border rounded px-4 py-3"
        >
          <div class="text-text text-xs font-medium font-mono">{{ item.name }}</div>
          <div class="text-text-dim text-[11px] mt-0.5">{{ item.note }}</div>
        </div>
      </div>
    </section>

    <footer class="mt-auto border-t border-border px-6 py-6">
      <div class="max-w-3xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-5">
          <button
            v-for="link in links"
            :key="link.label"
            @click="openExternalWarning(link.href)"
            class="text-text-dim text-xs hover:text-text transition-colors"
          >
            {{ link.label }}
          </button>
        </div>
        <span class="text-text-dim text-xs font-mono">xcx {{ version }} · {{ buildDate }}</span>
      </div>
    </footer>

  </div>
</template>




