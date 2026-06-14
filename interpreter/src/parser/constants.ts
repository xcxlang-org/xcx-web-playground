import { TokenType } from "../lexer/token";
import type { XcxType } from "./ast";
export { TYPE_KEYWORD_MAP } from "../lexer/keywords";

export const TOKEN_TO_XCXTYPE: ReadonlyMap<TokenType, XcxType> = new Map([
    [TokenType.TypeInt, "int"],
    [TokenType.TypeFloat, "float"],
    [TokenType.TypeStr, "str"],
    [TokenType.TypeBool, "bool"],
    [TokenType.TypeDate, "date"],
    [TokenType.TypeSet, "set"],
    [TokenType.TypeMap, "map"],
    [TokenType.Table, "table"],
    [TokenType.TypeJson, "json"],
]);

export const SHARED_METHODS = new Set<string>([
    "size", "isEmpty", "contains", "clear", "show", "add", "remove",
    "get", "insert", "keys", "values"
]);

export const ARRAY_METHODS = new Set<string>([
    "get", "push", "pop", "insert", "update", "delete",
    "find", "sort", "reverse", "set"
]);

export const DATE_PROPERTIES = new Set<string>(["year", "month", "day", "hour", "minute", "second", "timestamp"]);
export const STRING_PROPERTIES = new Set<string>(["length"]);
export const STRING_METHODS = new Set<string>(["upper", "lower", "trim", "replace", "slice", "indexOf", "lastIndexOf", "startsWith", "endsWith", "toInt", "toFloat"]);
export const TABLE_METHODS = new Set<string>(["count", "get", "insert", "add", "update", "delete", "where", "join", "show"]);
export const JSON_METHODS = new Set<string>(["exists", "get", "set", "push", "count", "toStr", "first", "bind", "inject"]);
export const CMP_TYPES = new Set<TokenType>([TokenType.Lt, TokenType.Gt, TokenType.LtEq, TokenType.GtEq, TokenType.Has]);
