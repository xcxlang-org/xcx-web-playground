# frontend

Vue 3 + Vite playground UI for XCX.

---

## Stack

- Vue 3 (Composition API)
- TypeScript (strict)
- Vite
- Tailwind CSS
- CodeMirror 6 (editor)
- LZ-string (URL sharing)

---

## Structure

```
frontend/src/
├── assets/css/         # Global styles, CSS variables (theme tokens)
├── components/
│   ├── editor/         # CodeMirror integration, tab bar, skeleton
│   ├── layout/         # Topbar, sidebar, status bar, workspace layout, modals
│   ├── terminal/       # Terminal panel, input, output
│   └── ui/             # Shared primitives (IconButton, Skeleton, ThemeToggle, modals)
├── composables/        # useEditor, useTerminal, useLayout, useTheme, useExamples, useInterpreter
├── config/editor/      # CodeMirror theme and highlight style
├── examples.ts         # Built-in example programs
├── pages/              # PlaygroundPage, AboutPage
├── router/             # Vue Router (/, /about)
├── types/              # TypeScript interfaces
└── workers/
    └── xcx.worker.ts   # Web Worker: runs interpreter, handles stdin via SharedArrayBuffer
```

---

## Development

```bash
npm install
npm run dev       # localhost:3000
npm run build     # production build → dist/
npm run typecheck # vue-tsc --noEmit
npm run lint      # eslint src
```

The dev server sets the required `Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy` headers. Without these, `SharedArrayBuffer` is unavailable and interactive stdin (`>?`) will not work.

---

## Snippet generation

The CodeMirror autocomplete list is generated from the VS Code extension's `snippets.json`:

```bash
node generate-snippets.cjs   # writes src/composables/useXcxCompletions.ts
node remove-fibers.cjs       # strips fiber-related snippets (not supported in playground)
```

Run these when the snippet definitions in `xcx-vscode-main` change. The output file is committed.

---

## Theming

Themes are controlled via a `data-theme` attribute on `<html>`. CSS custom properties are defined in `src/assets/css/variables.css`. The active theme is persisted to `localStorage` under `xcx-theme-preference`. A small inline script in `index.html` applies the saved theme before first paint to avoid flash.

Tailwind is configured to use these CSS variables via `tailwind.config.js`, so utility classes like `bg-bg`, `text-text-dim`, `border-border` map to the current theme.

---

## Session persistence

Editor state (all files + selected file + entry point + editor settings) is persisted to `localStorage` on every change. On load, URL hash (`#code=...`) takes priority over localStorage — this is how shared links work.

---

## Worker communication

The main thread spawns `xcx.worker.ts` per run. Communication:

| Direction | Message type | Description |
|-----------|-------------|-------------|
| main → worker | `run` | Source code, VFS map, SharedArrayBuffer reference |
| worker → main | `output` | A line of program output |
| worker → main | `error` | Interpreter or runtime error string |
| worker → main | `stdin_request` | Worker is blocked waiting for input |
| worker → main | `done` | Execution finished |
| main → worker | *(via SAB)* | User input written to `Int32Array`, `Atomics.notify` unblocks worker |

The worker is terminated immediately on Stop or on page navigation.

---

## Deployment

The `dist/` output is a standard SPA. The `public/.htaccess` configures Apache with:

- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Opener-Policy: same-origin`
- Rewrite rule to serve `index.html` for all non-file paths