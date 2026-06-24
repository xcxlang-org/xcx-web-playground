# Changelog – XCX Web Interpreter

## Performance

- **Lexer**: Removed substring allocations in sequence matching (`matchSeq2`, `matchSeq3`); simplified `readJsonBlock` and `skipBlockComment`.
- **Environment**: Replaced recursive `resolveRecord` with an iterative `while` loop.
- **Expressions**: Added fast-path for `+` with two numeric scalars (int/float).
- **Loops**: Eliminated `try-catch` in loop evaluators when no jump operations are present.

## Parity with XCX 4.1

The following features match the XCX 4.1 release:

- `array.slice(start, end)` — half-open range `[start, end)`, supports negative offsets.
- `array.count()` / `set.count()` / `map.count()` — `.size` alias for all collection types.
- `string.slice(start, end)` — routed to the existing string method handler.
- `json.keys()` — returns top-level keys of a JSON object as `array:s`.
- Multiple variable declarations — `let a, b, c = 1, 2, 3`.