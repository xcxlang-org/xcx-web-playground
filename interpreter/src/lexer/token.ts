export enum TokenType {
  // Literals
  Integer = "INTEGER",
  Float = "FLOAT",
  String = "STRING",
  Boolean = "BOOLEAN",

  // Types
  TypeInt = "TYPE_INT",
  TypeFloat = "TYPE_FLOAT",
  TypeStr = "TYPE_STR",
  TypeBool = "TYPE_BOOL",
  TypeDate = "TYPE_DATE",
  TypeMap = "TypeMap",
  TypeSet = "TypeSet",
  TypeJson = "TypeJson", // JSON
  // Map keywords
  KwSchema = "KwSchema",
  KwData = "KwData",
  KwEmpty = "KwEmpty",

  // Identifiers
  Identifier = "IDENTIFIER",

  // Arithmetic operators
  Assign = "ASSIGN",    // =
  Plus = "PLUS",      // +
  Minus = "MINUS",     // -
  Star = "STAR",      // *
  Slash = "SLASH",     // /
  Percent = "PERCENT",   // %
  Caret = "CARET",     // ^
  PlusPlus = "PLUSPLUS",  // ++

  // Comparison operators
  EqEq = "EQEQ",     // ==
  NotEq = "NOTEQ",    // !=
  Lt = "LT",       // <
  Gt = "GT",       // >
  LtEq = "LTEQ",     // <=
  GtEq = "GTEQ",     // >=

  // Logical operators
  Not = "NOT",      // !
  And = "AND",      // && / AND
  Or = "OR",       // || / OR
  NotNot = "NOTNOT",   // !! logical NOT

  // String operators
  Has = "HAS",      // HAS

  // Set operators
  SetUnion = "SET_UNION",
  SetIntersection = "SET_INTERSECTION",
  SetDifference = "SetDifference",
  SetSymmetricDiff = "SetSymmetricDiff",
  MapBind = "MapBind",         // ::
  MapSchemaOp = "MapSchemaOp", // <-> or <=>

  // Keywords
  Print = "PRINT",    // >!
  Input = "INPUT",    // >?
  If = "IF",       // if
  Then = "THEN",     // then
  Elseif = "ELSEIF",   // elseif / elif / elf
  Else = "ELSE",     // else / els
  End = "END",      // end
  Func = "FUNC",     // func
  Return = "RETURN",   // return
  Map = "MAP",      // map
  Table = "TABLE",  // table
  Arrow = "ARROW",    // ->
  While = "WHILE",    // while
  Do = "DO",       // do
  Break = "BREAK",    // break
  Continue = "CONTINUE", // continue
  For = "FOR",      // for
  In = "IN",       // in
  To = "TO",       // to
  Step = "STEP",     // @step
  Auto = "AUTO",     // @auto
  Wait = "WAIT",     // @wait
  Array = "ARRAY",    // array
  Const = "CONST",    // const
  Dot = "DOT",      // .
  From = "FROM",     // from  (random.choice from arr)
  Include = "INCLUDE", // include
  As = "AS",         // as

  // Punctuation
  Colon = "COLON",    // :
  Semicolon = "SEMICOLON",// ;
  LBrace = "LBRACE",   // {
  RBrace = "RBRACE",   // }
  LBracket = "LBracket", // [
  RBracket = "RBracket", // ]
  LParen = "LPAREN",   // (
  RParen = "RPAREN",   // )
  Comma = "COMMA",    // ,
  RangeSep = "RANGE_SEP",// ,,

  // Special
  EOF = "EOF",

  JsonString = "JsonString", // the raw content of <<< ... >>>
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

export function makeToken(type: TokenType, value: string, line: number, col: number): Token {
  return { type, value, line, col };
}