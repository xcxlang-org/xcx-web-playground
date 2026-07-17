import {
  ASTNode, ProgramNode, VarDeclarationNode, MultiVarDeclarationNode, ConstDeclarationNode, VarAssignNode,
  PrintNode, InputNode, BinaryExprNode, UnaryExprNode,
  LiteralNode, IfNode, FuncDeclarationNode, CallExprNode, ReturnNode,
  WhileNode, ForNode, WaitNode,
  ArrayDeclarationNode, ArrayMethodCallNode,
  DateConstructorNode, DatePropertyNode, DateFormatNode,
  PerfNode,
  RandomIntNode, RandomFloatNode, RandomChoiceNode,
  XcxType, FuncParam,
  StringPropertyNode, StringMethodCallNode,
  GenericMethodCallNode, HaltNode,
  SetDeclarationNode, SetBinaryExprNode, SetMethodCallNode,
  MapDeclarationNode, MapMethodCallNode,
  TableDeclarationNode, PropertyAccessNode,
  TerminalCommandNode, InputKeyNode, InputReadyNode,
  JsonLiteralNode, JsonParseNode,
  IncludeNode
} from "../parser/ast";
import {
  RuntimeValue,
  makeInt, makeFloat, makeStr, makeBool, makeDate, makeSet,
  displayValue, DEFAULT_VALUES, asScalar, asSet,
  JsonValue, TableValue, makeNamespace
} from "./values";
import { Environment } from "./environment";
import { RuntimeError } from "../errors/errors";

import {
  evalUnaryExpr,
  evalBinaryExpr,
  evalLiteral,
  evalDateConstructor,
  evalDateProperty,
  evalDateFormat,
  evalPerfNode,
  evalRandomInt,
  evalRandomFloat,
  evalRandomChoice,
  evalStringProperty,
  evalStringMethodCall,
  evalPropertyAccess,
  evalGenericMethodCall,
  evalInputKey,
  evalInputReady,
  evalJsonLiteral,
  evalJsonParse
} from "./eval/expressions";

import {
  evalVarDeclaration,
  evalConstDeclaration,
  evalVarAssign,
  evalArrayDeclaration,
  evalTableDeclaration,
  evalSetDeclaration,
  evalMapDeclaration
} from "./eval/declarations";

import {
  evalReturn,
  evalPrint,
  evalInput,
  evalIf,
  evalWhile,
  evalFor,
  evalBlock,
  evalWait,
  evalTerminalCommand,
  evalHalt
} from "./eval/flow";

import {
  evalArrayMethodCall,
  evalSetMethodCall,
  evalMapMethodCall,
  evalTableMethodCall,
  evalJsonMethodCall
} from "./eval/collections";

import { vfsResolve, vfsCanonical } from "../vfs";
import { Lexer } from "../lexer/lexer";
import { Parser } from "../parser/parser";
import { compileFunctionToJIT } from "./jit";

const MAX_CALL_DEPTH = 800;
const CAST_BUILTINS = new Set(["s", "i", "f", "b"]);

export class ReturnSignal { constructor(public readonly value: RuntimeValue | null) { } }
export class BreakSignal { }
export class ContinueSignal { }
export class HaltErrorSignal { }
export class HaltFatalSignal { constructor(public readonly message: string) { } }

interface FuncRecord {
  params: FuncParam[];
  returnType: XcxType | null;
  body: ASTNode[];
  jitRunner?: ((args: any[]) => RuntimeValue) | null;
}

export class Interpreter {
  private readonly env = new Environment();
  private readonly funcs = new Map<string, FuncRecord>();
  private readonly astCache = new Map<string, ProgramNode>();
  private currentAlias: string | null = null;
  private callDepth = 0;
  /** Tracks modules currently being loaded — used for cyclic dependency detection. */
  private readonly loadingStack = new Set<string>();

  output: (line: string) => void = () => { };

  readLine: () => string = () => "";

  run(program: ProgramNode): void {
    try {
      for (const node of program.body) {
        if (node.kind === "FuncDeclaration") {
          this.evalFuncDeclaration(node);
        }
      }
      for (const node of program.body) {
        if (node.kind !== "FuncDeclaration") {
          this.evalNode(node, this.env);
        }
      }
    } catch (err) {
      if (err instanceof HaltErrorSignal) {
        throw new RuntimeError("halt.error: Function call frame aborted in root scope", 0);
      }
      if (err instanceof HaltFatalSignal) {
        throw err;
      }
      throw err;
    }
  }

  evalNode(node: ASTNode, env: Environment): RuntimeValue {
    switch (node.kind) {
      case "Program": return this.evalProgram(node, env);
      case "VarDeclaration": return this.evalVarDeclaration(node, env);
      case "ConstDeclaration": return this.evalConstDeclaration(node, env);
      case "VarAssign": return this.evalVarAssign(node, env);
      case "Print": return this.evalPrint(node, env);
      case "Input": return this.evalInput(node, env);
      case "If": return this.evalIf(node, env);
      case "While": return this.evalWhile(node, env);
      case "For": return this.evalFor(node, env);
      case "FuncDeclaration": return this.evalFuncDeclaration(node);
      case "CallExpr": return this.evalCallExpr(node, env);
      case "Return": return this.evalReturn(node, env);
      case "Break": throw new BreakSignal();
      case "Continue": throw new ContinueSignal();
      case "BinaryExpr": return this.evalBinaryExpr(node, env);
      case "UnaryExpr": return this.evalUnaryExpr(node, env);
      case "Identifier": return env.get(node.name, node.line);
      case "Literal": return this.evalLiteral(node);
      case "ArrayDeclaration": return this.evalArrayDeclaration(node, env);
      case "ArrayMethodCall": return this.evalArrayMethodCall(node, env);
      case "MultiVarDeclaration": {
        let last: RuntimeValue = makeInt(0);
        for (const decl of (node as MultiVarDeclarationNode).declarations) {
          last = this.evalNode(decl, env);
        }
        return last;
      }
      case "TableDeclaration": return this.evalTableDeclaration(node as TableDeclarationNode, env);
      case "DateConstructor": return this.evalDateConstructor(node, env);
      case "DateNow": return makeDate(new Date());
      case "DateProperty": return this.evalDateProperty(node, env);
      case "DateFormat": return this.evalDateFormat(node, env);
      case "Perf": return this.evalPerfNode(node as PerfNode, env);
      case "RandomInt": return this.evalRandomInt(node, env);
      case "RandomFloat": return this.evalRandomFloat(node, env);
      case "RandomChoice": return this.evalRandomChoice(node, env);
      case "StringProperty": return this.evalStringProperty(node, env);
      case "StringMethodCall": return this.evalStringMethodCall(node, env);
      case "PropertyAccess": return this.evalPropertyAccess(node as PropertyAccessNode, env);
      case "SetDeclaration": return this.evalSetDeclaration(node, env);
      case "SetBinaryExpr": return this.evalSetBinaryExpr(node, env);
      case "SetMethodCall": return this.evalSetMethodCall(node, env);
      case "GenericMethodCall": return this.evalGenericMethodCall(node as GenericMethodCallNode, env);
      case "MapDeclaration": return this.evalMapDeclaration(node, env);
      case "MapMethodCall": return this.evalMapMethodCall(node, env);
      case "Halt": return this.evalHalt(node, env);
      case "Wait": return this.evalWait(node, env);
      case "TerminalCommand": return this.evalTerminalCommand(node as TerminalCommandNode, env);
      case "InputKey": return this.evalInputKey(node as InputKeyNode, env);
      case "InputReady": return this.evalInputReady(node as InputReadyNode, env);
      case "JsonLiteral": return this.evalJsonLiteral(node as JsonLiteralNode, env);
      case "JsonParse": return this.evalJsonParse(node as JsonParseNode, env);
      case "Include": return this.evalInclude(node as IncludeNode, env);

      case "Lambda":
        throw new RuntimeError("Lambda expressions cannot be evaluated directly, use them in table methods", node.line);
      default: {
        const _never: never = node;
        throw new RuntimeError(`Unknown AST node: ${JSON.stringify(_never)}`, 0);
      }
    }
  }

  // Delegated implementation methods
  private evalProgram = (node: ProgramNode, env: Environment) => {
    for (const child of node.body) {
      if (child.kind === "FuncDeclaration") {
        this.evalFuncDeclaration(child);
      }
    }
    let last: RuntimeValue = makeStr("");
    for (const child of node.body) {
      if (child.kind !== "FuncDeclaration") {
        last = this.evalNode(child, env);
      }
    }
    return last;
  };

  private evalVarDeclaration = (node: VarDeclarationNode, env: Environment) => evalVarDeclaration(this, node, env);
  private evalConstDeclaration = (node: ConstDeclarationNode, env: Environment) => evalConstDeclaration(this, node, env);
  private evalVarAssign = (node: VarAssignNode, env: Environment) => evalVarAssign(this, node, env);
  private evalPrint = (node: PrintNode, env: Environment) => evalPrint(this, node, env);
  private evalInput = (node: InputNode, env: Environment) => evalInput(this, node, env);
  private evalIf = (node: IfNode, env: Environment) => evalIf(this, node, env);
  private evalWhile = (node: WhileNode, env: Environment) => evalWhile(this, node, env);
  private evalFor = (node: ForNode, env: Environment) => evalFor(this, node, env);
  private evalReturn = (node: ReturnNode, env: Environment) => evalReturn(this, node, env);
  private evalBinaryExpr = (node: BinaryExprNode, env: Environment) => evalBinaryExpr(this, node, env);
  private evalUnaryExpr = (node: UnaryExprNode, env: Environment) => evalUnaryExpr(this, node, env);
  private evalLiteral = (node: LiteralNode) => evalLiteral(node);
  private evalArrayDeclaration = (node: ArrayDeclarationNode, env: Environment) => evalArrayDeclaration(this, node, env);
  evalArrayMethodCall = (node: ArrayMethodCallNode, env: Environment) => evalArrayMethodCall(this, node, env);
  private evalTableDeclaration = (node: TableDeclarationNode, env: Environment) => evalTableDeclaration(this, node, env);
  private evalDateConstructor = (node: DateConstructorNode, env: Environment) => evalDateConstructor(this, node, env);
  private evalDateProperty = (node: DatePropertyNode, env: Environment) => evalDateProperty(this, node, env);
  private evalDateFormat = (node: DateFormatNode, env: Environment) => evalDateFormat(this, node, env);
  private evalPerfNode = (node: PerfNode, env: Environment) => evalPerfNode(this, node, env);
  private evalRandomInt = (node: RandomIntNode, env: Environment) => evalRandomInt(this, node, env);
  private evalRandomFloat = (node: RandomFloatNode, env: Environment) => evalRandomFloat(this, node, env);
  private evalRandomChoice = (node: RandomChoiceNode, env: Environment) => evalRandomChoice(this, node, env);
  private evalStringProperty = (node: StringPropertyNode, env: Environment) => evalStringProperty(this, node, env);
  private evalStringMethodCall = (node: StringMethodCallNode, env: Environment) => evalStringMethodCall(this, node, env);
  private evalPropertyAccess = (node: PropertyAccessNode, env: Environment) => evalPropertyAccess(this, node, env);
  private evalSetDeclaration = (node: SetDeclarationNode, env: Environment) => evalSetDeclaration(this, node, env);

  evalSetBinaryExpr(node: SetBinaryExprNode, env: Environment): RuntimeValue {
    const leftRv = this.evalNode(node.left, env);
    const rightRv = this.evalNode(node.right, env);
    const left = asSet(leftRv, "set operation left");
    const right = asSet(rightRv, "set operation right");

    const r: Set<number | string | boolean> = new Set();
    switch (node.operator) {
      case "UNION":
        left.elements.forEach(e => r.add(e));
        right.elements.forEach(e => r.add(e));
        break;
      case "INTERSECTION":
        left.elements.forEach(e => { if (right.elements.has(e)) r.add(e); });
        break;
      case "DIFFERENCE":
        left.elements.forEach(e => { if (!right.elements.has(e)) r.add(e); });
        break;
      case "SYMMETRIC_DIFFERENCE":
        left.elements.forEach(e => { if (!right.elements.has(e)) r.add(e); });
        right.elements.forEach(e => { if (!left.elements.has(e)) r.add(e); });
        break;
    }
    return makeSet(left.domain, r);
  }

  evalSetMethodCall = (node: SetMethodCallNode, env: Environment) => evalSetMethodCall(this, node, env);
  private evalGenericMethodCall = (node: GenericMethodCallNode, env: Environment) => evalGenericMethodCall(this, node, env);
  private evalMapDeclaration = (node: MapDeclarationNode, env: Environment) => evalMapDeclaration(this, node, env);
  evalMapMethodCall = (node: MapMethodCallNode, env: Environment) => evalMapMethodCall(this, node, env);
  evalTableMethodCall = (node: GenericMethodCallNode, tv: TableValue, env: Environment) => evalTableMethodCall(this, node, tv, env);
  private evalHalt = (node: HaltNode, env: Environment) => evalHalt(this, node, env);
  private evalWait = (node: WaitNode, env: Environment) => evalWait(this, node, env);
  private evalTerminalCommand = (node: TerminalCommandNode, env: Environment) => evalTerminalCommand(this, node, env);
  private evalInputKey = (node: InputKeyNode, env: Environment) => evalInputKey(this, node, env);
  private evalInputReady = (node: InputReadyNode, env: Environment) => evalInputReady(this, node, env);
  private evalJsonLiteral = (node: JsonLiteralNode, env: Environment) => evalJsonLiteral(this, node, env);
  private evalJsonParse = (node: JsonParseNode, env: Environment) => evalJsonParse(this, node, env);
  evalJsonMethodCall = (node: GenericMethodCallNode, obj: JsonValue, env: Environment) => evalJsonMethodCall(this, node, obj, env);

  evalNamespaceMethodCall(node: GenericMethodCallNode, obj: any, env: Environment): RuntimeValue {
    const callee = `${obj.name}.${node.method}`;
    return this.evalCallExpr({ kind: "CallExpr", callee, args: node.args, line: node.line }, env);
  }

  private evalInclude = (node: IncludeNode, env: Environment): RuntimeValue => {
    const rawPath = node.path;
    const can = vfsCanonical(rawPath);
    const source = vfsResolve(rawPath);
    if (source === null) {
      throw new RuntimeError(`Cannot resolve file for include: '${rawPath}'`, node.line);
    }

    if (this.loadingStack.has(can)) {
      throw new RuntimeError(`Cyclic dependency detected for module: '${rawPath}'`, node.line);
    }

    // Parse the included module
    let ast = this.astCache.get(can);
    if (!ast) {
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      try {
        ast = parser.parse();
        this.astCache.set(can, ast);
      } catch (e: any) {
        throw new RuntimeError(`Failed to parse module '${rawPath}': ${e.message}`, node.line);
      }
    }

    // Evaluate the module in its own isolated environment
    const moduleEnv = new Environment(this.env);

    const prevAlias = this.currentAlias;
    if (node.alias) {
      this.currentAlias = this.currentAlias ? `${this.currentAlias}.${node.alias}` : node.alias;
    }

    this.loadingStack.add(can);
    try {
      for (const st of ast.body) {
        if (st.kind === "FuncDeclaration") {
          this.evalFuncDeclaration(st);
        }
      }
      for (const st of ast.body) {
        if (st.kind !== "FuncDeclaration") {
          this.evalNode(st, moduleEnv);
        }
      }
    } finally {
      this.loadingStack.delete(can);
      this.currentAlias = prevAlias;
    }

    if (node.alias) {
      // Package into a NamespaceValue
      const exports = new Map<string, RuntimeValue>();
      const store = (moduleEnv as any).store as Map<string, any>;
      for (const [key, record] of store.entries()) {
        exports.set(key, record.value);
      }
      env.declare(node.alias, "namespace", makeNamespace(node.alias, exports), node.line, true, false);
    } else {
      // Merge all declarations into the importer's environment
      const store = (moduleEnv as any).store as Map<string, any>;
      for (const [key, record] of store.entries()) {
        env.declare(key, record.declaredType, record.value, node.line, record.isConst, false);
      }
    }

    return makeStr("");
  };

  private evalFuncDeclaration(node: FuncDeclarationNode): RuntimeValue {
    const aliasedName = this.currentAlias ? `${this.currentAlias}.${node.name}` : node.name;
    if (this.funcs.has(aliasedName)) {
      throw new RuntimeError(`Function '${aliasedName}' is already defined`, node.line);
    }
    const jitRunner = compileFunctionToJIT(
      this,
      node.name,
      node.params,
      node.body,
      node.returnType
    );
    this.funcs.set(aliasedName, {
      params: node.params,
      returnType: node.returnType,
      body: node.body,
      jitRunner,
    });
    return makeStr("");
  }

  private evalCallExpr(node: CallExprNode, env: Environment): RuntimeValue {
    if (CAST_BUILTINS.has(node.callee) && node.args.length === 1) {
      const arg = this.evalNode(node.args[0]!, env);
      if (node.callee === "s") return makeStr(displayValue(arg));

      const v = asScalar(arg, `${node.callee}() cast`);
      if (node.callee === "i") {
        if (v.type === "bool") throw new RuntimeError(`Cannot cast 'bool' to 'int'`, node.line);
        if (v.type === "int") return v;
        if (v.type === "float") return makeInt(Math.trunc(v.value as number));
        if (v.type === "str") return makeInt(parseInt(String(v.value).trim(), 10) || 0);
        return makeInt(0);
      }
      if (node.callee === "f") {
        if (v.type === "bool") throw new RuntimeError(`Cannot cast 'bool' to 'float'`, node.line);
        if (v.type === "float") return v;
        if (v.type === "int") return makeFloat(v.value as number);
        if (v.type === "str") return makeFloat(parseFloat(String(v.value).trim()) || 0);
        return makeFloat(0);
      }
      if (node.callee === "b") {
        if (v.type === "bool") return v;
        if (v.type === "int" || v.type === "float") return makeBool(v.value !== 0);
        if (v.type === "str") return makeBool(v.value !== "" && v.value !== "false");
        return makeBool(false);
      }
    }

    const fn = this.funcs.get(node.callee);
    if (!fn) throw new RuntimeError(`Undefined function '${node.callee}'`, node.line);

    if (node.args.length !== fn.params.length) {
      throw new RuntimeError(
        `Function '${node.callee}' expects ${fn.params.length} argument(s), got ${node.args.length}`,
        node.line,
      );
    }

    if (this.callDepth >= MAX_CALL_DEPTH) {
      throw new RuntimeError(`Stack overflow: max call depth (${MAX_CALL_DEPTH}) exceeded`, node.line);
    }

    const argValues = node.args.map((arg, idx) => {
      const val = this.evalNode(arg, env);
      const expectedType = fn.params[idx]!.paramType;
      const sv = asScalar(val, `Argument ${idx + 1} of '${node.callee}'`);
      if (sv.type !== expectedType) {
        throw new RuntimeError(
          `Type mismatch on argument ${idx + 1} of '${node.callee}': expected '${expectedType}' but got '${sv.type}'`,
          node.line,
        );
      }
      return sv;
    });

    const callEnv = new Environment(this.env);
    for (let idx = 0; idx < fn.params.length; idx++) {
      callEnv.declare(fn.params[idx]!.name, fn.params[idx]!.paramType, argValues[idx]!, node.line, false);
    }

    if (fn.jitRunner) {
      return fn.jitRunner(argValues.map(v => v.value));
    }

    this.callDepth++;
    try {
      evalBlock(this, fn.body, callEnv);
      this.callDepth--;
      return DEFAULT_VALUES[fn.returnType ?? "int"] ?? makeStr("");
    } catch (sig) {
      this.callDepth--;
      if (sig instanceof HaltErrorSignal) {
        return DEFAULT_VALUES[fn.returnType ?? "int"] ?? makeStr("");
      }
      if (sig instanceof ReturnSignal) {
        const val = sig.value;
        if (fn.returnType !== null) {
          if (val === null) {
            throw new RuntimeError(
              `Function '${node.callee}' expected return value of type '${fn.returnType}', got void`,
              node.line,
            );
          }
          const sv = asScalar(val, `Return value of '${node.callee}'`);
          if (sv.type !== fn.returnType) {
            throw new RuntimeError(
              `Type mismatch on return of '${node.callee}': expected '${fn.returnType}' but got '${sv.type}'`,
              node.line,
            );
          }
          return sv;
        } else {
          if (val !== null) {
            throw new RuntimeError(
              `Void function '${node.callee}' returned value`,
              node.line,
            );
          }
        }
        return makeStr("");
      }
      throw sig;
    }
  }
}

// ── JSON Helpers (Deduplicated & optimized away from closures) ───────────────

export function getNestedJsonPath(root: any, path: string): { parent: any, key: string, targetItem: any } | null {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  const last = parts.pop()!;
  let current = root;
  for (const p of parts) {
    if (!(p in current)) return null;
    current = current[p];
  }
  return { parent: current, key: last, targetItem: current[last] };
}

export function runtimeValueToJson(rv: RuntimeValue): any {
  if (rv.kind === "scalar") return rv.value;
  if (rv.kind === "array") return rv.elements.map(e => e);
  if (rv.kind === "json") return rv.value;
  return null;
}


