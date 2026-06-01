export type TerminalLineType = 'info' | 'error' | 'success' | 'prompt' | 'output';

export interface TerminalLine {
  id: string;
  content: string;
  type: TerminalLineType;
  timestamp: number;
}

export interface TerminalCommand {
  command: string;
  args: string[];
  raw: string;
}