import { XcxType } from "../parser/ast";

export interface ScalarValue {
  kind: "scalar";
  type: XcxType;
  value: number | string | boolean;
}

export interface ArrayValue {
  kind: "array";
  elementType: XcxType;
  elements: (number | string | boolean)[];
}

/** Internal representation of a date/time value */
export interface DateValue {
  kind: "date";
  date: Date;
}

export interface SetValue {
  kind: "set";
  domain: string;
  elements: Set<number | string | boolean>;
}

export interface MapValue {
  kind: "map";
  keyType: XcxType;
  valueType: XcxType;
  elements: Map<number | string | boolean, number | string | boolean>;
}

export interface JsonValue {
  kind: "json";
  value: any;
}

export interface NamespaceValue {
  kind: "namespace";
  name: string;
  exports: Map<string, RuntimeValue>;
}

export interface TableColumn {
  name: string;
  type: XcxType;
  isAuto: boolean;
}

export interface TableValue {
  kind: "table";
  columns: TableColumn[];
  rows: RuntimeValue[][];
  nextAuto: number;
  name?: string;
}

export interface RowValue {
  kind: "row";
  columns: TableColumn[];
  values: RuntimeValue[];
}

export type RuntimeValue = ScalarValue | ArrayValue | DateValue | SetValue | MapValue | TableValue | RowValue | JsonValue | NamespaceValue;

export const makeSet = (domain: string, elements: Set<number | string | boolean> = new Set()): SetValue =>
  ({ kind: "set", domain, elements });

export const makeMap = (keyType: XcxType, valueType: XcxType, elements: Map<number | string | boolean, number | string | boolean> = new Map()): MapValue =>
  ({ kind: "map", keyType, valueType, elements });

export const makeJson = (value: any): JsonValue => ({ kind: "json", value });

export const makeNamespace = (name: string, exports: Map<string, RuntimeValue>): NamespaceValue => ({ kind: "namespace", name, exports });

export const makeInt = (value: number): ScalarValue => ({ kind: "scalar", type: "int", value: Math.trunc(value) });
export const makeFloat = (value: number): ScalarValue => ({ kind: "scalar", type: "float", value });
export const makeStr = (value: string): ScalarValue => ({ kind: "scalar", type: "str", value });
export const makeBool = (value: boolean): ScalarValue => ({ kind: "scalar", type: "bool", value });
export const makeArray = (elementType: XcxType, elements: (number | string | boolean)[] = []): ArrayValue =>
  ({ kind: "array", elementType, elements });
export const makeDate = (date: Date): DateValue => ({ kind: "date", date });

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - array, set, map missing defaults logically
export const DEFAULT_VALUES: Record<XcxType, ScalarValue | DateValue> = {
  int: makeInt(0),
  float: makeFloat(0.0),
  str: makeStr(""),
  bool: makeBool(false),
  date: makeDate(new Date(0)),
};

export function makeTable(columns: TableColumn[], rows: RuntimeValue[][], nextAuto = 0, name?: string): TableValue {
  return { kind: "table", columns, rows, nextAuto, name };
}

export function makeRow(columns: TableColumn[], values: RuntimeValue[]): RowValue {
  return { kind: "row", columns, values };
}

export function displayValue(rv: RuntimeValue): string {
  if (rv.kind === "set") return `{${Array.from(rv.elements).join(", ")}}`;
  if (rv.kind === "array") return `{${rv.elements.join(", ")}}`;
  if (rv.kind === "map") {
    const pairs: string[] = [];
    rv.elements.forEach((v, k) => pairs.push(`${k} :: ${v}`));
    return `[${pairs.join(", ")}]`;
  }
  if (rv.kind === "table") return `Table(${rv.rows.length} rows)`;
  if (rv.kind === "row") return `Row(${rv.values.map(v => displayValue(v)).join(", ")})`;
  if (rv.kind === "date") return formatDate(rv.date, "YYYY-MM-DD HH:mm:ss");
  if (rv.kind === "json") return JSON.stringify(rv.value);
  if (rv.kind === "namespace") return `Namespace(${rv.name})`;
  return String(rv.value);
}

/** Narrow to scalar, throw if array or date */
export function asScalar(rv: RuntimeValue, context: string): ScalarValue {
  if (rv.kind !== "scalar") throw new Error(`${context}: expected scalar value, got ${rv.kind}`);
  return rv;
}

/** Narrow to DateValue, throw otherwise */
export function asDate(rv: RuntimeValue, context: string): DateValue {
  if (rv.kind !== "date") throw new Error(`${context}: expected date value, got ${rv.kind}`);
  return rv;
}

/** Narrow to SetValue, throw otherwise */
export function asSet(rv: RuntimeValue, context: string): SetValue {
  if (rv.kind !== "set") throw new Error(`${context}: expected set value, got ${rv.kind}`);
  return rv;
}

/** Narrow to MapValue, throw otherwise */
export function asMap(rv: RuntimeValue, context: string): MapValue {
  if (rv.kind !== "map") throw new Error(`${context}: expected map value, got ${rv.kind}`);
  return rv;
}

/** Narrow to TableValue, throw otherwise */
export function asTable(rv: RuntimeValue, context: string): TableValue {
  if (rv.kind !== "table") throw new Error(`${context}: expected table value, got ${rv.kind}`);
  return rv;
}

/** Narrow to JsonValue, throw otherwise */
export function asJson(rv: RuntimeValue, context: string): JsonValue {
  if (rv.kind !== "json") throw new Error(`${context}: expected json value, got ${rv.kind}`);
  return rv;
}

// ── Date formatting ─────────────────────────────────────────────────────────

/**
 * Format a JS Date using XCX format tokens:
 *   YYYY  MM  M  DD  D  HH  mm  ss  SSS  ms
 */
export function formatDate(d: Date, fmt: string): string {
  const YYYY = String(d.getFullYear()).padStart(4, "0");
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const M = String(d.getMonth() + 1);
  const DD = String(d.getDate()).padStart(2, "0");
  const D = String(d.getDate());
  const HH = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");

  const TOKEN_MAP: Record<string, string> = { YYYY, MM, DD, HH, SSS: ms, ms, mm, ss, M, D };
  return fmt.replace(/YYYY|SSS|MM|DD|HH|mm|ss|\bms\b|\bM\b|\bD\b/g, (m) => TOKEN_MAP[m] ?? m);
}

// â”€â”€ Date parsing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Parse a date string according to an XCX format pattern.
 * Supported tokens: YYYY  MM  DD  HH  mm  ss
 * Default format: "YYYY-MM-DD"
 */
export function parseDate(dateStr: string, fmt: string = "YYYY-MM-DD"): Date {
  // Build a regex from the format string
  let regexStr = fmt
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // escape regex special chars
    .replace(/YYYY/, "(?<year>\\d{4})")
    .replace(/MM/, "(?<month>\\d{2})")
    .replace(/DD/, "(?<day>\\d{2})")
    .replace(/HH/, "(?<hour>\\d{2})")
    .replace(/mm/, "(?<minute>\\d{2})")
    .replace(/ss/, "(?<second>\\d{2})");

  const re = new RegExp("^" + regexStr + "$");
  const m = re.exec(dateStr);
  if (!m || !m.groups) {
    throw new Error(`Cannot parse date '${dateStr}' with format '${fmt}'`);
  }

  const g = m.groups;
  const year = g["year"] !== undefined ? parseInt(g["year"], 10) : 1970;
  const month = g["month"] !== undefined ? parseInt(g["month"], 10) : 1;
  const day = g["day"] !== undefined ? parseInt(g["day"], 10) : 1;
  const hour = g["hour"] !== undefined ? parseInt(g["hour"], 10) : 0;
  const minute = g["minute"] !== undefined ? parseInt(g["minute"], 10) : 0;
  const second = g["second"] !== undefined ? parseInt(g["second"], 10) : 0;

  return new Date(year, month - 1, day, hour, minute, second, 0);
}
