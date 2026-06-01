import { Lexer } from "./lexer/lexer";
import { Parser } from "./parser/parser";
import { Interpreter } from "./interpreter/interpreter";
import { HaltFatalSignal } from "./interpreter/interpreter";
export { registerVFS } from "./vfs";

export interface RunResult {
    output: string[];
    error?: string;
}

export function runSource(
    source: string,
    inputLines: string[] = [],
    onOutput?: (line: string) => void,
    onStdinRequest?: () => string
): RunResult {
    const output: string[] = [];
    try {
        const tokens = new Lexer(source).tokenize();
        const ast = new Parser(tokens).parse();
        const interpreter = new Interpreter();
        interpreter.output = (line) => {
            output.push(line);
            if (onOutput) onOutput(line);
        };
        if (onStdinRequest) {
            interpreter.readLine = onStdinRequest;
        } else {
            const inputQueue = [...inputLines];
            interpreter.readLine = () => inputQueue.shift() ?? "";
        }
        interpreter.run(ast);
        return { output };
    } catch (err: any) {
        if (err.format) return { output, error: err.format() }; // XcxError
        if (err instanceof HaltFatalSignal) return { output, error: `halt.fatal: ${err.message}` };
        return { output, error: err instanceof Error ? err.stack || err.message : String(err) };
    }
}
