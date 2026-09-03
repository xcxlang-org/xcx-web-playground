import { ASTNode, ArrayMethodCallNode, CallExprNode, ReturnNode } from "../parser/ast";
import { Environment } from "./environment";
import { RuntimeValue, makeInt, makeFloat, makeStr, makeBool, makeDate } from "./values";
import { Interpreter } from "./interpreter";
import { RuntimeError } from "../errors/errors";
import { perfStart } from "./eval/expressions";

export interface JITResult {
    runner: (locals: Record<string, any>, print: (v: any) => void, wait: (ms: number) => void, perf: any, call: any) => void;
    externalVars: Set<string>;
}

export const jitMul = (a: any, b: any) => {
    if (typeof a === "number" && typeof b === "number" && Number.isInteger(a) && Number.isInteger(b)) {
        const prod = a * b;
        if (Number.isSafeInteger(prod)) return prod;
        return Math.imul(a, b);
    }
    return a * b;
};

export const jitMod = (a: any, b: any) => {
    if (typeof a === "number" && typeof b === "number" && Number.isInteger(a) && Number.isInteger(b)) {
        const res = a % b;
        return res < 0 ? res + Math.abs(b) : res;
    }
    return a % b;
};

export const jitS = (v: any) => String(v);
export const jitI = (v: any) => Math.trunc(Number(v));
export const jitF = (v: any) => Number(v);
export const jitB = (v: any) => Boolean(v);

export function compileLoopToJIT(
    _i: Interpreter,
    node: ASTNode,
    env: Environment
): JITResult | null {
    try {
        const accessedVars = new Set<string>();
        collectVariables(node, accessedVars);

        const externalVars = new Set<string>();
        for (const varName of accessedVars) {
            if (env.has(varName)) {
                externalVars.add(varName);
            }
        }

        const declaredInLoop = new Set<string>();
        const code = transpile(node, declaredInLoop);

        const runner = new Function("__jit_locals", "__jit_print", "__jit_wait", "__jit_perf", "__jit_call", "__jit_mul", "__jit_mod", "__jit_s", "__jit_i", "__jit_f", "__jit_b", code);

        return {
            runner: (locals: Record<string, any>, print: (v: any) => void, wait: (ms: number) => void, perf: any, call: any) => {
                try {
                    runner(locals, print, wait, perf, call, jitMul, jitMod, jitS, jitI, jitF, jitB);
                } catch (e) {
                    if (e instanceof RangeError && /call stack|recursion/i.test(e.message)) {
                        throw new RuntimeError("Stack overflow: too much recursion", 1);
                    }
                    throw e;
                }
            },
            externalVars
        };
    } catch (e) {
        return null;
    }
}

function collectVariables(node: ASTNode, vars: Set<string>): void {
    if (!node) return;
    switch (node.kind) {
        case "Identifier":
            vars.add(node.name);
            break;
        case "BinaryExpr":
            collectVariables(node.left, vars);
            collectVariables(node.right, vars);
            break;
        case "UnaryExpr":
            collectVariables(node.operand, vars);
            break;
        case "VarAssign":
            vars.add(node.name);
            collectVariables(node.value, vars);
            break;
        case "VarDeclaration":
            vars.add(node.name);
            if (node.value) collectVariables(node.value, vars);
            break;
        case "MultiVarDeclaration":
            node.declarations.forEach(d => collectVariables(d, vars));
            break;
        case "ConstDeclaration":
            vars.add(node.name);
            collectVariables(node.value, vars);
            break;
        case "Print":
            collectVariables(node.value, vars);
            break;
        case "Wait":
            collectVariables(node.ms, vars);
            break;
        case "Perf":
            break;
        case "If":
            collectVariables(node.ifBranch.condition, vars);
            node.ifBranch.body.forEach(n => collectVariables(n, vars));
            node.elseifBranches.forEach(b => {
                collectVariables(b.condition, vars);
                b.body.forEach(n => collectVariables(n, vars));
            });
            if (node.elseBranch) {
                node.elseBranch.forEach(n => collectVariables(n, vars));
            }
            break;
        case "While":
            collectVariables(node.condition, vars);
            node.body.forEach(n => collectVariables(n, vars));
            break;
        case "For":
            if (node.start) collectVariables(node.start, vars);
            if (node.end) collectVariables(node.end, vars);
            if (node.step) collectVariables(node.step, vars);
            node.body.forEach(n => collectVariables(n, vars));
            break;
        case "ArrayMethodCall":
            vars.add((node as ArrayMethodCallNode).arrayName);
            (node as ArrayMethodCallNode).args.forEach(arg => collectVariables(arg, vars));
            break;
        case "GenericMethodCall": {
            const gNode = node as any;
            if (gNode.object && gNode.object.kind === "Identifier") {
                vars.add(gNode.object.name);
            } else if (gNode.object) {
                collectVariables(gNode.object, vars);
            }
            gNode.args.forEach((arg: any) => collectVariables(arg, vars));
            break;
        }
        case "CallExpr":
            (node as CallExprNode).args.forEach(arg => collectVariables(arg, vars));
            break;
        case "Return":
            if ((node as ReturnNode).value) collectVariables((node as ReturnNode).value!, vars);
            break;
        case "Break":
        case "Continue":
        case "Literal":
            break;
        default:
            throw new Error(`Unsupported variable collection kind: ${node.kind}`);
    }
}

function transpile(node: ASTNode, declaredInLoop: Set<string>, currentFunctionName?: string): string {
    if (!node) return "";
    switch (node.kind) {
        case "Literal":
            if (node.literalType === "str") {
                return JSON.stringify(node.value);
            }
            return String(node.value);
        case "Identifier":
            if (declaredInLoop.has(node.name)) {
                return node.name;
            }
            return `__jit_locals.${node.name}`;
        case "BinaryExpr": {
            let op = node.operator as string;
            if (op === "==") op = "===";
            else if (op === "!=") op = "!==";
            else if (op === "AND") op = "&&";
            else if (op === "OR") op = "||";
            else if (op === "HAS") {
                return `String(${transpile(node.left, declaredInLoop, currentFunctionName)}).includes(String(${transpile(node.right, declaredInLoop, currentFunctionName)}))`;
            } else if (op === "++") {
                return `(String(${transpile(node.left, declaredInLoop, currentFunctionName)}) + String(${transpile(node.right, declaredInLoop, currentFunctionName)}))`;
            } else if (op === "^") {
                return `Math.pow(${transpile(node.left, declaredInLoop, currentFunctionName)}, ${transpile(node.right, declaredInLoop, currentFunctionName)})`;
            } else if (op === "*") {
                return `__jit_mul(${transpile(node.left, declaredInLoop, currentFunctionName)}, ${transpile(node.right, declaredInLoop, currentFunctionName)})`;
            } else if (op === "%") {
                return `__jit_mod(${transpile(node.left, declaredInLoop, currentFunctionName)}, ${transpile(node.right, declaredInLoop, currentFunctionName)})`;
            }
            return `(${transpile(node.left, declaredInLoop, currentFunctionName)} ${op} ${transpile(node.right, declaredInLoop, currentFunctionName)})`;
        }
        case "UnaryExpr": {
            let op = node.operator;
            if (op === "!!") op = "!!";
            return `(${op}${transpile(node.operand, declaredInLoop, currentFunctionName)})`;
        }
        case "VarAssign": {
            const lhs = declaredInLoop.has(node.name) ? node.name : `__jit_locals.${node.name}`;
            return `${lhs} = ${transpile(node.value, declaredInLoop, currentFunctionName)}`;
        }
        case "VarDeclaration":
            declaredInLoop.add(node.name);
            if (node.value) {
                return `let ${node.name} = ${transpile(node.value, declaredInLoop, currentFunctionName)}`;
            }
            return `let ${node.name} = 0`;
        case "MultiVarDeclaration":
            return node.declarations.map(dec => transpile(dec, declaredInLoop, currentFunctionName)).join(";\n");
        case "ConstDeclaration":
            declaredInLoop.add(node.name);
            return `const ${node.name} = ${transpile(node.value, declaredInLoop, currentFunctionName)}`;
        case "Print":
            return `__jit_print(${transpile(node.value, declaredInLoop, currentFunctionName)})`;
        case "Break":
            return "break";
        case "Continue":
            return "continue";
        case "Wait":
            return `__jit_wait(${transpile(node.ms, declaredInLoop, currentFunctionName)})`;
        case "Perf":
            return `__jit_perf.${node.method}()`;
        case "If": {
            let code = `if (${transpile(node.ifBranch.condition, declaredInLoop, currentFunctionName)}) {\n`;
            code += transpileBlock(node.ifBranch.body, declaredInLoop, currentFunctionName);
            code += "\n}";
            for (const b of node.elseifBranches) {
                code += ` else if (${transpile(b.condition, declaredInLoop, currentFunctionName)}) {\n`;
                code += transpileBlock(b.body, declaredInLoop, currentFunctionName);
                code += "\n}";
            }
            if (node.elseBranch) {
                code += " else {\n";
                code += transpileBlock(node.elseBranch, declaredInLoop, currentFunctionName);
                code += "\n}";
            }
            return code;
        }
        case "While": {
            let code = `while (${transpile(node.condition, declaredInLoop, currentFunctionName)}) {\n`;
            code += transpileBlock(node.body, declaredInLoop, currentFunctionName);
            code += "\n}";
            return code;
        }
        case "For": {
            if (node.collection) {
                throw new Error("JIT loops over collections are not supported");
            }
            if (!node.start || !node.end) {
                throw new Error("For loop missing bounds");
            }
            const startJS = transpile(node.start, declaredInLoop, currentFunctionName);
            const endJS = transpile(node.end, declaredInLoop, currentFunctionName);
            const stepJS = node.step ? transpile(node.step, declaredInLoop, currentFunctionName) : "1";

            const stepName = `step_${node.varName}`;
            const endName = `end_${node.varName}`;

            const innerDeclared = new Set(declaredInLoop);
            innerDeclared.add(node.varName);

            let code = `{\n`;
            code += `  const ${stepName} = ${stepJS};\n`;
            code += `  const ${endName} = ${endJS};\n`;
            code += `  for (let ${node.varName} = ${startJS}; ${stepName} > 0 ? (${node.varName} <= ${endName}) : (${node.varName} >= ${endName}); ${node.varName} += ${stepName}) {\n`;
            code += transpileBlock(node.body, innerDeclared, currentFunctionName);
            code += `  }\n`;
            code += `}`;
            return code;
        }
        case "ArrayMethodCall": {
            const arr = declaredInLoop.has((node as ArrayMethodCallNode).arrayName) ? (node as ArrayMethodCallNode).arrayName : `__jit_locals.${(node as ArrayMethodCallNode).arrayName}`;
            switch ((node as ArrayMethodCallNode).method) {
                case "push":
                    return `${arr}.push(${transpile((node as ArrayMethodCallNode).args[0]!, declaredInLoop, currentFunctionName)})`;
                case "get":
                    return `${arr}[${transpile((node as ArrayMethodCallNode).args[0]!, declaredInLoop, currentFunctionName)}]`;
                case "update":
                    return `${arr}[${transpile((node as ArrayMethodCallNode).args[0]!, declaredInLoop, currentFunctionName)}] = ${transpile((node as ArrayMethodCallNode).args[1]!, declaredInLoop, currentFunctionName)}`;
                case "count":
                case "size":
                    return `${arr}.length`;
                default:
                    throw new Error(`Unsupported array method in JIT: ${(node as ArrayMethodCallNode).method}`);
            }
        }
        case "GenericMethodCall": {
            const gNode = node as any;
            const objJS = transpile(gNode.object, declaredInLoop, currentFunctionName);
            const method = gNode.method;
            if (method === "push") {
                return `${objJS}.push(${transpile(gNode.args[0], declaredInLoop, currentFunctionName)})`;
            } else if (method === "get") {
                return `${objJS}[${transpile(gNode.args[0], declaredInLoop, currentFunctionName)}]`;
            } else if (method === "update") {
                return `${objJS}[${transpile(gNode.args[0], declaredInLoop, currentFunctionName)}] = ${transpile(gNode.args[1], declaredInLoop, currentFunctionName)}`;
            } else if (method === "count" || method === "size") {
                return `${objJS}.length`;
            } else {
                throw new Error(`Unsupported generic method in JIT: ${method}`);
            }
        }
        case "CallExpr": {
            if (["s", "i", "f", "b"].includes((node as CallExprNode).callee)) {
                return `__jit_${(node as CallExprNode).callee}(${transpile((node as CallExprNode).args[0]!, declaredInLoop, currentFunctionName)})`;
            }
            const argsStr = (node as CallExprNode).args.map(arg => transpile(arg, declaredInLoop, currentFunctionName)).join(", ");
            if ((node as CallExprNode).callee === currentFunctionName) {
                return `${(node as CallExprNode).callee}(${argsStr})`;
            }
            return `__jit_call("${(node as CallExprNode).callee}", ${argsStr})`;
        }
        case "Return": {
            if ((node as ReturnNode).value) {
                return `return ${transpile((node as ReturnNode).value!, declaredInLoop, currentFunctionName)}`;
            }
            return "return";
        }
        default:
            throw new Error(`Unsupported node execution in JIT: ${node.kind}`);
    }
}

function transpileBlock(statements: ASTNode[], declaredInLoop: Set<string>, currentFunctionName?: string): string {
    const parentDeclared = new Set(declaredInLoop);
    return statements.map(s => transpile(s, parentDeclared, currentFunctionName) + ";").join("\n");
}

export function compileFunctionToJIT(
    i: Interpreter,
    name: string,
    params: { name: string; paramType: string }[],
    body: ASTNode[],
    returnType: string | null
): ((args: any[]) => RuntimeValue) | null {
    try {
        const declared = new Set<string>();
        params.forEach(p => declared.add(p.name));

        let code = "";
        for (const stmt of body) {
            code += transpile(stmt, declared, name) + ";\n";
        }

        const paramList = params.map(p => p.name).join(", ");

        const factoryCode = `
return function ${name}(${paramList}) {
    ${code}
};
`;

        const factory = new Function("__jit_s", "__jit_i", "__jit_f", "__jit_b", "__jit_perf", "__jit_print", "__jit_wait", "__jit_call", "__jit_locals", "__jit_mul", "__jit_mod", factoryCode);

        const perfHelper = {
            ms: () => Math.trunc((typeof performance !== 'undefined' ? performance.now() : Date.now()) - perfStart),
            us: () => Math.trunc(((typeof performance !== 'undefined' ? performance.now() : Date.now()) - perfStart) * 1000),
            ns: () => Math.trunc(((typeof performance !== 'undefined' ? performance.now() : Date.now()) - perfStart) * 1000000)
        };
        const printHelper = (v: any) => {
            if (i.output) i.output(String(v));
        };
        const waitHelper = (ms: number) => {
            const start = Date.now();
            while (Date.now() - start < ms) {
                // busy wait inside JIT
            }
        };
        const callHelper = (calleeName: string, ...args: any[]) => {
            return executeJITCall(i, calleeName, args);
        };
        const localsHelper = new Proxy({}, {
            get(target, prop) {
                if (typeof prop === "symbol") return (target as any)[prop];
                const env = (i as any).env as Environment;
                if (!env.has(String(prop))) return undefined;
                const val = env.get(String(prop), 0);
                if (val.kind === "scalar" || val.kind === "json") return val.value;
                if (val.kind === "date") return val.date;
                if (val.kind === "array" || val.kind === "set" || val.kind === "map") return val.elements;
                return val;
            },
            set(_target, prop, value) {
                if (typeof prop === "symbol") return false;
                const env = (i as any).env as Environment;
                const name = String(prop);
                if (env.has(name)) {
                    if (env.isConstant(name)) {
                        return false;
                    }
                    const oldVal = env.get(name, 0);
                    let newVal: RuntimeValue;
                    if (oldVal.kind === "scalar") {
                        const t = oldVal.type;
                        if (t === "int") newVal = makeInt(Math.trunc(value));
                        else if (t === "float") newVal = makeFloat(Number(value));
                        else if (t === "bool") newVal = makeBool(Boolean(value));
                        else if (t === "str") newVal = makeStr(String(value));
                        else newVal = oldVal;
                    } else if (oldVal.kind === "date") {
                        newVal = makeDate(value as Date);
                    } else {
                        newVal = oldVal;
                    }
                    env.assign(name, newVal, 0);
                    return true;
                }
                env.declare(name, "str", makeStr(String(value)), 0, false);
                return true;
            }
        });

        const jitFn = factory(jitS, jitI, jitF, jitB, perfHelper, printHelper, waitHelper, callHelper, localsHelper, jitMul, jitMod);

        const declLine = (body[0] as { line?: number } | undefined)?.line ?? 1;
        return (args: any[]) => {
            let rawResult: any;
            try {
                rawResult = jitFn(...args);
            } catch (e) {
                if (e instanceof RangeError && /call stack|recursion/i.test(e.message)) {
                    throw new RuntimeError(`Stack overflow: too much recursion in '${name}()'`, declLine);
                }
                throw e;
            }
            if (returnType === "int") return makeInt(Math.trunc(rawResult));
            if (returnType === "float") return makeFloat(Number(rawResult));
            if (returnType === "bool") return makeBool(Boolean(rawResult));
            if (returnType === "str") return makeStr(String(rawResult));
            return makeStr("");
        };
    } catch (e) {
        return null;
    }
}

export function executeJITCall(i: Interpreter, calleeName: string, args: any[]): any {
    const runtimeArgs = args.map(arg => {
        if (typeof arg === "number") {
            return Number.isInteger(arg) ? makeInt(arg) : makeFloat(arg);
        }
        if (typeof arg === "boolean") return makeBool(arg);
        if (typeof arg === "string") return makeStr(arg);
        return makeStr(String(arg));
    });

    const fn = (i as any).funcs.get(calleeName);
    if (fn) {
        if (fn.jitRunner) {
            // jitRunner expects raw JS values (see interpreter.ts evalCallExpr),
            // not wrapped RuntimeValues — wrapping here broke the JIT base-case
            // comparisons and caused infinite recursion (stack overflow).
            return fn.jitRunner(args).value;
        } else {
            const node: CallExprNode = {
                kind: "CallExpr",
                callee: calleeName,
                args: runtimeArgs.map((_, idx) => ({
                    kind: "Literal",
                    value: args[idx],
                    literalType: runtimeArgs[idx]!.type,
                    line: 0
                })),
                line: 0
            };
            return (i as any).evalCallExpr(node, (i as any).env).value;
        }
    }
    throw new Error(`Undefined function '${calleeName}' called inside JIT`);
}
