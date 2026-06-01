const fs = require('fs');
let code = fs.readFileSync('src/composables/useXcxCompletions.ts', 'utf8');

let lines = code.split('\n');
let filtered = [];
let skip = false;
for (let line of lines) {
    if (line.includes('snippetCompletion(') && line.includes("label: 'fiber")) skip = true;
    if (line.includes('snippetCompletion(') && line.includes("label: 'forfib")) skip = true;
    if (line.includes('snippetCompletion(') && line.includes("label: 'yield")) skip = true;

    if (!skip) {
        filtered.push(line);
    }

    if (skip && line.includes('}),')) {
        skip = false;
    }
}

let out = filtered.join('\n');
out = out.replace(/to_str/g, 'toStr');

fs.writeFileSync('src/composables/useXcxCompletions.ts', out);
