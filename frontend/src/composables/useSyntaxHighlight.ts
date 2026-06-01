import { computed } from 'vue';

const KEYWORDS = [
  'fn', 'let', 'import', 'from', 'return', 'if', 'else', 'for', 'while',
  'true', 'false', 'null', 'struct', 'enum', 'match', 'use', 'pub',
  'mod', 'const', 'as', 'in', 'loop', 'break', 'continue', 'type', 'trait', 'impl'
];

export function useSyntaxHighlight(code: () => string) {
  const escapeHtml = (str: string): string =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const wrap = (content: string, className: string): string =>
    `<span class="${className}">${content}</span>`;

  const highlight = computed((): string => {
    let result = escapeHtml(code());

    // Store strings and comments to protect them from further processing
    const protectedSegments: { [key: string]: string } = {};
    let segmentIndex = 0;

    // Protect comments
    result = result.replace(/(\/\/.*$)/gm, (m) => {
      const key = `__COMMENT_${segmentIndex}__`;
      protectedSegments[key] = wrap(m, 'syntax-cmt');
      segmentIndex++;
      return key;
    });

    // Protect strings
    result = result.replace(/(["'`])(?:(?!\1|\\).|\\.)*?\1/g, (m) => {
      const key = `__STRING_${segmentIndex}__`;
      protectedSegments[key] = wrap(m, 'syntax-str');
      segmentIndex++;
      return key;
    });

    // Keywords (safe now, strings are protected)
    for (const kw of KEYWORDS) {
      const regex = new RegExp(`\\b(${kw})\\b`, 'g');
      result = result.replace(regex, (m) => wrap(m, 'syntax-kw'));
    }

    // Numbers
    result = result.replace(/\b(\d+\.?\d*)\b/g, (m) => wrap(m, 'syntax-num'));

    // Function calls (not keywords)
    result = result.replace(/\b([a-zA-Z_]\w*)\s*(?=\()/g, (m, fn) => {
      if (KEYWORDS.includes(fn)) return m;
      return wrap(fn, 'syntax-fn') + m.slice(fn.length);
    });

    // Types (PascalCase)
    result = result.replace(/\b([A-Z]\w*)\b/g, (m) => wrap(m, 'syntax-type'));

    // Restore protected segments
    for (const [key, value] of Object.entries(protectedSegments)) {
      result = result.replace(key, value);
    }

    return result + '\n';
  });

  return { highlighted: highlight };
}