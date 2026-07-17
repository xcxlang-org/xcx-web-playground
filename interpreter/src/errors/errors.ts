export class XcxError extends Error {
  constructor(
    message: string,
    public readonly line: number,
    public readonly col?: number,
    public readonly len?: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    // Nie formatujemy tu na sztywno do metody format(), tylko przechowujemy dane.
    // ANSI format przejdzie w main() korzystając z formatter.ts
  }

  format(): string {
    const loc = this.col !== undefined
      ? `[line ${this.line}, col ${this.col}]`
      : `[line ${this.line}]`;
    const c = this.code ? `[${this.code}] ` : "";
    return `${this.name} ${loc}: ${c}${this.message}`;
  }
}

export class LexerError extends XcxError { }
export class ParseError extends XcxError { }

export class RuntimeError extends XcxError { }

// S101
export class UndefinedVariableError extends RuntimeError {
  constructor(name: string, line: number) {
    super(`Undefined variable: ${name}`, line, undefined, undefined, "S101");
  }
}

// S102
export class RedefinedVariableError extends RuntimeError {
  constructor(name: string, line: number) {
    super(`Redefined variable: ${name}`, line, undefined, undefined, "S102");
  }
}

// S103
export class TypeMismatchError extends RuntimeError {
  constructor(expected: string, got: string, line: number) {
    super(`Type mismatch: expected ${expected}, got ${got}`, line, undefined, undefined, "S103");
  }
}

// S104
export class InvalidOperationError extends RuntimeError {
  constructor(op: string, leftType: string, rightType: string, line: number) {
    super(`Invalid operation ${op} between ${leftType} and ${rightType}`, line, undefined, undefined, "S104");
  }
}

// S105
export class AssignToConstError extends RuntimeError {
  constructor(name: string, line: number) {
    super(`Cannot reassign to constant variable: ${name}`, line, undefined, undefined, "S105");
  }
}

// S106
export class BreakOutsideLoopError extends RuntimeError {
  constructor(line: number) {
    super(`Break statement outside of loop`, line, undefined, undefined, "S106");
  }
}

// S107
export class ContinueOutsideLoopError extends RuntimeError {
  constructor(line: number) {
    super(`Continue statement outside of loop`, line, undefined, undefined, "S107");
  }
}

// S108
export class IndexAccessError extends RuntimeError {
  constructor(type: string, line: number) {
    super(`Index access not supported for type ${type}`, line, undefined, undefined, "S108");
  }
}

// S109
export class PropertyNotFoundError extends RuntimeError {
  constructor(prop: string, type: string, line: number) {
    super(`Property '${prop}' not found on type ${type}`, line, undefined, undefined, "S109");
  }
}

// S110
export class MethodNotFoundError extends RuntimeError {
  constructor(method: string, type: string, line: number) {
    super(`Method '${method}' not found on type ${type}`, line, undefined, undefined, "S110");
  }
}

// S111
export class ArgumentCountError extends RuntimeError {
  constructor(expected: number, got: number, line: number) {
    super(`Incorrect number of arguments: expected ${expected}, got ${got}`, line, undefined, undefined, "S111");
  }
}