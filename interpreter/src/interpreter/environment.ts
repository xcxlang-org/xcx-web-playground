import { RuntimeValue, ScalarValue, ArrayValue, SetValue, MapValue, TableValue } from "./values";
import { XcxType } from "../parser/ast";
import {
  RuntimeError, AssignToConstError, RedefinedVariableError,
  UndefinedVariableError, TypeMismatchError
} from "../errors/errors";

interface VarRecord {
  declaredType: XcxType;
  value: RuntimeValue;
  isConst: boolean;
  isArray: boolean;
  isDate: boolean;
  isSet: boolean;
  isMap: boolean;
  isTable: boolean;
  isRow: boolean;
  isJson: boolean;
}

export class Environment {
  private readonly store = new Map<string, VarRecord>();

  constructor(private readonly parent: Environment | null = null) { }

  child(): Environment {
    return new Environment(this);
  }

  declare(
    name: string,
    declaredType: XcxType,
    value: RuntimeValue,
    line: number,
    isConst = false,
    _isParam = false,
  ): void {
    if (this.store.has(name)) {
      throw new RedefinedVariableError(name, line);
    }
    const isArray = value.kind === "array";
    const isDate = value.kind === "date";
    const isSet = value.kind === "set";
    const isMap = value.kind === "map";
    const isTable = value.kind === "table";
    const isRow = value.kind === "row";
    const isJson = value.kind === "json";
    const isNamespace = value.kind === "namespace";

    if (!isArray && !isDate && !isSet && !isMap && !isTable && !isRow && !isJson && !isNamespace) {
      const sv = value as ScalarValue;
      if (sv.type !== declaredType) {
        throw new TypeMismatchError(declaredType, sv.type, line);
      }
    }
    this.store.set(name, { declaredType, value, isConst, isArray, isDate, isSet, isMap, isTable, isRow, isJson });
  }

  declareArray(
    name: string,
    elementType: XcxType,
    value: ArrayValue,
    line: number,
  ): void {
    if (this.store.has(name)) {
      throw new RedefinedVariableError(name, line);
    }
    this.store.set(name, { declaredType: elementType, value, isConst: false, isArray: true, isDate: false, isSet: false, isMap: false, isTable: false, isRow: false, isJson: false });
  }

  declareSet(
    name: string,
    _domain: string,
    value: SetValue,
    line: number,
  ): void {
    if (this.store.has(name)) {
      throw new RedefinedVariableError(name, line);
    }
    this.store.set(name, { declaredType: "str", value, isConst: false, isArray: false, isDate: false, isSet: true, isMap: false, isTable: false, isRow: false, isJson: false });
  }

  declareMap(
    name: string,
    value: MapValue,
    line: number,
  ): void {
    if (this.store.has(name)) {
      throw new RedefinedVariableError(name, line);
    }
    this.store.set(name, { declaredType: "str", value, isConst: false, isArray: false, isDate: false, isSet: false, isMap: true, isTable: false, isRow: false, isJson: false });
  }

  declareTable(
    name: string,
    value: TableValue,
    line: number,
  ): void {
    if (this.store.has(name)) {
      throw new RedefinedVariableError(name, line);
    }
    this.store.set(name, { declaredType: "str", value, isConst: false, isArray: false, isDate: false, isSet: false, isMap: false, isTable: true, isRow: false, isJson: false });
  }

  assign(name: string, value: RuntimeValue, line: number): void {
    const record = this.resolveRecord(name);
    if (!record) throw new UndefinedVariableError(name, line);
    if (record.isConst) throw new AssignToConstError(name, line);
    if (record.isArray) {
      throw new RuntimeError(`Cannot reassign array variable '${name}' directly; use array methods`, line);
    }
    if (record.isSet) {
      record.value = value;
      return;
    }
    if (record.isMap) {
      record.value = value;
      return;
    }
    if (record.isTable) {
      record.value = value;
      return;
    }
    if (record.isRow) {
      record.value = value;
      return;
    }

    if (value.kind === "date") {
      if (record.declaredType !== "date") {
        throw new TypeMismatchError(record.declaredType, "date", line);
      }
      record.value = value;
      return;
    }

    if (value.kind === "json" || record.isJson) {
      if (record.declaredType !== "json") {
        throw new TypeMismatchError(record.declaredType, "json", line);
      }
      record.value = value;
      return;
    }

    const sv = value as ScalarValue;
    if (sv.type !== record.declaredType) {
      throw new TypeMismatchError(record.declaredType, sv.type, line);
    }
    record.value = value;
  }

  get(name: string, line: number): RuntimeValue {
    const record = this.resolveRecord(name);
    if (!record) throw new UndefinedVariableError(name, line);
    return record.value;
  }

  getArray(name: string, line: number): ArrayValue {
    const record = this.resolveRecord(name);
    if (!record) throw new UndefinedVariableError(name, line);
    if (!record.isArray) throw new RuntimeError(`Variable '${name}' is not an array`, line);
    return record.value as ArrayValue;
  }

  private resolveRecord(name: string): VarRecord | null {
    const local = this.store.get(name);
    if (local !== undefined) return local;
    return this.parent ? this.parent.resolveRecord(name) : null;
  }

  has(name: string): boolean {
    return this.resolveRecord(name) !== null;
  }
}