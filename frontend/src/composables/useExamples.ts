import { examples } from '@/examples';
import { useEditor } from './useEditor';

const exampleReadmes: Record<string, string> = {
  'hello.xcx': `# XCX Example: Hello World

This is a basic Hello World example in XCX. It prints a message using the print operator \`>!\`.

## How to Run
Click the **Run** button to execute the code in \`src/main.xcx\`.
`,
  'fibonacci.xcx': `# XCX Example: Fibonacci Sequence

Calculates the Fibonacci sequence recursively in XCX and outputs the results.

## How to Run
Click the **Run** button to execute the code in \`src/main.xcx\`.
`,
  'sieve.xcx': `# XCX Example: Sieve of Eratosthenes

Calculates prime numbers up to a specified limit using the Sieve of Eratosthenes algorithm.

## How to Run
Click the **Run** button to execute the code in \`src/main.xcx\`.
`,
  'factorial.xcx': `# XCX Example: Factorial

Calculates the factorial of a number recursively and outputs the result.

## How to Run
Click the **Run** button to execute the code in \`src/main.xcx\`.
`,
  'counter.xcx': `# XCX Example: Counter

Demonstrates a simple counting loop from 1 to 10 in XCX.

## How to Run
Click the **Run** button to execute the code in \`src/main.xcx\`.
`,
  'guess.xcx': `# XCX Example: Number Guessing Game

An interactive console game where the user guesses a secret number using stdin inputs (\`>?\`).

## How to Run
Click the **Run** button to start, and use the terminal panel to input your guesses.
`
};

export function useExamples() {
  const { sessionFiles } = useEditor();

  const loadExample = (editorContent: any, selectedFile: any, exampleName: string): void => {
    const example = examples.find(e => e.name === exampleName || e.name.replace(/\.xcx$/, '') === exampleName.replace(/\.xcx$/, ''));
    if (example) {
      sessionFiles.value['src/main.xcx'] = example.content;
      sessionFiles.value['README.md'] = exampleReadmes[example.name] || `# XCX Example: ${example.description}\n\nRunning example.`;
      selectedFile.value = 'src/main.xcx';
      editorContent.value = example.content;
    }
  };

  const { createFile: editorCreateFile } = useEditor();

  const createFile = (_content: any, _selectedFile: any, fileName: string): void => {
    if (!fileName.endsWith('.xcx')) {
      fileName = fileName + '.xcx';
    }
    editorCreateFile(fileName);
  };

  const downloadFile = (content: string, fileName: string): void => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    examples,
    loadExample,
    createFile,
    downloadFile,
  };
}