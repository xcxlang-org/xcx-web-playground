import { StreamLanguage } from '@codemirror/language';

const KEYWORDS_CONTROL = new Set([
    'if', 'then', 'elseif', 'elif', 'elf', 'else', 'els', 'end',
    'while', 'do', 'for', 'in', 'to', 'break', 'continue', 'return',
    'include', 'as', 'yield', 'serve', 'const', 'from',
]);

const KEYWORDS_DECL = new Set(['func', 'fiber']);

const KEYWORDS_LOGICAL = new Set(['AND', 'OR', 'NOT', 'HAS']);

const KEYWORDS_SET_OPS = new Set([
    'UNION', 'INTERSECTION', 'DIFFERENCE', 'SYMMETRIC_DIFFERENCE',
]);

const TYPES_COMPLEX = new Set([
    'array', 'set', 'map', 'table', 'json', 'date',
]);

const PRIMITIVES = new Set(['i', 'f', 's', 'b', 'int', 'float', 'str', 'bool']);

const CONSTANTS = new Set(['true', 'false', 'EMPTY']);

const BUILTINS = new Set([
    'halt', 'alert', 'error', 'fatal', 'terminal',
    'store', 'random', 'choice', 'input',
    'crypto', 'net', 'env',
]);

export const xcxLanguage = StreamLanguage.define({
    name: 'xcx',

    languageData: {
        commentTokens: { line: "---", block: { open: "---", close: "*---" } },
        indentOnInput: /^\s*(?:[\}\]\)]|end|else|elif|els|elf)$/
    },

    token(stream, state: { inBlockComment: boolean; inRawBlock: boolean; indentLevel: number }) {
        // Block comment ---\n ... \n*---
        if (state.inBlockComment) {
            if (stream.match(/^\s*\*---\s*$/)) {
                state.inBlockComment = false;
                return 'comment';
            }
            stream.skipToEnd();
            return 'comment';
        }

        // Raw block <<< ... >>>
        if (state.inRawBlock) {
            if (stream.match('>>>')) {
                state.inRawBlock = false;
                return 'string';
            }
            stream.next();
            return 'string';
        }

        // Whitespace
        if (stream.eatSpace()) return null;

        // Block comment start ---\n (whole line is ---)
        if (stream.match(/^---\s*$/, false)) {
            state.inBlockComment = true;
            stream.skipToEnd();
            return 'comment';
        }

        // Line comment ---
        if (stream.match('---')) {
            stream.skipToEnd();
            return 'comment';
        }

        // Raw block start <
        if (stream.match('<<<')) {
            state.inRawBlock = true;
            return 'string';
        }

        // String
        if (stream.peek() === '"') {
            stream.next();
            while (!stream.eol()) {
                const ch = stream.next();
                if (ch === '\\') { stream.next(); continue; }
                if (ch === '"') break;
            }
            return 'string';
        }

        // Numbers — float first
        if (stream.match(/^\d+\.\d+/)) return 'number';
        if (stream.match(/^\d+/)) return 'number';

        // IO operators >! >?
        if (stream.match('>!') || stream.match('>?')) return 'operator';

        // Decorators @step @wait
        if (stream.match(/@(step|wait)\b/)) return 'keyword';

        // Column attributes @auto @pk @unique @optional @default @fk
        if (stream.match(/@(auto|pk|unique|optional|default|fk)\b/)) return 'keyword';

        // Operators — ++ before +
        if (stream.match('++')) return 'operator';
        if (stream.match('->')) return 'operator';
        if (stream.match('<->') || stream.match('<=>')) return 'operator';
        if (stream.match('::')) return 'operator';
        if (stream.match('==') || stream.match('!=') ||
            stream.match('>=') || stream.match('<=')) return 'operator';
        if (stream.match(/^[+\-*/%^]/)) return 'operator';
        if (stream.match(/^[><!]/)) return 'operator';
        if (stream.match(/^(?<![=!<>])=(?!=)/)) return 'operator';

        // Logical symbol operators
        if (stream.match('&&') || stream.match('||') || stream.match('!!')) return 'operator';

        // Set operators unicode
        if (stream.match(/^[∪∩⊕]/)) return 'keyword';

        // Punctuation & Brackets
        const ch = stream.peek();
        if (ch === '{' || ch === '[' || ch === '(') {
            stream.next();
            state.indentLevel++;
            return 'punctuation';
        }
        if (ch === '}' || ch === ']' || ch === ')') {
            stream.next();
            if (state.indentLevel > 0) state.indentLevel--;
            return 'punctuation';
        }

        // Identifiers and keywords
        const word = stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
        if (word) {
            const w = (word as RegExpMatchArray)[0] as string;

            if (['then', 'do'].includes(w)) {
                state.indentLevel++;
            }
            if (['end', 'else', 'elif', 'elf', 'els'].includes(w)) {
                if (state.indentLevel > 0) state.indentLevel--;
            }
            if (['else', 'elif', 'elf', 'els'].includes(w)) {
                // These decrement the previous block, but immediately start a new block inside.
                // Actually in Stream language design, else just shifts left. For XCX it should be on same baseline.
                state.indentLevel++;
            }

            if (KEYWORDS_CONTROL.has(w)) return 'keyword';
            if (KEYWORDS_DECL.has(w)) return 'keyword';
            if (KEYWORDS_LOGICAL.has(w)) return 'keyword';
            if (KEYWORDS_SET_OPS.has(w)) return 'keyword';
            if (CONSTANTS.has(w)) return 'atom';
            if (BUILTINS.has(w)) return 'builtin';
            if (TYPES_COMPLEX.has(w)) return 'typeName';

            // Primitives only as type annotation (followed by :) or cast (followed by ()
            if (PRIMITIVES.has(w)) {
                const next = stream.peek();
                if (next === ':' || next === '(') return 'typeName';
            }

            return 'variableName';
        }

        // Punctuation
        stream.next();
        return null;
    },

    indent(state, textAfter, context) {
        if (state.inBlockComment || state.inRawBlock) return null;
        let diff = 0;
        if (/^\s*([\}\]\)]|end\b|else\b|elif\b|els\b|elf\b)/.test(textAfter)) {
            diff = -1;
        }
        return Math.max(0, state.indentLevel + diff) * context.unit;
    },

    startState() {
        return { inBlockComment: false, inRawBlock: false, indentLevel: 0 };
    },

    copyState(state) {
        return { ...state };
    },
});
