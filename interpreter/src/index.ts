import * as fs from "fs";
import * as path from "path";
import { Lexer } from "./lexer/lexer";
import { Parser } from "./parser/parser";
import { Interpreter } from "./interpreter/interpreter";
import { XcxError, ParseError, LexerError } from "./errors/errors";
import { formatCompilerError } from "./errors/formatter";
import { HaltFatalSignal } from "./interpreter/interpreter";
export { runSource, type RunResult } from "./run";
import { registerVFS } from "./vfs";

function main(): void {
  const filePath = process.argv[2];
  if (!filePath) { console.error("Usage: xcx <file.xcx>"); process.exit(1); }
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) { console.error(`File not found: ${resolved}`); process.exit(1); }

  const libDir = path.resolve(__dirname, "../lib");
  if (fs.existsSync(libDir)) {
    fs.readdirSync(libDir).forEach(file => {
      if (file.endsWith(".xcx")) {
        const content = fs.readFileSync(path.join(libDir, file), 'utf8');
        registerVFS(file, content);
      }
    });
  }

  const source = fs.readFileSync(resolved, "utf-8");
  try {
    const tokens = new Lexer(source).tokenize();
    const sourceLines = source.split(/\r?\n/);
    const ast = new Parser(tokens).parse();
    const interpreter = new Interpreter();
    interpreter.output = (line) => process.stdout.write(line + "\n");
    // Default interpreter.output uses process.stdout.write, which we want for real-time printing.
    interpreter.run(ast);
  } catch (err: any) {
    const sourceLines = source.split(/\r?\n/);
    if (err instanceof ParseError || err instanceof LexerError) {
      process.stdout.write(formatCompilerError(err, sourceLines));
      process.exit(1);
    } else if (err instanceof XcxError) {
      const isSema = err.code && err.code.startsWith("S");
      if (isSema) {
        process.stdout.write(formatCompilerError(err, sourceLines));
        process.exit(1);
      } else {
        process.stderr.write(`XCX Fatal: ${err.message}\n`);
        process.exit(1);
      }
    } else if (err instanceof HaltFatalSignal) {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    } else {
      process.stderr.write(String(err) + "\n");
      process.exit(1);
    }
  }
}

if (require.main === module) {
  main();
}