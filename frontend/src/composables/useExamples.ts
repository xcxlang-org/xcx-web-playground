import { examples } from '@/examples';
import { useEditor } from './useEditor';

/** Returns the default content for a new XCX file with the given name. */
function newFileTemplate(fileName: string): string {
  return `--- ${fileName}\n`;
}

export function useExamples() {
  const { sessionFiles } = useEditor();

  const loadExample = (content: any, selectedFile: any, fileName: string): void => {
    const example = examples.find(e => e.name === fileName);
    if (example) {
      // Persist current file before switching
      sessionFiles.value[selectedFile.value] = content.value;
      sessionFiles.value[fileName] = example.content;
      selectedFile.value = fileName;
      content.value = example.content;
    }
  };

  const createFile = (content: any, selectedFile: any, fileName: string): void => {
    if (!fileName.endsWith('.xcx')) {
      fileName = fileName + '.xcx';
    }
    // Persist current file content first
    sessionFiles.value[selectedFile.value] = content.value;
    const template = newFileTemplate(fileName);
    // Add new file to sessionFiles
    sessionFiles.value[fileName] = template;
    selectedFile.value = fileName;
    content.value = template;
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