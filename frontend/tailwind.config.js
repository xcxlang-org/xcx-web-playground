import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'var(--bg)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
        },
        text: {
          DEFAULT: 'var(--text)',
          dim: 'var(--text-dim)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          dim: 'var(--accent-dim)',
        },
        border: 'var(--border)',
        code: {
          bg: 'var(--code-bg)',
          num: 'var(--line-num)',
        },
        syntax: {
          kw: 'var(--keyword)',
          str: 'var(--string)',
          cmt: 'var(--comment)',
          fn: 'var(--fn)',
          num: 'var(--number)',
          type: 'var(--type)',
          op: 'var(--operator)',
        },
        terminal: {
          bg: 'var(--terminal-bg)',
          text: 'var(--terminal-text)',
          prompt: 'var(--terminal-prompt)',
        },
      },
      fontFamily: {
        mono: ['SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'monospace'],
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;