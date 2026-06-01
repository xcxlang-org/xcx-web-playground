const fs = require('fs');

try {
    const data = fs.readFileSync('../../xcx-vscode-main/snippets/snippets.json', 'utf8');
    const json = JSON.parse(data);

    let out = `import { snippetCompletion } from '@codemirror/autocomplete';\n\nexport const xcxCompletions = [\n`;

    const bannedSections = [
        '--- HTTP Server ---',
        '--- Database ---',
        '--- Crypto ---',
        '--- Store ---',
        '--- ENV ---',
        '--- Terminal ---',
        '--- OS ---',
        '--- Fibers ---',
    ];

    let skip = false;

    for (const [key, val] of Object.entries(json)) {
        if (val.prefix.startsWith('x') && val.body.length > 0 && val.body[0].includes('--- ')) {
            skip = bannedSections.includes(val.body[0]);
        }

        if (skip) continue;

        if (val.body.length > 0 && val.body[0].includes('--- ')) {
            continue;
        }

        let bodyStr = val.body.join('\n');

        bodyStr = bodyStr.replace(/\$\{\d+\|([^\|]+)[^\}]+\}/g, '${1:$1}');

        bodyStr = bodyStr.replace(/`/g, '\\`');
        bodyStr = bodyStr.replace(/\$/g, '\\$');

        out += `  snippetCompletion(\`${bodyStr}\`, { label: '${val.prefix}', detail: '${val.description.replace(/'/g, "\\'")}' }),\n`;
    }

    out += `];\n`;
    fs.writeFileSync('src/composables/useXcxCompletions.ts', out);
    console.log('Done escaping');
} catch (e) {
    console.error(e);
}
