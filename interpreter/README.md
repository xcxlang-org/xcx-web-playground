# interpreter

TypeScript-based XCX interpreter targeting XCX 4.3. Used as a local package by the frontend (`xcx-interpreter`).

---

## Structure

```
interpreter/
├── src/
│   ├── lexer/          # Tokenizer
│   ├── parser/         # Recursive descent parser, AST definitions
│   ├── interpreter/    # Tree-walk interpreter, environment, value types
│   │   └── eval/       # Evaluation split by concern (declarations, flow, expressions, collections)
│   ├── errors/         # Error types and formatter
│   ├── vfs.ts          # Virtual file system for include resolution
│   ├── run.ts          # Browser entry point (runSource, registerVFS)
│   └── index.ts        # Node CLI entry point
├── lib/                # Standard library XCX files (math.xcx, etc.)
├── tests/              # XCX test programs
└── docs/
    └── SPECIFICATION.md
```

---

## Entry points

**Browser (playground):**
```ts
import { runSource, registerVFS } from 'xcx-interpreter/browser';
```

**Node (CLI / test runner):**
```ts
import { runSource } from './index';
```

---

## Running a file (Node)

```bash
npx ts-node src/index.ts path/to/file.xcx
```

---

## Test runner

```bash
npm run runner
# or with verbose output:
npm run runner -- --verbose
```

Tests live in `tests/`. Golden output patterns are defined inline in `src/tests_runner.ts`. A test passes if execution produces no error and (where a golden pattern is defined) matches it exactly.

---

## Virtual file system

`include` statements are resolved through `vfs.ts`, not the real filesystem. In the browser, modules are registered before execution:

```ts
registerVFS('math', mathSource); // mathSource imported via Vite ?raw
```

Canonical name lookup strips the `.xcx` extension and lowercases, so `include "Math.xcx"` and `include "math"` both resolve to the same entry.

---

## Supported language features (XCX 4.3)

- Scalar types: `i`, `f`, `s`, `b`, `date`
- Collections: `array:T`, `set:D`, `map:K<->V`, `table`, `json`
- Control flow: `if/elif/else/end`, `while`, `for` (range + collection)
- Functions: `func`, recursion, type-checked params and return
- Constants, named includes with aliases
- `halt.alert / .error / .fatal`
- `random.int`, `random.float`, `random.choice from`
- String methods, date arithmetic, JSON mutation
- `input.key()`, `.terminal` directives (partial)
- `@wait` synchronous delay

Not implemented: `fiber`, `http`, `database`, `crypto`, `store`, `.terminal !run`.

---

## Adding standard library modules

Put a `.xcx` file in `lib/`. In Node it is auto-loaded at startup. In the browser, import it with `?raw` in the worker and call `registerVFS()` before `runSource()`.