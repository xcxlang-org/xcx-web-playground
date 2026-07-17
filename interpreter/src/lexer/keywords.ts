import { TokenType } from "./token";

// TYPE_KEYWORDS are resolved context-sensitively in the lexer:
// a word like "i", "int", "f", "float", "s", "str", "b", "bool", "date"
// is only a type keyword when the NEXT non-whitespace token is ":".
// Otherwise it's a plain Identifier (so you can use `i` as a loop var, etc.)
export const TYPE_KEYWORD_STRINGS: ReadonlySet<string> = new Set([
  "i", "int", "f", "float", "s", "str", "b", "bool", "date", "set", "map", "json"
]);

export const TYPE_KEYWORD_MAP: ReadonlyMap<string, TokenType> = new Map([
  ["i", TokenType.TypeInt],
  ["int", TokenType.TypeInt],
  ["f", TokenType.TypeFloat],
  ["float", TokenType.TypeFloat],
  ["s", TokenType.TypeStr],
  ["str", TokenType.TypeStr],
  ["b", TokenType.TypeBool],
  ["bool", TokenType.TypeBool],
  ["date", TokenType.TypeDate],
  ["set", TokenType.TypeSet],
  ["map", TokenType.TypeMap],
  ["json", TokenType.TypeJson],
]);

export const WORD_KEYWORDS: ReadonlyMap<string, TokenType> = new Map([
  ["map", TokenType.Map],
  ["table", TokenType.Table],
  ["if", TokenType.If],
  ["then", TokenType.Then],
  ["elseif", TokenType.Elseif],
  ["elif", TokenType.Elseif],
  ["elf", TokenType.Elseif],
  ["else", TokenType.Else],
  ["els", TokenType.Else],
  ["end", TokenType.End],
  ["AND", TokenType.And],
  ["OR", TokenType.Or],
  ["NOT", TokenType.NotNot],
  ["HAS", TokenType.Has],
  ["func", TokenType.Func],
  ["return", TokenType.Return],
  ["while", TokenType.While],
  ["do", TokenType.Do],
  ["break", TokenType.Break],
  ["continue", TokenType.Continue],
  ["for", TokenType.For],
  ["in", TokenType.In],
  ["to", TokenType.To],
  ["step", TokenType.Step],
  ["array", TokenType.Array],
  ["const", TokenType.Const],
  ["from", TokenType.From],
  ["UNION", TokenType.SetUnion],
  ["INTERSECTION", TokenType.SetIntersection],
  ["DIFFERENCE", TokenType.SetDifference],
  ["SYMMETRIC_DIFFERENCE", TokenType.SetSymmetricDiff],
  ["EMPTY", TokenType.KwEmpty],
  ["include", TokenType.Include],
  ["as", TokenType.As],
]);

export const BOOLEAN_LITERALS: ReadonlySet<string> = new Set(["true", "false"]);