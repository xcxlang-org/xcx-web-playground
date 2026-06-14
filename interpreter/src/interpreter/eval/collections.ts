import type { Interpreter } from "../interpreter";
import { Environment } from "../environment";
import {
    GenericMethodCallNode,
    ArrayMethodCallNode,
    SetMethodCallNode,
    MapMethodCallNode,
    ASTNode
} from "../../parser/ast";
import {
    RuntimeValue,
    ScalarValue,
    TableValue,
    JsonValue,
    TableColumn,
    makeInt,
    makeBool,
    makeStr,
    makeFloat,
    makeRow,
    makeTable,
    makeArray,
    asScalar,
    asTable,
    asSet,
    asMap,
    displayValue,
    makeJson
} from "../values";
import { RuntimeError } from "../../errors/errors";
import { wrapElement, validateDomain } from "./expressions";
import {
    getNestedJsonPath,
    runtimeValueToJson
} from "../interpreter";

export function evalArrayMethodCall(i: Interpreter, node: ArrayMethodCallNode, env: Environment): RuntimeValue {
    const rawNode = node as any;
    const arrayName = rawNode.arrayName || (rawNode.object && rawNode.object.kind === "Identifier" ? rawNode.object.name : "array");
    const arr = env.getArray(arrayName, node.line);
    const line = node.line;

    const expectArgCount = (n: number) => {
        if (node.args.length !== n)
            throw new RuntimeError(`Array method '${node.method}' expects ${n} argument(s), got ${node.args.length}`, line);
    };
    const evalArg = (argIdx: number): ScalarValue =>
        asScalar(i.evalNode(node.args[argIdx]!, env), `${arrayName}.${node.method} arg ${argIdx}`);
    const checkIndex = (idx: number) => {
        if (idx < 0 || idx >= arr.elements.length)
            throw new RuntimeError(`halt.error: Array '${arrayName}' index ${idx} out of bounds (size ${arr.elements.length})`, line);
    };
    const checkElementType = (val: ScalarValue) => {
        if (val.type !== arr.elementType)
            throw new RuntimeError(`Array '${arrayName}' element type mismatch: expected '${arr.elementType}' but got '${val.type}'`, line);
    };

    switch (node.method) {
        case "size": { expectArgCount(0); return makeInt(arr.elements.length); }
        case "get": {
            expectArgCount(1);
            const idx = evalArg(0);
            if (idx.type !== "int") throw new RuntimeError(`'get' index must be int`, line);
            checkIndex(idx.value as number);
            return wrapElement(arr.elements[idx.value as number]!, arr.elementType);
        }
        case "push": {
            expectArgCount(1);
            const val = evalArg(0);
            checkElementType(val);
            arr.elements.push(val.value);
            return makeBool(true);
        }
        case "pop": {
            expectArgCount(0);
            if (arr.elements.length === 0)
                throw new RuntimeError(`halt.error: Array '${node.arrayName}' is empty, cannot pop`, line);
            return wrapElement(arr.elements.pop()!, arr.elementType);
        }
        case "insert": {
            expectArgCount(2);
            const idxVal = evalArg(0);
            if (idxVal.type !== "int") throw new RuntimeError(`'insert' index must be int`, line);
            const idx = idxVal.value as number;
            if (idx < 0 || idx > arr.elements.length)
                throw new RuntimeError(`halt.error: Array '${node.arrayName}' insert index ${idx} out of bounds (size ${arr.elements.length})`, line);
            const elemVal = evalArg(1);
            checkElementType(elemVal);
            arr.elements.splice(idx, 0, elemVal.value);
            return makeBool(true);
        }
        case "set":
        case "update": {
            expectArgCount(2);
            const idxVal = evalArg(0);
            if (idxVal.type !== "int") throw new RuntimeError(`'update' index must be int`, line);
            checkIndex(idxVal.value as number);
            const elemVal = evalArg(1);
            checkElementType(elemVal);
            arr.elements[idxVal.value as number] = elemVal.value;
            return makeBool(true);
        }
        case "delete": {
            expectArgCount(1);
            const idxVal = evalArg(0);
            if (idxVal.type !== "int") throw new RuntimeError(`'delete' index must be int`, line);
            checkIndex(idxVal.value as number);
            arr.elements.splice(idxVal.value as number, 1);
            return makeBool(true);
        }
        case "find": {
            expectArgCount(1);
            const val = evalArg(0);
            checkElementType(val);
            return makeInt(arr.elements.indexOf(val.value));
        }
        case "contains": {
            expectArgCount(1);
            const val = evalArg(0);
            checkElementType(val);
            return makeBool(arr.elements.includes(val.value));
        }
        case "isEmpty": {
            expectArgCount(0);
            return makeBool(arr.elements.length === 0);
        }
        case "clear": {
            expectArgCount(0);
            arr.elements = [];
            return makeBool(true);
        }
        case "sort": {
            expectArgCount(0);
            if (arr.elementType === "int" || arr.elementType === "float") {
                arr.elements.sort((a, b) => (a as number) - (b as number));
            } else {
                arr.elements.sort();
            }
            return makeBool(true);
        }
        case "reverse": {
            expectArgCount(0);
            arr.elements.reverse();
            return makeBool(true);
        }
        case "show": {
            expectArgCount(0);
            i.output(`[${arr.elements.join(", ")}]`);
            return makeBool(true);
        }
        default:
            throw new RuntimeError(`Unknown array method '${node.method}'`, line);
    }
}

export function evalSetMethodCall(i: Interpreter, node: SetMethodCallNode, env: Environment): RuntimeValue {
    const rv = i.evalNode(node.object, env);
    const sv = asSet(rv, `set method '${node.method}'`);
    const args = node.args.map((a, idx) => asScalar(i.evalNode(a, env), `set method '${node.method}' arg ${idx}`));

    switch (node.method) {
        case "size": return makeInt(sv.elements.size);
        case "isEmpty": return makeBool(sv.elements.size === 0);
        case "contains": {
            if (args.length !== 1) throw new RuntimeError(`'contains' expects 1 argument`, node.line);
            return makeBool(sv.elements.has(args[0]!.value));
        }
        case "add": {
            if (args.length !== 1) throw new RuntimeError(`'add' expects 1 argument`, node.line);
            validateDomain(args[0]!.value, sv.domain, node.line);
            sv.elements.add(args[0]!.value);
            return makeBool(true);
        }
        case "remove": {
            if (args.length !== 1) throw new RuntimeError(`'remove' expects 1 argument`, node.line);
            sv.elements.delete(args[0]!.value);
            return makeBool(true);
        }
        case "clear": {
            sv.elements.clear();
            return makeBool(true);
        }
        case "show": {
            i.output(`{${Array.from(sv.elements).join(", ")}}`);
            return makeBool(true);
        }
        default:
            throw new RuntimeError(`Unknown set method '${node.method}'`, node.line);
    }
}

export function evalMapMethodCall(i: Interpreter, node: MapMethodCallNode, env: Environment): RuntimeValue {
    const rv = i.evalNode(node.object, env);
    const mv = asMap(rv, `map method '${node.method}'`);
    const args = node.args.map((a: ASTNode, idx: number) => asScalar(i.evalNode(a, env), `map method '${node.method}' arg ${idx}`));

    switch (node.method) {
        case "size": return makeInt(mv.elements.size);
        case "isEmpty": return makeBool(mv.elements.size === 0);
        case "contains": {
            if (args.length !== 1) throw new RuntimeError(`'contains' expects 1 argument`, node.line);
            if (args[0]!.type !== mv.keyType) throw new RuntimeError(`Map contains key type mismatch`, node.line);
            return makeBool(mv.elements.has(args[0]!.value));
        }
        case "get": {
            if (args.length !== 1) throw new RuntimeError(`'get' expects 1 argument`, node.line);
            if (args[0]!.type !== mv.keyType) throw new RuntimeError(`Map get key type mismatch`, node.line);
            const val = mv.elements.get(args[0]!.value);
            if (val === undefined) throw new RuntimeError(`Key not found in map`, node.line);
            return wrapElement(val, mv.valueType);
        }
        case "insert": {
            if (args.length !== 2) throw new RuntimeError(`'insert' expects 2 arguments`, node.line);
            if (args[0]!.type !== mv.keyType) throw new RuntimeError(`Map insert key type mismatch`, node.line);
            if (args[1]!.type !== mv.valueType) throw new RuntimeError(`Map insert value type mismatch`, node.line);
            mv.elements.set(args[0]!.value, args[1]!.value);
            return makeBool(true);
        }
        case "remove": {
            if (args.length !== 1) throw new RuntimeError(`'remove' expects 1 argument`, node.line);
            if (args[0]!.type !== mv.keyType) throw new RuntimeError(`Map remove key type mismatch`, node.line);
            mv.elements.delete(args[0]!.value);
            return makeBool(true);
        }
        case "clear": {
            mv.elements.clear();
            return makeBool(true);
        }
        case "keys": {
            const kList = Array.from(mv.elements.keys());
            return makeArray(mv.keyType, kList);
        }
        case "values": {
            const vList = Array.from(mv.elements.values());
            return makeArray(mv.valueType, vList);
        }
        case "show": {
            const parts = Array.from(mv.elements.entries()).map(([k, v]) => `${k}::${v}`);
            i.output(`[${parts.join(", ")}]`);
            return makeBool(true);
        }
        default:
            throw new RuntimeError(`Unknown map method '${node.method}'`, node.line);
    }
}

export function evalTableMethodCall(i: Interpreter, node: GenericMethodCallNode, tv: TableValue, env: Environment): RuntimeValue {
    const method = node.method;
    const args = node.args;
    switch (method) {
        case "count": return makeInt(tv.rows.length);
        case "get": {
            if (args.length !== 1) throw new RuntimeError("get expects 1 argument", node.line);
            const idx = asScalar(i.evalNode(args[0]!, env), "index").value as number;
            if (typeof idx !== "number" || !Number.isInteger(idx) || idx < 0 || idx >= tv.rows.length) throw new RuntimeError(`Index out of bounds`, node.line);
            return makeRow(tv.columns, tv.rows[idx]!);
        }
        case "add":
        case "insert": {
            const evaledArgs = args.map(a => i.evalNode(a, env));
            const newRow: RuntimeValue[] = [];
            let argIdx = 0;
            for (let index = 0; index < tv.columns.length; index++) {
                const col = tv.columns[index]!;
                if (col.isAuto) {
                    newRow.push(makeInt(tv.nextAuto++));
                } else {
                    if (argIdx >= evaledArgs.length) throw new RuntimeError(`Missing value for column '${col.name}'`, node.line);
                    const v = evaledArgs[argIdx++]!;
                    const vType = v.kind === "scalar" ? v.type : v.kind === "date" ? "date" : null;
                    if (vType === null) throw new RuntimeError(`Column '${col.name}' cannot be complex type`, node.line);
                    if (vType !== col.type) throw new RuntimeError(`Column '${col.name}' type mismatch`, node.line);
                    newRow.push(v);
                }
            }
            if (argIdx !== evaledArgs.length) throw new RuntimeError(`Too many arguments for table insertion`, node.line);
            tv.rows.push(newRow);
            return makeBool(true);
        }
        case "delete": {
            if (args.length !== 1) throw new RuntimeError("delete expects 1 argument", node.line);
            const idx = asScalar(i.evalNode(args[0]!, env), "index").value as number;
            if (typeof idx !== "number" || !Number.isInteger(idx) || idx < 0 || idx >= tv.rows.length) throw new RuntimeError(`Index out of bounds`, node.line);
            tv.rows.splice(idx, 1);
            return makeBool(true);
        }
        case "update": {
            if (args.length !== 2) throw new RuntimeError("update expects index and array of values", node.line);
            const idx = asScalar(i.evalNode(args[0]!, env), "index").value as number;
            if (typeof idx !== "number" || !Number.isInteger(idx) || idx < 0 || idx >= tv.rows.length) throw new RuntimeError(`Index out of bounds`, node.line);

            const arrVal = i.evalNode(args[1]!, env);
            if (arrVal.kind !== "array") throw new RuntimeError("update expects array of values as second argument", node.line);

            const newRow: RuntimeValue[] = [];
            let argIdx = 0;
            for (let index = 0; index < tv.columns.length; index++) {
                const col = tv.columns[index]!;
                if (col.isAuto) {
                    newRow.push(tv.rows[idx]![index]!);
                } else {
                    if (argIdx >= arrVal.elements.length) throw new RuntimeError(`Missing value for column '${col.name}'`, node.line);
                    const rawVal = arrVal.elements[argIdx++]!;
                    let wrapped: RuntimeValue;
                    if (typeof rawVal === "number") wrapped = Number.isInteger(rawVal) ? makeInt(rawVal) : makeFloat(rawVal);
                    else if (typeof rawVal === "boolean") wrapped = makeBool(rawVal);
                    else wrapped = makeStr(rawVal as string);

                    const wType = (wrapped as ScalarValue).type;
                    if (wType !== col.type) throw new RuntimeError(`Column '${col.name}' type mismatch`, node.line);
                    newRow.push(wrapped);
                }
            }
            tv.rows[idx] = newRow;
            return makeBool(true);
        }
        case "where": {
            if (args.length !== 1) throw new RuntimeError("where expects 1 argument", node.line);
            const predNode = args[0]!;

            const resRows: RuntimeValue[][] = [];
            if (predNode.kind === "Lambda") {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const lambda = predNode as any;
                if (lambda.params.length !== 1) throw new RuntimeError("where lambda expects exactly 1 param (the row)", node.line);

                for (const row of tv.rows) {
                    const callEnv = env.child();
                    callEnv.declare(lambda.params[0], "str", makeRow(tv.columns, row), node.line, true, true);
                    const b = asScalar(i.evalNode(lambda.body, callEnv), "where predicate returns bool").value;
                    if (b === true) resRows.push(row);
                }
            } else {
                for (const row of tv.rows) {
                    const callEnv = env.child();
                    for (let index = 0; index < tv.columns.length; index++) {
                        callEnv.declare(tv.columns[index]!.name, tv.columns[index]!.type, row[index]!, node.line, true, true);
                    }
                    const b = asScalar(i.evalNode(predNode, callEnv), "where predicate returns bool").value;
                    if (b === true) resRows.push(row);
                }
            }
            return makeTable(tv.columns, resRows, tv.nextAuto, tv.name);
        }
        case "join": {
            if (args.length !== 2 && args.length !== 3) throw new RuntimeError("join expects 2 arguments for lambda or 3 for key-based", node.line);
            const otherTv = asTable(i.evalNode(args[0]!, env), "other table");

            const resColumns: TableColumn[] = [];
            for (const c of tv.columns) resColumns.push({ name: c.name, type: c.type, isAuto: false });

            const isKeyBased = args.length === 3;
            const joinKey2 = isKeyBased ? asScalar(i.evalNode(args[2]!, env), "join key 2").value as string : null;

            for (const c of otherTv.columns) {
                if (isKeyBased && c.name === joinKey2) continue;
                const collision = tv.columns.some(tc => tc.name === c.name);
                const fName = collision ? `${otherTv.name ?? "joined"}_${c.name}` : c.name;
                resColumns.push({ name: fName, type: c.type, isAuto: false });
            }

            const resRows: RuntimeValue[][] = [];
            if (isKeyBased) {
                const key1 = asScalar(i.evalNode(args[1]!, env), "join key 1").value as string;
                const idx1 = tv.columns.findIndex(c => c.name === key1);
                if (idx1 === -1) throw new RuntimeError(`Column '${key1}' not found in target table`, node.line);
                const idx2 = otherTv.columns.findIndex(c => c.name === joinKey2);
                if (idx2 === -1) throw new RuntimeError(`Column '${joinKey2}' not found in joined table`, node.line);

                for (const r1 of tv.rows) {
                    for (const r2 of otherTv.rows) {
                        const v1 = asScalar(r1[idx1]!, "val1").value;
                        const v2 = asScalar(r2[idx2]!, "val2").value;
                        if (v1 === v2) {
                            const combinedRow = [...r1];
                            for (let index = 0; index < r2.length; index++) {
                                if (index !== idx2) combinedRow.push(r2[index]!);
                            }
                            resRows.push(combinedRow);
                        }
                    }
                }
            } else {
                const predNode = args[1]!;
                if (predNode.kind !== "Lambda") throw new RuntimeError("join expects lambda expr as second arg", node.line);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const lambda = predNode as any;
                if (lambda.params.length !== 2) throw new RuntimeError("join lambda needs exactly 2 params", node.line);

                for (const r1 of tv.rows) {
                    for (const r2 of otherTv.rows) {
                        const callEnv = env.child();
                        callEnv.declare(lambda.params[0], "str", makeRow(tv.columns, r1), node.line, true, true);
                        callEnv.declare(lambda.params[1], "str", makeRow(otherTv.columns, r2), node.line, true, true);
                        const b = asScalar(i.evalNode(lambda.body, callEnv), "join predicate returns bool").value;
                        if (b === true) resRows.push([...r1, ...r2]);
                    }
                }
            }
            return makeTable(resColumns, resRows, 0);
        }
        case "show": {
            const widths = tv.columns.map(c => c.name.length);
            for (const row of tv.rows) {
                for (let index = 0; index < tv.columns.length; index++) {
                    const valStr = displayValue(row[index]!);
                    if (valStr.length > widths[index]!) widths[index] = valStr.length;
                }
            }

            let sep = "+";
            for (const w of widths) sep += "-".repeat(w + 2) + "+";

            i.output(sep);
            let head = "|";
            for (let index = 0; index < tv.columns.length; index++) {
                head += " " + tv.columns[index]!.name.padEnd(widths[index]!) + " |";
            }
            i.output(head);
            i.output(sep);

            for (const row of tv.rows) {
                let line = "|";
                for (let index = 0; index < tv.columns.length; index++) {
                    line += " " + displayValue(row[index]!).padEnd(widths[index]!) + " |";
                }
                i.output(line);
            }
            i.output(sep);
            return makeBool(true);
        }
        case "clear": {
            tv.rows = [];
            return makeBool(true);
        }
        case "size": {
            return makeInt(tv.rows.length);
        }
        case "columns": {
            const names = tv.columns.map(c => c.name);
            return makeArray("str", names);
        }
        case "rows": {
            const rArr = tv.rows.map(row => makeRow(tv.columns, row));
            return makeArray("table", rArr as any);
        }
        case "toJson": {
            const jsonArr: any[] = [];
            for (const row of tv.rows) {
                const obj: any = {};
                for (let index = 0; index < tv.columns.length; index++) {
                    const colName = tv.columns[index]!.name;
                    obj[colName] = runtimeValueToJson(row[index]!);
                }
                jsonArr.push(obj);
            }
            return makeJson(jsonArr);
        }
        default:
            return makeInt(0);
    }
}

export function evalJsonMethodCall(i: Interpreter, node: GenericMethodCallNode, obj: JsonValue, env: Environment): RuntimeValue {
    const args = node.args.map(a => i.evalNode(a, env));

    switch (node.method) {
        case "exists": {
            const rawArg = asScalar(args[0]!, ".exists()");
            const path = String(rawArg.value);
            const res = getNestedJsonPath(obj.value, path);
            return makeBool(res !== null && res.targetItem !== undefined && res.targetItem !== null);
        }
        case "get": {
            const rawArg = asScalar(args[0]!, ".get()");
            const path = String(rawArg.value);
            const res = getNestedJsonPath(obj.value, path);
            if (res && res.targetItem !== undefined) {
                if (typeof res.targetItem === 'object' && res.targetItem !== null) {
                    return makeJson(res.targetItem);
                }
                if (typeof res.targetItem === 'string') return makeStr(res.targetItem);
                if (typeof res.targetItem === 'number') return res.targetItem % 1 === 0 ? makeInt(res.targetItem) : makeFloat(res.targetItem);
                if (typeof res.targetItem === 'boolean') return makeBool(res.targetItem);
            }
            throw new RuntimeError(`Path '${path}' not found in json`, node.line);
        }
        case "set": {
            const path = asScalar(args[0]!, ".set()").value as string;
            const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
            const last = parts.pop()!;
            let current = obj.value;
            for (const p of parts) {
                if (!(p in current)) current[p] = {};
                current = current[p];
            }
            current[last] = runtimeValueToJson(args[1]!);
            return makeBool(true);
        }
        case "bind": {
            const path = asScalar(args[0]!, ".bind() arg1").value as string;
            const res = getNestedJsonPath(obj.value, path);
            if (res && res.targetItem !== undefined) {
                const astArg2 = node.args[1];
                if (astArg2 && astArg2.kind === "Identifier") {
                    const valJs = res.targetItem;
                    let jsv: RuntimeValue = makeStr("");
                    if (typeof valJs === 'string') jsv = makeStr(valJs);
                    else if (typeof valJs === 'number') {
                        const existingVar = env.get(astArg2.name, node.line);
                        const targetIsFloat = existingVar.kind === "scalar" && existingVar.type === "float";
                        jsv = (targetIsFloat || valJs % 1 !== 0) ? makeFloat(valJs) : makeInt(valJs);
                    }
                    else if (typeof valJs === 'boolean') jsv = makeBool(valJs);
                    else if (typeof valJs === 'object') jsv = makeJson(valJs);
                    env.assign(astArg2.name, jsv, node.line);
                    return makeBool(true);
                }
                throw new RuntimeError(`.bind() requires a variable identifier as second argument`, node.line);
            }
            return makeBool(false);
        }
        case "push": {
            if (!Array.isArray(obj.value)) throw new RuntimeError(`halt.error: data is an object, not an array (.push() target)`, node.line);
            obj.value.push(runtimeValueToJson(args[0]!));
            return makeBool(true);
        }
        case "size":
        case "count": {
            if (Array.isArray(obj.value)) return makeInt(obj.value.length);
            if (typeof obj.value === 'object' && obj.value !== null) return makeInt(Object.keys(obj.value).length);
            return makeInt(0);
        }
        case "toStr": {
            return makeStr(JSON.stringify(obj.value));
        }
        case "first": {
            if (!Array.isArray(obj.value) || obj.value.length === 0) throw new RuntimeError(`halt.error: json array empty on .first()`, node.line);
            const first = obj.value[0];
            if (typeof first === "object" && first !== null) return makeJson(first);
            return makeJson(first);
        }
        case "inject": {
            throw new RuntimeError(`inject() not fully implemented`, node.line);
        }
        default:
            throw new RuntimeError(`Unknown json method '${node.method}'`, node.line);
    }
}