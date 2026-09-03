import { ref } from 'vue';
import type { TerminalLine, TerminalCommand, TerminalLineType } from '@/types';
import { useInterpreter } from './useInterpreter';
import { XCX_LANGUAGE_VERSION, PLAYGROUND_VERSION } from '@/config/version';

const lines = ref<TerminalLine[]>([
  { id: crypto.randomUUID(), content: `xcx ${XCX_LANGUAGE_VERSION}`, type: 'info', timestamp: Date.now() },
  { id: crypto.randomUUID(), content: "Type '!help' for available commands.", type: 'info', timestamp: Date.now() },
]);

const history = ref<string[]>([]);
const historyIndex = ref<number>(-1);

export function useTerminal() {

  const addLine = (content: string, type: TerminalLineType = 'output'): void => {
    lines.value.push({
      id: crypto.randomUUID(),
      content,
      type,
      timestamp: Date.now(),
    });
  };

  const clear = (): void => {
    lines.value = [];
  };

  const showHelp = (): void => {
    const helpLines: string[] = [
      '================================================================================',
      '                                XCX HELP SYSTEM                                ',
      '================================================================================',
      '',
      'REPL COMMANDS:',
      '  !help          Show this help message',
      '  !clear         Clear the terminal screen',
      '  !exit          Exit the interactive mode',
      '  !stop          Stop the currently running program',
      '  !version, !v   Show playground and language version',
      '',
      'BASIC SYNTAX:',
      '  type: name = value;       Declare a variable (e.g., i: age = 25;)',
      '  const type: NAME = value; Declare a constant',
      '  >! expression;            Print result to terminal (e.g., >! 2 + 2;)',
      '  >? variable;              Wait for user input',
      '',
      'DATA TYPES:',
      '  i: Integer (48-bit)       f: Float (64-bit)',
      '  s: String (UTF-8)         b: Boolean (true/false)',
      '  date: Date (YYYY-MM-DD)   json: JSON Object',
      '  array:T { ... }           set:D  { ... }',
      '  map:K<->V { ... }         table: { columns=[...] rows=[...] }',
      '',
      'BUILT-IN SERVICES:',
      '  json.parse(s)             Parse string to JSON',
      '  date.now()                Get current date',
      '  date("2024-01-01")        Create date literal',
      '  store.read(path)          Read file content',
      '  net.get(url)              Perform HTTP GET request',
      '',
      'ARITHMETIC & LOGIC:',
      '  +, -, *, /, %, ^, ++      Operators',
      '  ==, !=, >, <, >=, <=      Comparisons',
      '  AND, OR, NOT, HAS         Logical operators',
      '',
      'CONTROL FLOW:',
      '  if (cond) then; ... end;',
      '  while (cond) do; ... end;',
      '  for i in start to end do; ... end;',
      '',
      'HALT SYSTEM:',
      '  halt.alert >! msg;        Warning (non-fatal)',
      '  halt.error >! msg;        Logic error (stops frame)',
      '  halt.fatal >! msg;        Critical error (terminates process)',
      '',
      'Type any valid XCX statement followed by a semicolon to execute it.',
      '================================================================================',
    ];
    helpLines.forEach(line => addLine(line, 'info'));
  };

  const { submitInput, isWaitingForInput, isRunning, runCode: _runCode, abort } = useInterpreter();

  const wrapRunCode = (source: string, vfs: Record<string, string> = {}) => {
    const startTime = performance.now();
    let failed = false;
    _runCode(source, vfs, {
      onOutput: (line: string) => addLine(line, 'output'),
      onError: (msg: string) => {
        failed = true;
        addLine(msg, 'error');
      },
      onDone: () => {
        if (failed) return;
        const elapsed = (performance.now() - startTime).toFixed(2);
        addLine(`✓ execution finished in ${elapsed}ms`, 'success');
      },
      onStdinRequest: () => addLine('❯ input required, type and press Enter...', 'info'),
      onClear: () => clear()
    });
  };

  /** Stop the currently running program (used by the Stop button in Topbar). */
  const stopCode = (): void => {
    if (isRunning.value) {
      addLine('⏹ program stopped by user', 'error');
      abort();
    }
  };

  const processCommand = (raw: string): void => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    if (isWaitingForInput.value) {
      addLine(`❯ ${raw}`, 'output'); // echo
      history.value.unshift(trimmed);
      historyIndex.value = -1;
      submitInput(raw);
      return;
    }

    const parts = trimmed.split(/\s+/);
    const [cmd, ...args] = parts;
    const command: TerminalCommand = { command: cmd?.toLowerCase() ?? '', args, raw: trimmed };

    history.value.unshift(trimmed);
    historyIndex.value = -1;

    addLine(`❯ ${trimmed}`, 'prompt');

    switch (command.command) {
      case '!help':
        showHelp();
        break;
      case '!clear':
        clear();
        break;
      case '!exit':
        addLine('exiting interactive mode...', 'info');
        break;
      case '!version':
      case '!v':
        addLine(`xcx playground v${PLAYGROUND_VERSION} · language ${XCX_LANGUAGE_VERSION}`, 'info');
        break;
      case '!stop':
        stopCode();
        break;
      default:
        addLine(`unknown command: ${command.command}`, 'error');
        addLine("type '!help' for available commands", 'info');
    }
  };

  const navigateHistory = (direction: 'up' | 'down'): string | null => {
    if (direction === 'up' && historyIndex.value < history.value.length - 1) {
      historyIndex.value++;
      return history.value[historyIndex.value] ?? null;
    }
    if (direction === 'down' && historyIndex.value > 0) {
      historyIndex.value--;
      return history.value[historyIndex.value] ?? null;
    }
    if (direction === 'down' && historyIndex.value === 0) {
      historyIndex.value = -1;
      return '';
    }
    return null;
  };

  return {
    lines,
    addLine,
    clear,
    processCommand,
    navigateHistory,
    runCode: wrapRunCode,
    stopCode,
    isWaitingForInput,
    isRunning,
  };
}