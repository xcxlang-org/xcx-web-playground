export interface EditorState {
  content: string;
  cursorLine: number;
  cursorColumn: number;
  selectedFile: string;
}

export interface SyntaxToken {
  type: 'keyword' | 'string' | 'comment' | 'function' | 'number' | 'type' | 'operator' | 'plain';
  value: string;
  start: number;
  end: number;
}