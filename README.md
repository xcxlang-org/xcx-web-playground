# xcx-web-playground

Web-based playground for the [XCX programming language](https://xcxlang.com). Runs a TypeScript interpreter directly in the browser via a Web Worker — no server-side execution.

Live: [playground.xcxlang.com](https://playground.xcxlang.com)

Main XCX repository: [github.com/xcxlang-org/xcx](https://github.com/xcxlang-org/xcx)

---

## Structure

```
xcx-web-playground/
├── frontend/       # Vue 3 + Vite application
└── interpreter/    # TypeScript XCX interpreter (used as local package)
```

The frontend imports the interpreter directly via a Vite alias (`xcx-interpreter/browser → interpreter/src/run.ts`). No build step is needed for the interpreter during development.

---

## Requirements

- Node.js 18+
- npm

---

## Getting started

```bash
# Install frontend dependencies
cd frontend
npm install

# Run dev server
npm run dev
```

The dev server starts on `http://localhost:3000` with the required COOP/COEP headers for `SharedArrayBuffer` support (needed for interactive stdin).

---

## Building

```bash
cd frontend
npm run build
```

Output goes to `frontend/dist`. The `.htaccess` in `frontend/public` handles SPA routing and the required cross-origin isolation headers for Apache.

---

## How it works

1. User code is passed from the Vue frontend to a Web Worker (`xcx.worker.ts`).
2. The worker runs `runSource()` from the interpreter and posts output lines back to the main thread.
3. For interactive input (`>?`), the worker blocks on `Atomics.wait()` until the UI posts input via a `SharedArrayBuffer`.
4. The virtual file system (VFS) lets `include` statements resolve files from the editor's session — no real filesystem access.

---

## Sharing

The toolbar's Share button compresses the current editor session (all files) with LZ-string and encodes it into the URL hash (`#code=...`). Opening that URL restores the full session.

---

## Limitations

The playground interpreter targets XCX 3.1 and does not support:

- `http` / `serve:` module
- `database:` block
- `crypto` module
- `store` module (filesystem)
- `fiber` concurrency primitives
- `.terminal !run` directive

Partial support: `terminal` module (clear, cursor, move, write).

---

## License

See `LICENSE`.