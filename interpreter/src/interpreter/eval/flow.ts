import type { Interpreter } from "../interpreter";
import { Environment } from "../environment";
import {
    ASTNode,
    IfNode,
    WhileNode,
    ForNode,
    ReturnNode,
    PrintNode,
    InputNode,
    WaitNode,
    TerminalCommandNode,
    HaltNode
} from "../../parser/ast";
import {
    RuntimeValue,
    makeBool,
    makeInt,
    makeFloat,
    makeStr,
    makeDate,
    SetValue,
    ArrayValue,
    ScalarValue,
    asScalar,
    displayValue
} from "../values";
import {
    ReturnSignal,
    BreakSignal,
    ContinueSignal,
    HaltErrorSignal,
    HaltFatalSignal
} from "../interpreter";
import { RuntimeError } from "../../errors/errors";
import { isTruthy, wrapElement } from "./expressions";

export function evalReturn(i: Interpreter, node: ReturnNode, env: Environment): RuntimeValue {
    const value = node.value !== null ? i.evalNode(node.value, env) : null;
    throw new ReturnSignal(value);
}

export function evalPrint(i: Interpreter, node: PrintNode, env: Environment): RuntimeValue {
    const value = i.evalNode(node.value, env);
    i.output(displayValue(value));
    return value;
}

export function evalInput(i: Interpreter, node: InputNode, env: Environment): RuntimeValue {
    const current = env.get(node.name, node.line);
    if (current.kind === "array") {
        throw new RuntimeError(`Cannot read input into array variable '${node.name}'`, node.line);
    }
    if (current.kind === "date") {
        throw new RuntimeError(`Cannot read input into date variable '${node.name}'`, node.line);
    }
    const varType = (current as ScalarValue).type;
    const raw = i.readLine();

    let parsed: RuntimeValue;
    switch (varType) {
        case "int": {
            const n = parseInt(raw, 10);
            if (isNaN(n)) throw new RuntimeError(`halt.error: Cannot parse '${raw}' as int`, node.line);
            parsed = makeInt(n);
            break;
        }
        case "float": {
            const f = parseFloat(raw);
            if (isNaN(f)) throw new RuntimeError(`halt.error: Cannot parse '${raw}' as float`, node.line);
            parsed = makeFloat(f);
            break;
        }
        case "bool": {
            if (raw === "true") parsed = makeBool(true);
            else if (raw === "false") parsed = makeBool(false);
            else throw new RuntimeError(`halt.error: Cannot parse '${raw}' as bool`, node.line);
            break;
        }
        case "str":
            parsed = makeStr(raw);
            break;
        default:
            throw new RuntimeError(`Cannot read input into '${varType}' variable`, node.line);
    }

    env.assign(node.name, parsed, node.line);
    return parsed;
}

export function evalIf(i: Interpreter, node: IfNode, env: Environment): RuntimeValue {
    if (isTruthy(i, i.evalNode(node.ifBranch.condition, env), node.line)) {
        return evalBlock(i, node.ifBranch.body, new Environment(env));
    }
    for (const branch of node.elseifBranches) {
        if (isTruthy(i, i.evalNode(branch.condition, env), node.line)) {
            return evalBlock(i, branch.body, new Environment(env));
        }
    }
    if (node.elseBranch !== null) {
        return evalBlock(i, node.elseBranch, new Environment(env));
    }
    return makeInt(0);
}

export function evalWhile(i: Interpreter, node: WhileNode, env: Environment): RuntimeValue {
    let last: RuntimeValue = makeInt(0);
    while (isTruthy(i, i.evalNode(node.condition, env), node.line)) {
        const iterationEnv = new Environment(env);
        try {
            last = evalBlock(i, node.body, iterationEnv);
        } catch (sig) {
            if (sig instanceof BreakSignal) break;
            if (sig instanceof ContinueSignal) continue;
            throw sig;
        }
    }
    return last;
}

export function evalFor(i: Interpreter, node: ForNode, env: Environment): RuntimeValue {
    if (node.collection) {
        const collVal = i.evalNode(node.collection, env);
        if (collVal.kind === "set") {
            return evalForSet(i, node.varName, collVal as SetValue, node.body, env, node.line);
        } else if (collVal.kind === "array") {
            return evalForArray(i, node.varName, collVal as ArrayValue, node.body, env, node.line);
        } else {
            throw new RuntimeError(`Cannot iterate over '${collVal.kind}'`, node.line);
        }
    }

    if (node.start === undefined || node.end === undefined) {
        throw new RuntimeError(`Invalid for loop bounds`, node.line);
    }

    const startVal = asScalar(i.evalNode(node.start, env), "loop start").value as number;
    const endVal = asScalar(i.evalNode(node.end, env), "loop end").value as number;
    let step = 1;
    if (node.step) {
        step = asScalar(i.evalNode(node.step, env), "loop step").value as number;
    }

    const parent = env;
    let last: RuntimeValue = makeInt(0);

    const cond = step > 0 ? (index: number) => index <= endVal : (index: number) => index >= endVal;
    for (let index = startVal; cond(index); index += step) {
        const childEnv = new Environment(parent);
        childEnv.declare(node.varName, "int", makeInt(index), node.line, false, true);
        try {
            last = evalBlock(i, node.body, childEnv);
        } catch (sig) {
            if (sig instanceof BreakSignal) break;
            if (sig instanceof ContinueSignal) continue;
            throw sig;
        }
    }
    return last;
}

export function evalForSet(
    i: Interpreter,
    varName: string,
    setVal: SetValue,
    body: ASTNode[],
    env: Environment,
    line: number,
): RuntimeValue {
    let last: RuntimeValue = makeInt(0);
    const elements = Array.from(setVal.elements);
    const parent = env;

    const t = setVal.domain === "N" || setVal.domain === "Z" ? "int" :
        setVal.domain === "Q" ? "float" :
            setVal.domain === "S" ? "str" :
                setVal.domain === "B" ? "bool" : "date";

    for (const elem of elements) {
        const childEnv = new Environment(parent);
        const wrapper = t === "int" ? makeInt(Number(elem)) :
            t === "float" ? makeFloat(Number(elem)) :
                t === "str" ? makeStr(String(elem)) :
                    t === "bool" ? makeBool(Boolean(elem)) :
                        makeDate(new Date(elem as any));

        childEnv.declare(varName, t, wrapper, line, false, true);
        try {
            last = evalBlock(i, body, childEnv);
        } catch (sig) {
            if (sig instanceof BreakSignal) break;
            if (sig instanceof ContinueSignal) continue;
            throw sig;
        }
    }
    return last;
}

export function evalForArray(
    i: Interpreter,
    varName: string,
    arrayValue: ArrayValue,
    body: ASTNode[],
    env: Environment,
    line: number,
): RuntimeValue {
    let last: RuntimeValue = makeInt(0);
    const parent = env;

    for (const elem of arrayValue.elements) {
        const childEnv = new Environment(parent);
        const wrapper = wrapElement(elem, arrayValue.elementType);
        childEnv.declare(varName, arrayValue.elementType, wrapper, line, false, true);
        try {
            last = evalBlock(i, body, childEnv);
        } catch (sig) {
            if (sig instanceof BreakSignal) break;
            if (sig instanceof ContinueSignal) continue;
            throw sig;
        }
    }
    return last;
}

export function evalBlock(i: Interpreter, body: ASTNode[], env: Environment): RuntimeValue {
    let last: RuntimeValue = makeInt(0);
    for (const statement of body) {
        last = i.evalNode(statement, env);
    }
    return last;
}

export function evalWait(i: Interpreter, node: WaitNode, env: Environment): RuntimeValue {
    const msVal = asScalar(i.evalNode(node.ms, env), "wait parameter").value as number;
    const end = Date.now() + msVal;
    while (Date.now() < end) {
        // block sync
    }
    return makeInt(0);
}

export function evalTerminalCommand(i: Interpreter, node: TerminalCommandNode, env: Environment): RuntimeValue {
    switch (node.command) {
        case "clear": i.output("\x1b[2J\x1b[H"); break;
        case "exit": throw new HaltFatalSignal("exit");
        case "run":
            // PENDING IMPLEMENTATION
            break;
        case "raw": i.output("[__SYS_RAW__]"); break;
        case "normal": i.output("[__SYS_NORMAL__]"); break;
        case "cursor_on": i.output("\x1b[?25h"); break;
        case "cursor_off": i.output("\x1b[?25l"); break;
        case "move": {
            const xArg = i.evalNode(node.args[0]!, env);
            const yArg = i.evalNode(node.args[1]!, env);
            const x = asScalar(xArg, ".terminal !move x parameter").value as number;
            const y = asScalar(yArg, ".terminal !move y parameter").value as number;
            i.output(`\x1b[${y};${x}H`);
            break;
        }
        case "write": {
            const expr = i.evalNode(node.args[0]!, env);
            i.output(displayValue(expr));
            break;
        }
    }
    return makeStr("");
}

export function evalHalt(i: Interpreter, node: HaltNode, env: Environment): RuntimeValue {
    const msgVal = i.evalNode(node.message, env);
    const msg = displayValue(msgVal);
    // Usuwamy i.output(`halt.${node.level}: ${msg}`);
    if (node.level === "alert") {
        return makeStr("");
    }
    if (node.level === "error") {
        i.output(`XCX Error: ${msg}`);
        throw new HaltErrorSignal();
    }
    // fatal
    i.output(`XCX Fatal: ${msg}`);
    throw new HaltFatalSignal(msg);
}
