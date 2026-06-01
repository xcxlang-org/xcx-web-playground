export type XcxType = "int" | "float" | "str" | "bool" | "date" | "array" | "set" | "map" | "table" | "json" | "namespace";

export type BinaryOp =
  | "+" | "-" | "*" | "/" | "%" | "^" | "++"
  | "==" | "!=" | "<" | ">" | "<=" | ">="
  | "&&" | "||" | "AND" | "OR" | "HAS";

export type UnaryOp = "!" | "!!" | "-";

export type ASTNode =
  | ProgramNode
  | VarDeclarationNode
  | ConstDeclarationNode
  | VarAssignNode
  | PrintNode
  | InputNode
  | BinaryExprNode
  | UnaryExprNode
  | IdentifierNode
  | LiteralNode
  | IfNode
  | FuncDeclarationNode
  | CallExprNode
  | ReturnNode
  | WhileNode
  | BreakNode
  | ContinueNode
  | WaitNode
  | ForNode
  | ArrayDeclarationNode
  | ArrayMethodCallNode
  // ── date ──
  | DateConstructorNode
  | DateNowNode
  | DatePropertyNode
  | DateFormatNode
  // ── random ──
  | RandomIntNode
  | RandomFloatNode
  | RandomChoiceNode

  | LambdaNode
  // ── string ──
  | StringPropertyNode
  | StringMethodCallNode
  | PropertyAccessNode
  // ── shared methods ──
  | GenericMethodCallNode
  // ── sets ──
  | SetDeclarationNode
  | SetBinaryExprNode
  | SetMethodCallNode
  // ── maps ──
  | MapDeclarationNode
  | MapMethodCallNode
  // ── tables ──
  | TableDeclarationNode
  // ── error handling ──
  | HaltNode
  // ── terminal handling ──
  | TerminalCommandNode
  | InputKeyNode
  | InputReadyNode
  // ── json ──
  | JsonLiteralNode
  | JsonParseNode
  // ── modules ──
  | IncludeNode;

export interface ProgramNode { kind: "Program"; body: ASTNode[]; }
export interface VarDeclarationNode { kind: "VarDeclaration"; varType: XcxType; name: string; value: ASTNode | null; line: number; }
export interface ConstDeclarationNode { kind: "ConstDeclaration"; varType: XcxType; name: string; value: ASTNode; line: number; }
export interface VarAssignNode { kind: "VarAssign"; name: string; value: ASTNode; line: number; }
export interface PrintNode { kind: "Print"; value: ASTNode; line: number; }
export interface InputNode { kind: "Input"; name: string; line: number; }
export interface BinaryExprNode { kind: "BinaryExpr"; operator: BinaryOp; left: ASTNode; right: ASTNode; line: number; }
export interface UnaryExprNode { kind: "UnaryExpr"; operator: UnaryOp; operand: ASTNode; line: number; }
export interface IdentifierNode { kind: "Identifier"; name: string; line: number; }
export interface LiteralNode { kind: "Literal"; value: number | string | boolean; literalType: XcxType; line: number; }
export interface ReturnNode { kind: "Return"; value: ASTNode | null; line: number; }

export interface IfBranch { condition: ASTNode; body: ASTNode[]; }
export interface IfNode {
  kind: "If";
  ifBranch: IfBranch;
  elseifBranches: IfBranch[];
  elseBranch: ASTNode[] | null;
  line: number;
}

export interface FuncParam {
  paramType: XcxType;
  name: string;
}

export interface FuncDeclarationNode {
  kind: "FuncDeclaration";
  name: string;
  params: FuncParam[];
  returnType: XcxType | null;   // null = void
  body: ASTNode[];
  line: number;
}

export interface CallExprNode {
  kind: "CallExpr";
  callee: string;
  args: ASTNode[];
  line: number;
}

export interface BreakNode { kind: "Break"; line: number; }
export interface ContinueNode { kind: "Continue"; line: number; }

export interface WaitNode { kind: "Wait"; ms: ASTNode; line: number; }

export interface WhileNode {
  kind: "While";
  condition: ASTNode;
  body: ASTNode[];
  line: number;
}

export interface ForNode {
  kind: "For";
  varName: string;
  start?: ASTNode;
  end?: ASTNode;
  step?: ASTNode | null;
  collection?: ASTNode;
  body: ASTNode[];
  line: number;
}

// ── Arrays ───────────────────────────────────────────────────────────────────

export interface ArrayDeclarationNode {
  kind: "ArrayDeclaration";
  elementType: XcxType;
  name: string;
  elements: ASTNode[];
  value?: ASTNode | null;
  line: number;
}

export type ArrayMethodName =
  | "size" | "get" | "push" | "pop"
  | "insert" | "update" | "delete"
  | "find" | "contains" | "isEmpty"
  | "clear" | "sort" | "reverse" | "show";

export interface ArrayMethodCallNode {
  kind: "ArrayMethodCall";
  arrayName: string;
  method: ArrayMethodName;
  args: ASTNode[];
  line: number;
}

// ── Strings ────────────────────────────────────────────────────────────────

export type StringProperty = "length";

export interface StringPropertyNode {
  kind: "StringProperty";
  object: ASTNode;
  property: StringProperty;
  line: number;
}

export type StringMethodName =
  | "upper" | "lower" | "trim" | "replace" | "slice"
  | "indexOf" | "lastIndexOf" | "startsWith" | "endsWith"
  | "toInt" | "toFloat";

export interface StringMethodCallNode {
  kind: "StringMethodCall";
  object: ASTNode;
  method: StringMethodName;
  args: ASTNode[];
  line: number;
}

export interface PropertyAccessNode {
  kind: "PropertyAccess";
  object: ASTNode;
  property: string;
  line: number;
}

export interface GenericMethodCallNode {
  kind: "GenericMethodCall";
  object: ASTNode;
  method: string;
  args: ASTNode[];
  line: number;
}

// ── Maps ───────────────────────────────────────────────────────────────────

export interface MapEntry {
  key: ASTNode;
  value: ASTNode;
}

export interface MapDeclarationNode {
  kind: "MapDeclaration";
  name: string;
  keyType: XcxType;
  valueType: XcxType;
  entries: MapEntry[];
  line: number;
}

export interface MapMethodCallNode {
  kind: "MapMethodCall";
  object: ASTNode;
  method: string;
  args: ASTNode[];
  line: number;
}

// ── Tables ─────────────────────────────────────────────────────────────────

export interface TableDeclarationNode {
  kind: "TableDeclaration";
  name: string;
  columns: { name: string; type: XcxType; isAuto: boolean }[];
  rows: ASTNode[][];
  line: number;
}

// ── Lambda ─────────────────────────────────────────────────────────────────

export interface LambdaNode {
  kind: "Lambda";
  params: string[];
  body: ASTNode;
  line: number;
}

// ── Sets ───────────────────────────────────────────────────────────────────

export type SetDomain = "N" | "Z" | "Q" | "S" | "B" | "C";

export type SetInitElement =
  | { kind: "value"; node: ASTNode }
  | { kind: "range"; from: ASTNode; to: ASTNode; step: ASTNode | null };

export interface SetDeclarationNode {
  kind: "SetDeclaration";
  domain: SetDomain;
  name: string;
  init: SetInitElement[];
  value: ASTNode | null;  // optional rhs set expression (e.g. setA UNION setB)
  line: number;
}

export type SetOperator = "UNION" | "INTERSECTION" | "DIFFERENCE" | "SYMMETRIC_DIFFERENCE";

export interface SetBinaryExprNode {
  kind: "SetBinaryExpr";
  left: ASTNode;
  right: ASTNode;
  operator: SetOperator;
  line: number;
}

export interface SetMethodCallNode {
  kind: "SetMethodCall";
  object: ASTNode;
  method: string;
  args: ASTNode[];
  line: number;
}

// ── Error Handling ───────────────────────────────────────────────────────────

export type HaltLevel = "alert" | "error" | "fatal";
export interface HaltNode {
  kind: "Halt";
  level: HaltLevel;
  message: ASTNode;
  line: number;
}

// ── Date ─────────────────────────────────────────────────────────────────────

/** date("2024-12-25")  or  date("25/12/2024", "DD/MM/YYYY") */
export interface DateConstructorNode {
  kind: "DateConstructor";
  dateStr: ASTNode;        // string expression
  format: ASTNode | null;  // optional format string expression
  line: number;
}

/** date.now() */
export interface DateNowNode {
  kind: "DateNow";
  line: number;
}

/** someDate.year / .month / .day / .hour / .minute / .second */
export type DateProperty = "year" | "month" | "day" | "hour" | "minute" | "second" | "timestamp";
export interface DatePropertyNode {
  kind: "DateProperty";
  object: ASTNode;
  property: DateProperty;
  line: number;
}

/** someDate.format()  or  someDate.format("DD/MM/YYYY") */
export interface DateFormatNode {
  kind: "DateFormat";
  object: ASTNode;
  formatStr: ASTNode | null;   // null → default format
  line: number;
}

/**
 * Date binary operations:
 *   date + i  → date
 *   date - i  → date
 *   date - date → i   (days between)
 *   date </>/<=/>==/!= date → bool
 *
 * These are represented in the normal BinaryExprNode; the interpreter
 * detects DateValue operands at runtime.  No separate AST node needed.
 */
// (intentionally empty – handled by BinaryExprNode at runtime)
// ── Random ───────────────────────────────────────────────────────────────────

/** random.int(min, max)  or  random.int(min, max @step s) */
export interface RandomIntNode {
  kind: "RandomInt";
  min: ASTNode;
  max: ASTNode;
  step: ASTNode | null;   // null → default step 1
  line: number;
}

/** random.float(min, max)  or  random.float(min, max @step s) */
export interface RandomFloatNode {
  kind: "RandomFloat";
  min: ASTNode;
  max: ASTNode;
  step: ASTNode | null;   // null → continuous uniform
  line: number;
}

/** random.choice from <arrayName> */
export interface RandomChoiceNode {
  kind: "RandomChoice";
  arrayName: string;
  line: number;
}

export type TerminalCommandType = "clear" | "exit" | "run" | "raw" | "normal" | "cursor_on" | "cursor_off" | "move" | "write";

export interface TerminalCommandNode {
  kind: "TerminalCommand";
  command: TerminalCommandType;
  args: ASTNode[];
  line: number;
}

export interface InputKeyNode {
  kind: "InputKey";
  wait: boolean;
  line: number;
}

export interface InputReadyNode {
  kind: "InputReady";
  line: number;
}

export interface JsonLiteralNode {
  kind: "JsonLiteral";
  value: string;
  line: number;
}

export interface JsonParseNode {
  kind: "JsonParse";
  expr: ASTNode;
  line: number;
}

// path: the string after `include`, e.g. "math" or "math.xcx"
// alias: the name after `as`, or null for namespace-merging includes
export interface IncludeNode {
  kind: "Include";
  path: string;
  alias: string | null;
  line: number;
}