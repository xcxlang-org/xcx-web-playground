/**
 * Virtual File System (VFS)
 *
 * Maps canonical module names to their XCX source code.
 * Used by the interpreter to resolve `include` statements
 * without any real filesystem access — safe for Web Workers.
 *
 * In Node (test runner): content is loaded from disk via fs.readFileSync
 * at startup by calling registerBuiltins().
 *
 * In the browser (Vite worker): content is injected at build time via
 * Vite's `?raw` import inside the worker entry point, then registered
 * via registerVFS() before the first runSource() call.
 *
 * Canonical name lookup strips a trailing ".xcx" extension and
 * lowercases the result, so all of these resolve to "math":
 *   include "math";
 *   include "math.xcx";
 *   include "Math.xcx";
 */

const vfsStore = new Map<string, string>();

/** Register a module with its source. Called from entry points. */
export function registerVFS(name: string, source: string): void {
    vfsStore.set(canonical(name), source);
}

/**
 * Resolve a path from an `include` statement to its source code.
 * Returns null when the module is not found.
 */
export function vfsResolve(rawPath: string): string | null {
    return vfsStore.get(canonical(rawPath)) ?? null;
}

/** Returns the canonical name for a raw path (used for cycle detection). */
export function vfsCanonical(rawPath: string): string {
    return canonical(rawPath);
}

function canonical(rawPath: string): string {
    return rawPath
        .replace(/\\/g, "/")
        .replace(/^.*\//, "")       // strip any directory prefix
        .replace(/\.xcx$/i, "")     // strip .xcx extension
        .toLowerCase();
}
