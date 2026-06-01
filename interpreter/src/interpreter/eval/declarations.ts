import type { Interpreter } from "../interpreter";
import { Environment } from "../environment";
import {
    VarDeclarationNode,
    ConstDeclarationNode,
    VarAssignNode,
    ArrayDeclarationNode,
    TableDeclarationNode,
    MapDeclarationNode,
    SetDeclarationNode
} from "../../parser/ast";
import {
    RuntimeValue,
    ArrayValue,
    makeInt,
    makeArray,
    makeTable,
    makeMap,
    makeSet,
    asScalar,
    asSet,
    DEFAULT_VALUES,
    makeStr
} from "../values";
import { RuntimeError } from "../../errors/errors";
import { validateDomain } from "./expressions";

export function evalVarDeclaration(i: Interpreter, node: VarDeclarationNode, env: Environment): RuntimeValue {
    const value = node.value !== null
        ? i.evalNode(node.value, env)
        : (DEFAULT_VALUES[node.varType as keyof typeof DEFAULT_VALUES] ?? makeStr(""));

    if (node.varType === "date" || node.varType === "table" || node.varType === "map" || node.varType === "set" || node.varType === "array" || node.varType === "json") {
        if (value.kind !== node.varType) {
            throw new RuntimeError(`Type mismatch: declared '${node.varType}' but got '${value.kind}'`, node.line);
        }
        env.declare(node.name, node.varType, value, node.line, false);
        return value;
    }

    const sv = asScalar(value, `VarDeclaration '${node.name}'`);
    env.declare(node.name, node.varType, sv, node.line, false);
    return sv;
}

export function evalConstDeclaration(i: Interpreter, node: ConstDeclarationNode, env: Environment): RuntimeValue {
    const value = i.evalNode(node.value, env);
    if (node.varType === "date") {
        if (value.kind !== "date") {
            throw new RuntimeError(`Type mismatch: declared 'date' but got '${value.kind}'`, node.line);
        }
        env.declare(node.name, node.varType, value, node.line, true);
        return value;
    }
    const sv = asScalar(value, `ConstDeclaration '${node.name}'`);
    env.declare(node.name, node.varType, sv, node.line, true);
    return sv;
}

export function evalVarAssign(i: Interpreter, node: VarAssignNode, env: Environment): RuntimeValue {
    const value = i.evalNode(node.value, env);
    if (value.kind === "date" || value.kind === "table" || value.kind === "map" || value.kind === "set" || value.kind === "array" || value.kind === "json") {
        env.assign(node.name, value, node.line);
        return value;
    }
    const sv = asScalar(value, `VarAssign '${node.name}'`);
    env.assign(node.name, sv, node.line);
    return sv;
}

export function evalArrayDeclaration(i: Interpreter, node: ArrayDeclarationNode, env: Environment): RuntimeValue {
    if (node.value !== null && node.value !== undefined) {
        const val = i.evalNode(node.value!, env);
        if (val.kind !== "array") {
            throw new RuntimeError(`Expected array value, got '${val.kind}'`, node.line);
        }
        const arrVal = val as ArrayValue;
        if (arrVal.elementType !== node.elementType) {
            throw new RuntimeError(`Array element type mismatch: expected '${node.elementType}' but got '${arrVal.elementType}'`, node.line);
        }
        env.declareArray(node.name, node.elementType, arrVal, node.line);
        return arrVal;
    }
    const elements: (number | string | boolean)[] = [];
    for (const elemNode of node.elements) {
        const val = asScalar(i.evalNode(elemNode!, env), `Array '${node.name}' element`);
        if (val.type !== node.elementType) {
            throw new RuntimeError(
                `Array '${node.name}' element type mismatch: expected '${node.elementType}' but got '${val.type}'`,
                node.line,
            );
        }
        elements.push(val.value);
    }
    const arr = makeArray(node.elementType, elements);
    env.declareArray(node.name, node.elementType, arr, node.line);
    return arr;
}

export function evalTableDeclaration(i: Interpreter, node: TableDeclarationNode, env: Environment): RuntimeValue {
    const columns = node.columns;
    const nonAutoCols = columns.filter(c => !c.isAuto);
    const rows: RuntimeValue[][] = [];
    let nextAuto = 0;

    for (const r of node.rows) {
        if (r.length !== nonAutoCols.length) {
            throw new RuntimeError(`Row length mismatch for table '${node.name}' - expected ${nonAutoCols.length} elements (ignoring @auto columns), got ${r.length}`, node.line);
        }
        const evaledRow: RuntimeValue[] = [];
        let inputIdx = 0;
        for (let index = 0; index < columns.length; index++) {
            const col = columns[index]!;
            if (col.isAuto) {
                evaledRow.push(makeInt(nextAuto++));
            } else {
                const rowNode = r[inputIdx++];
                if (rowNode === undefined) {
                    throw new RuntimeError(`Missing value for column '${col.name}' in table '${node.name}'`, node.line);
                }
                const v = i.evalNode(rowNode, env);
                if (v.kind === "date") {
                    if (col.type !== "date") throw new RuntimeError(`Table column '${col.name}' type mismatch: expected ${col.type}, got ${v.kind}`, node.line);
                } else if (v.kind === "scalar") {
                    if (v.type !== col.type) throw new RuntimeError(`Table column '${col.name}' type mismatch: expected ${col.type}, got ${v.type}`, node.line);
                } else {
                    throw new RuntimeError(`Table column '${col.name}' cannot be complex collection`, node.line);
                }
                evaledRow.push(v);
            }
        }
        rows.push(evaledRow);
    }
    const tableVal = makeTable(columns, rows, nextAuto, node.name);
    env.declareTable(node.name, tableVal, node.line);
    return makeInt(0);
}

export function evalSetDeclaration(i: Interpreter, node: SetDeclarationNode, env: Environment): RuntimeValue {
    if (node.value !== null) {
        const rv = i.evalNode(node.value, env);
        const sv = asSet(rv, `set '${node.name}'`);
        env.declareSet(node.name, node.domain, sv, node.line);
        return sv;
    }

    const elements: Set<number | string | boolean> = new Set();

    for (const item of node.init) {
        if (item.kind === "value") {
            const v = asScalar(i.evalNode(item.node, env), `set '${node.name}'`);
            validateDomain(v.value, node.domain, node.line);
            elements.add(v.value);
        } else {
            const from = asScalar(i.evalNode(item.from, env), "set range from");
            const to = asScalar(i.evalNode(item.to, env), "set range to");
            const stepVal = item.step ? asScalar(i.evalNode(item.step, env), "set range step").value as number : 1;

            if (node.domain === "C") {
                const fromCode = (from.value as string).charCodeAt(0);
                const toCode = (to.value as string).charCodeAt(0);
                const s = stepVal > 0 ? 1 : -1;
                for (let c = fromCode; s > 0 ? c <= toCode : c >= toCode; c += s * Math.abs(stepVal)) {
                    elements.add(String.fromCharCode(c));
                }
            } else {
                const start = from.value as number;
                const end = to.value as number;
                const step = stepVal > 0 ? stepVal : 1;
                const cond = step > 0 ? (index: number) => index <= end : (index: number) => index >= end;
                for (let index = start; cond(index); index += step) {
                    const elem = (node.domain === "Q") ? index : Math.round(index);
                    validateDomain(elem, node.domain, node.line);
                    elements.add(elem);
                }
            }
        }
    }

    const sv = makeSet(node.domain, elements);
    env.declareSet(node.name, node.domain, sv, node.line);
    return sv;
}

export function evalMapDeclaration(i: Interpreter, node: MapDeclarationNode, env: Environment): RuntimeValue {
    const elements: Map<number | string | boolean, number | string | boolean> = new Map();
    for (const entry of node.entries) {
        const keyRv = asScalar(i.evalNode(entry.key, env), `map key`);
        const valRv = asScalar(i.evalNode(entry.value, env), `map value`);
        if (keyRv.type !== node.keyType) throw new RuntimeError(`Map key type mismatch. Expected ${node.keyType} got ${keyRv.type}`, node.line);
        if (valRv.type !== node.valueType) throw new RuntimeError(`Map value type mismatch. Expected ${node.valueType} got ${valRv.type}`, node.line);
        elements.set(keyRv.value, valRv.value);
    }
    const mv = makeMap(node.keyType, node.valueType, elements);
    env.declareMap(node.name, mv, node.line);
    return makeInt(0);
}