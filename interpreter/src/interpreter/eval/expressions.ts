import type { Interpreter } from "../interpreter";
import { Environment } from "../environment";
import {
    ASTNode,
    BinaryExprNode,
    UnaryExprNode,
    LiteralNode,
    DateConstructorNode,
    DatePropertyNode,
    DateFormatNode,
    PerfNode,
    RandomIntNode,
    RandomFloatNode,
    RandomChoiceNode,
    StringPropertyNode,
    StringMethodCallNode,
    InputKeyNode,
    InputReadyNode,
    JsonLiteralNode,
    JsonParseNode,
    PropertyAccessNode,
    GenericMethodCallNode,
    XcxType
} from "../../parser/ast";
import {
    RuntimeValue,
    ScalarValue,
    DateValue,
    makeBool,
    makeInt,
    makeFloat,
    makeStr,
    makeDate,
    makeJson,
    asScalar,
    displayValue,
    parseDate,
    formatDate
} from "../values";
import { RuntimeError } from "../../errors/errors";

export const perfStart = typeof performance !== 'undefined' ? performance.now() : Date.now();

export function evalPerfNode(_i: Interpreter, node: PerfNode, _env: Environment): RuntimeValue {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const elapsed = now - perfStart;
    switch (node.method) {
        case "ms": return makeInt(Math.trunc(elapsed));
        case "us": return makeInt(Math.trunc(elapsed * 1_000));
        case "ns": return makeInt(Math.trunc(elapsed * 1_000_000));
    }
}

export function isTruthy(_i: Interpreter, val: RuntimeValue, line: number): boolean {
    const sv = asScalar(val, "condition");
    if (sv.type !== "bool")
        throw new RuntimeError(`Condition must be bool, got '${sv.type}'`, line);
    return sv.value as boolean;
}

export function assertNumeric(val: ScalarValue, op: string, line: number): void {
    if (val.type !== "int" && val.type !== "float")
        throw new RuntimeError(`Operator '${op}' requires numeric type, got '${val.type}'`, line);
}

export function assertBool(val: ScalarValue, op: string, line: number): void {
    if (val.type !== "bool")
        throw new RuntimeError(`Operator '${op}' requires bool, got '${val.type}'`, line);
}

export function wrapElement(elem: number | string | boolean, type: XcxType): ScalarValue {
    if (type === "int") return makeInt(Number(elem));
    if (type === "float") return makeFloat(Number(elem));
    if (type === "str") return makeStr(String(elem));
    if (type === "bool") return makeBool(Boolean(elem));
    throw new RuntimeError(`Unsupported wrapping type '${type}'`, 0);
}

export function domainTypeOf(domain: string): XcxType {
    switch (domain) {
        case "N":
        case "Z": return "int";
        case "Q": return "float";
        case "S": return "str";
        case "B": return "bool";
        case "C": return "date";
        default: throw new RuntimeError(`Unknown domain '${domain}'`, 0);
    }
}

export function validateDomain(val: number | string | boolean, domain: string, line: number): void {
    if (domain === "N" && (typeof val !== "number" || val < 0 || !Number.isInteger(val))) {
        throw new RuntimeError(`Domain check failed: value must be natural number, got '${val}'`, line);
    }
    if (domain === "Z" && (typeof val !== "number" || !Number.isInteger(val))) {
        throw new RuntimeError(`Domain check failed: value must be integer, got '${val}'`, line);
    }
    if (domain === "Q" && typeof val !== "number") {
        throw new RuntimeError(`Domain check failed: value must be float, got '${val}'`, line);
    }
    if (domain === "S" && typeof val !== "string") {
        throw new RuntimeError(`Domain check failed: value must be string, got '${val}'`, line);
    }
    if (domain === "B" && typeof val !== "boolean") {
        throw new RuntimeError(`Domain check failed: value must be boolean, got '${val}'`, line);
    }
}

export function evalUnaryExpr(i: Interpreter, node: UnaryExprNode, env: Environment): RuntimeValue {
    const operand = asScalar(i.evalNode(node.operand, env), `unary '${node.operator}'`);
    switch (node.operator) {
        case "-":
            if (operand.type !== "int" && operand.type !== "float")
                throw new RuntimeError(`Operator '-' requires numeric type, got '${operand.type}'`, node.line);
            return operand.type === "int" ? makeInt(-(operand.value as number)) : makeFloat(-(operand.value as number));
        case "!":
        case "!!":
            if (operand.type !== "bool")
                throw new RuntimeError(`Operator '${node.operator}' requires bool, got '${operand.type}'`, node.line);
            return makeBool(!operand.value);
        default:
            throw new RuntimeError(`Unknown unary operator '${node.operator}'`, node.line);
    }
}

function flattenPlus(node: ASTNode): ASTNode[] {
    if (node.kind === "BinaryExpr" && (node as BinaryExprNode).operator === "+") {
        const bin = node as BinaryExprNode;
        return [...flattenPlus(bin.left), ...flattenPlus(bin.right)];
    }
    return [node];
}

export function evalBinaryExpr(i: Interpreter, node: BinaryExprNode, env: Environment): RuntimeValue {
    const op = node.operator;
    const line = node.line;

    if (op === "+") {
        const operands = flattenPlus(node);
        const vals = operands.map((o: ASTNode) => i.evalNode(o, env));
        const hasString = vals.some((v: RuntimeValue) => v.kind === "scalar" && v.type === "str");

        if (hasString) {
            let str = "";
            let currentSum: number | null = null;
            for (const v of vals) {
                if (v.kind === "scalar" && (v.type === "int" || v.type === "float")) {
                    currentSum = (currentSum || 0) + (v.value as number);
                } else {
                    if (currentSum !== null) {
                        str += String(currentSum);
                        currentSum = null;
                    }
                    str += displayValue(v);
                }
            }
            if (currentSum !== null) str += String(currentSum);
            return makeStr(str);
        } else {
            let acc = vals[0]!;
            for (let idx = 1; idx < vals.length; idx++) {
                const r = vals[idx]!;
                if (acc.kind === "date" || r.kind === "date") {
                    acc = evalDateBinaryOp(i, acc, r, "+", line);
                } else {
                    const lsc = asScalar(acc, "binary '+' left");
                    const rsc = asScalar(r, "binary '+' right");
                    assertNumeric(lsc, "+", line);
                    assertNumeric(rsc, "+", line);
                    const isFloat = lsc.type === "float" || rsc.type === "float";
                    acc = isFloat ? makeFloat((lsc.value as number) + (rsc.value as number)) : makeInt((lsc.value as number) + (rsc.value as number));
                }
            }
            return acc;
        }
    }

    const leftRaw = i.evalNode(node.left, env);

    if (op === "&&" || op === "AND") {
        const left = asScalar(leftRaw, `binary '${op}' left`);
        assertBool(left, op, line);
        if (!(left.value as boolean)) return makeBool(false);
        const rightRaw = i.evalNode(node.right, env);
        const right = asScalar(rightRaw, `binary '${op}' right`);
        assertBool(right, op, line);
        return makeBool(right.value as boolean);
    }

    if (op === "||" || op === "OR") {
        const left = asScalar(leftRaw, `binary '${op}' left`);
        assertBool(left, op, line);
        if (left.value as boolean) return makeBool(true);
        const rightRaw = i.evalNode(node.right, env);
        const right = asScalar(rightRaw, `binary '${op}' right`);
        assertBool(right, op, line);
        return makeBool(right.value as boolean);
    }

    const rightRaw = i.evalNode(node.right, env);

    if (leftRaw.kind === "date" || rightRaw.kind === "date") {
        return evalDateBinaryOp(i, leftRaw, rightRaw, op, line);
    }

    const left = asScalar(leftRaw, `binary '${op}' left`);
    const right = asScalar(rightRaw, `binary '${op}' right`);

    if (op === "HAS") {
        if (left.type !== "str" || right.type !== "str")
            throw new RuntimeError(`'HAS' requires two strings`, line);
        return makeBool(String(left.value).includes(String(right.value)));
    }

    if (op === "++") {
        return makeStr(displayValue(leftRaw) + displayValue(rightRaw));
    }

    if (op === "==") return makeBool(left.value === right.value);
    if (op === "!=") return makeBool(left.value !== right.value);

    if (op === "<" || op === ">" || op === "<=" || op === ">=") {
        assertNumeric(left, op, line);
        assertNumeric(right, op, line);
        const l = left.value as number, r = right.value as number;
        if (op === "<") return makeBool(l < r);
        if (op === ">") return makeBool(l > r);
        if (op === "<=") return makeBool(l <= r);
        if (op === ">=") return makeBool(l >= r);
    }

    if (op === "-" || op === "*" || op === "/" || op === "%" || op === "^") {
        assertNumeric(left, op, line);
        assertNumeric(right, op, line);
        const l = left.value as number, r = right.value as number;
        const isFloat = left.type === "float" || right.type === "float";
        const wrap = isFloat ? makeFloat : makeInt;
        switch (op) {
            case "-": return wrap(l - r);
            case "*": return wrap(l * r);
            case "/": if (r === 0) throw new RuntimeError("Division by zero", line); return wrap(l / r);
            case "%": if (r === 0) throw new RuntimeError("Modulo by zero", line); return wrap(l % r);
            case "^": return isFloat ? makeFloat(Math.pow(l, r)) : makeInt(Math.pow(l, r));
        }
    }

    throw new RuntimeError(`Unknown operator '${op}'`, line);
}

export function evalDateBinaryOp(
    _i: Interpreter,
    leftRaw: RuntimeValue,
    rightRaw: RuntimeValue,
    op: string,
    line: number,
): RuntimeValue {
    if (leftRaw.kind === "date" && rightRaw.kind === "scalar" && rightRaw.type === "int") {
        const d = (leftRaw as DateValue).date;
        const days = rightRaw.value as number;
        const newD = new Date(d.getTime());
        if (op === "+") {
            newD.setDate(newD.getDate() + days);
            return makeDate(newD);
        }
        if (op === "-") {
            newD.setDate(newD.getDate() - days);
            return makeDate(newD);
        }
        throw new RuntimeError(`Operator '${op}' not supported on date and int`, line);
    }

    if (leftRaw.kind !== "date" || rightRaw.kind !== "date") {
        throw new RuntimeError(`Date operator '${op}' requires two dates, or date and integer`, line);
    }
    const l = leftRaw as DateValue;
    const r = rightRaw as DateValue;

    const msL = l.date.getTime();
    const msR = r.date.getTime();

    if (op === "==") return makeBool(msL === msR);
    if (op === "!=") return makeBool(msL !== msR);
    if (op === "<") return makeBool(msL < msR);
    if (op === ">") return makeBool(msL > msR);
    if (op === "<=") return makeBool(msL <= msR);
    if (op === ">=") return makeBool(msL >= msR);

    if (op === "+") {
        throw new RuntimeError(`Date addition must have integer on RHS`, line);
    }
    if (op === "-") {
        const diffMs = msL - msR;
        const diffDays = Math.trunc(diffMs / (1000 * 60 * 60 * 24));
        return makeInt(diffDays);
    }

    throw new RuntimeError(`Operator '${op}' not supported on dates`, line);
}

export function evalLiteral(node: LiteralNode): RuntimeValue {
    if (node.literalType === "int") return makeInt(node.value as number);
    if (node.literalType === "float") return makeFloat(node.value as number);
    if (node.literalType === "str") return makeStr(node.value as string);
    if (node.literalType === "bool") return makeBool(node.value as boolean);
    throw new RuntimeError(`Unknown literal type: ${node.literalType}`, node.line);
}

export function evalDateConstructor(i: Interpreter, node: DateConstructorNode, env: Environment): RuntimeValue {
    const dStrVal = asScalar(i.evalNode(node.dateStr, env), "date parameter").value as string;
    let fmt: string | undefined = undefined;
    if (node.format) {
        fmt = asScalar(i.evalNode(node.format, env), "date format parameter").value as string;
    }

    let parsed: Date;
    try {
        parsed = parseDate(dStrVal, fmt || "YYYY-MM-DD");
    } catch (_e) {
        parsed = new Date(dStrVal);
    }

    if (isNaN(parsed.getTime())) {
        throw new RuntimeError(`Invalid date format for: '${dStrVal}'`, node.line);
    }
    return makeDate(parsed);
}

export function evalDateProperty(i: Interpreter, node: DatePropertyNode, env: Environment): RuntimeValue {
    const obj = i.evalNode(node.object, env);
    if (obj.kind !== "date") {
        throw new RuntimeError(`Property access '${node.property}' can only be used on date objects`, node.line);
    }
    const dt = (obj as DateValue).date;
    switch (node.property) {
        case "year": return makeInt(dt.getFullYear());
        case "month": return makeInt(dt.getMonth() + 1);
        case "day": return makeInt(dt.getDate());
        case "hour": return makeInt(dt.getHours());
        case "minute": return makeInt(dt.getMinutes());
        case "second": return makeInt(dt.getSeconds());
        case "timestamp": return makeInt(Math.floor(dt.getTime() / 1000));
        default:
            throw new RuntimeError(`Unknown date property '${node.property}'`, node.line);
    }
}

export function evalDateFormat(i: Interpreter, node: DateFormatNode, env: Environment): RuntimeValue {
    const obj = i.evalNode(node.object, env);
    if (obj.kind !== "date")
        throw new RuntimeError(`Date method 'format' must be called on date values`, node.line);

    const dt = (obj as DateValue).date;
    let fmt = "YYYY-MM-DD";
    if (node.formatStr) {
        fmt = asScalar(i.evalNode(node.formatStr, env), "date format string").value as string;
    }

    return makeStr(formatDate(dt, fmt));
}

export function evalRandomInt(i: Interpreter, node: RandomIntNode, env: Environment): RuntimeValue {
    const minVal = asScalar(i.evalNode(node.min, env), "random.int min range").value as number;
    const maxVal = asScalar(i.evalNode(node.max, env), "random.int max range").value as number;
    let step = 1;
    if (node.step) {
        step = asScalar(i.evalNode(node.step, env), "random.int step").value as number;
    }

    if (step <= 0) {
        throw new RuntimeError(`random.int step must be positive`, node.line);
    }

    const count = Math.floor((maxVal - minVal) / step) + 1;
    if (count <= 0) return makeInt(minVal);

    const k = Math.floor(Math.random() * count);
    const picked = minVal + k * step;
    return makeInt(picked);
}

export function evalRandomFloat(i: Interpreter, node: RandomFloatNode, env: Environment): RuntimeValue {
    const minVal = asScalar(i.evalNode(node.min, env), "random.float min range").value as number;
    const maxVal = asScalar(i.evalNode(node.max, env), "random.float max range").value as number;
    let step: number | null = null;
    if (node.step) {
        step = asScalar(i.evalNode(node.step, env), "random.float step").value as number;
    }

    if (step !== null) {
        if (step <= 0) {
            throw new RuntimeError(`random.float step must be positive`, node.line);
        }
        const count = Math.floor((maxVal - minVal) / step) + 1;
        if (count <= 0) return makeFloat(minVal);

        const k = Math.floor(Math.random() * count);
        const picked = minVal + k * step;
        return makeFloat(picked);
    } else {
        const val = minVal + Math.random() * (maxVal - minVal);
        return makeFloat(val);
    }
}

export function evalRandomChoice(_i: Interpreter, node: RandomChoiceNode, env: Environment): RuntimeValue {
    const arrVal = env.get(node.arrayName, node.line);
    if (arrVal.kind !== "array") {
        throw new RuntimeError(`'random.choice from' requires an array variable, got '${arrVal.kind}'`, node.line);
    }
    const elements = arrVal.elements;
    if (elements.length === 0) {
        throw new RuntimeError(`Cannot choice from empty array '${node.arrayName}'`, node.line);
    }
    const picked = elements[Math.floor(Math.random() * elements.length)]!;
    return wrapElement(picked, arrVal.elementType);
}

export function evalStringProperty(i: Interpreter, node: StringPropertyNode, env: Environment): RuntimeValue {
    const obj = asScalar(i.evalNode(node.object, env), "string property access");
    if (obj.type !== "str") {
        throw new RuntimeError(`Property access '${node.property}' only supported on string`, node.line);
    }
    if (node.property === "length") {
        return makeInt(String(obj.value).length);
    }
    throw new RuntimeError(`Unknown string property '${node.property}'`, node.line);
}

export function evalStringMethodCall(i: Interpreter, node: StringMethodCallNode, env: Environment): RuntimeValue {
    const obj = asScalar(i.evalNode(node.object, env), "string method call");
    if (obj.type !== "str") {
        throw new RuntimeError(`String method '${node.method}' must be called on string`, node.line);
    }
    const value = String(obj.value);

    const expectArgCount = (expected: number) => {
        if (node.args.length !== expected) {
            throw new RuntimeError(`Method '${node.method}' expects ${expected} arguments, got ${node.args.length}`, node.line);
        }
    };

    switch (node.method) {
        case "upper":
            expectArgCount(0);
            return makeStr(value.toUpperCase());
        case "lower":
            expectArgCount(0);
            return makeStr(value.toLowerCase());
        case "trim":
            expectArgCount(0);
            return makeStr(value.trim());
        case "indexOf": {
            expectArgCount(1);
            const search = asScalar(i.evalNode(node.args[0]!, env), "search substring").value as string;
            return makeInt(value.indexOf(search));
        }
        case "lastIndexOf": {
            expectArgCount(1);
            const search = asScalar(i.evalNode(node.args[0]!, env), "search substring").value as string;
            return makeInt(value.lastIndexOf(search));
        }
        case "startsWith": {
            expectArgCount(1);
            const prefix = asScalar(i.evalNode(node.args[0]!, env), "prefix").value as string;
            return makeBool(value.startsWith(prefix));
        }
        case "endsWith": {
            expectArgCount(1);
            const suffix = asScalar(i.evalNode(node.args[0]!, env), "suffix").value as string;
            return makeBool(value.endsWith(suffix));
        }
        case "toInt": {
            expectArgCount(0);
            const isNum = /^[+-]?\d+$/.test(value.trim());
            if (!isNum) throw new RuntimeError(`Cannot convert non-integer string '${value}' to int`, node.line);
            return makeInt(parseInt(value.trim(), 10));
        }
        case "toFloat": {
            expectArgCount(0);
            const parsedF = parseFloat(value.trim());
            if (isNaN(parsedF)) throw new RuntimeError(`Cannot convert string '${value}' to float`, node.line);
            return makeFloat(parsedF);
        }
        case "replace": {
            expectArgCount(2);
            const oldVal = asScalar(i.evalNode(node.args[0]!, env), "old value").value as string;
            const newVal = asScalar(i.evalNode(node.args[1]!, env), "new value").value as string;
            return makeStr(value.replace(oldVal, newVal));
        }
        case "slice": {
            if (node.args.length !== 1 && node.args.length !== 2) {
                throw new RuntimeError(`Method 'slice' expects 1 or 2 arguments, got ${node.args.length}`, node.line);
            }
            const start = asScalar(i.evalNode(node.args[0]!, env), "start index").value as number;
            if (node.args.length === 2) {
                const end = asScalar(i.evalNode(node.args[1]!, env), "end index").value as number;
                return makeStr(value.slice(start, end));
            }
            return makeStr(value.slice(start));
        }
        default:
            throw new RuntimeError(`Unknown string method '${node.method}'`, node.line);
    }
}

export function evalPropertyAccess(i: Interpreter, node: PropertyAccessNode, env: Environment): RuntimeValue {
    const obj = i.evalNode(node.object, env);
    if (obj.kind === "namespace") {
        const val = obj.exports.get(node.property);
        if (!val) throw new RuntimeError(`Namespace has no member '${node.property}'`, node.line);
        return val;
    }
    if (obj.kind === "json") {
        const rawObj = (obj as any).value;
        const value = rawObj[node.property];
        if (value === undefined) return makeJson(null);
        return makeJson(value);
    }
    if (obj.kind === "row") {
        const idx = obj.columns.findIndex(c => c.name === node.property);
        if (idx === -1) throw new RuntimeError(`Row has no column '${node.property}'`, node.line);
        return obj.values[idx]!;
    }
    throw new RuntimeError(`Property access '.${node.property}' not supported on ${obj.kind}`, node.line);
}

export function evalGenericMethodCall(i: Interpreter, node: GenericMethodCallNode, env: Environment): RuntimeValue {
    const obj = i.evalNode(node.object, env);
    if (obj.kind === "namespace") {
        return i.evalNamespaceMethodCall(node, obj, env);
    }
    if (obj.kind === "table") {
        return i.evalTableMethodCall(node, obj, env);
    }
    if (obj.kind === "json") {
        return i.evalJsonMethodCall(node, obj, env);
    }
    if (obj.kind === "array") {
        return i.evalArrayMethodCall(node as any, env);
    }
    if (obj.kind === "set") {
        return i.evalSetMethodCall(node as any, env);
    }
    if (obj.kind === "map") {
        return i.evalMapMethodCall(node as any, env);
    }
    throw new RuntimeError(`Method '${node.method}' not supported on object kind '${obj.kind}'`, node.line);
}

export function evalInputKey(i: Interpreter, node: InputKeyNode, _env: Environment): RuntimeValue {
    if (node.wait) {
        const line = i.readLine();
        if (line.length > 0) {
            return makeStr(line[0]!);
        }
        return makeStr("");
    } else {
        return makeStr("");
    }
}

export function evalInputReady(_i: Interpreter, _node: InputReadyNode, _env: Environment): RuntimeValue {
    return makeBool(false);
}

export function evalJsonLiteral(_i: Interpreter, node: JsonLiteralNode, _env: Environment): RuntimeValue {
    try {
        const parsed = JSON.parse(node.value || "{}");
        return makeJson(parsed);
    } catch (e: any) {
        throw new RuntimeError(`R305: Panic on Invalid JSON: ${e.message}`, node.line);
    }
}

export function evalJsonParse(i: Interpreter, node: JsonParseNode, env: Environment): RuntimeValue {
    const rawMatch = i.evalNode(node.expr, env);
    const strVal = asScalar(rawMatch, "json.parse() argument").value;
    try {
        return makeJson(JSON.parse(String(strVal)));
    } catch (e: any) {
        throw new RuntimeError(`R305: Panic on Invalid JSON: ${e.message}`, node.line);
    }
}