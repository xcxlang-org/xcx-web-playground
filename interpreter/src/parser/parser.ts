import {
  Token, TokenType
} from "../lexer/token";
import {
  ASTNode, ProgramNode
} from "./ast";
import { ParseError } from "../errors/errors";

import {
  parseExpr, parseOr, parseAnd, parseEquality, parseComparison,
  parseConcatenation, parseAdditive, parseMultiplicative, parseExponent, parseUnary,
  parsePrimary, parseDateExpr, parseRandomExpr, parsePerfExpr, parseInputExpr, parseJsonExpr,
  parseCallExpr
} from "./parse/expressions";

import {
  parseConstDeclaration, parseVarDeclaration, parseVarAssign,
  parseArrayDeclaration, parseTableDeclaration, parseMapDeclaration,
  parseSetDeclaration, parseSetExpr
} from "./parse/declarations";

import {
  parseIf, parseBlock, parseBreak, parseContinue, parseWhile,
  parseFor, parseFuncDeclaration, parseFuncBody, parseReturn,
  parsePrint, parseInput, parseWait, parseTerminalCommand, parseInclude
} from "./parse/flow";

// Export helper maps & sets for dynamic imports
export { TYPE_KEYWORD_MAP } from "../lexer/keywords";

export * from "./constants";
import { TOKEN_TO_XCXTYPE } from "./constants";

export class Parser {
  public pos = 0;

  constructor(public readonly tokens: Token[]) { }

  public parse(): ProgramNode {
    const body: ASTNode[] = [];
    while (!this.isEOF()) {
      body.push(this.parseStatement());
    }
    return { kind: "Program", body };
  }

  // ── Statements ─────────────────────────────────────────────────────────────

  public parseStatement(): ASTNode {
    const tok = this.current();

    if ((tok.type as any) === TokenType.Table && this.peek(3)?.type === TokenType.LBrace) return this.parseTableDeclaration();

    // `.terminal !cmd` -> terminal directives
    if (tok.type === TokenType.Dot && this.peek()?.type === TokenType.Identifier && this.peek()?.value === "terminal" && this.peek(2)?.type === TokenType.Not) {
      return this.parseTerminalCommand();
    }

    // halt statement: halt.level >! expr;
    if (tok.type === TokenType.Identifier && tok.value === "halt" && this.peek(1).type === TokenType.Dot) {
      const line = tok.line;
      this.consume(); // halt
      this.consume(); // .
      const levelTok = this.expect(TokenType.Identifier, "halt level");
      if (levelTok.value !== "alert" && levelTok.value !== "error" && levelTok.value !== "fatal") {
        throw new ParseError(`Unknown halt level '${levelTok.value}'`, levelTok.line, levelTok.col);
      }
      this.expect(TokenType.Print, "'>!' after halt level");
      const message = this.parseExpr();
      this.expect(TokenType.Semicolon, "';'");
      return { kind: "Halt", level: levelTok.value as any, message, line };
    }

    if (tok.type === TokenType.Const) return this.parseConstDeclaration();
    if (tok.type === TokenType.Array) return this.parseArrayDeclaration();
    if (tok.type === TokenType.TypeSet) return this.parseSetDeclaration();
    if (tok.type === TokenType.Func) return this.parseFuncDeclaration();
    if (tok.type === TokenType.Map) return this.parseMapDeclaration();
    if (tok.type === TokenType.Return) return this.parseReturn();
    if (tok.type === TokenType.While) return this.parseWhile();
    if (tok.type === TokenType.For) return this.parseFor();
    if (tok.type === TokenType.Break) return this.parseBreak();
    if (tok.type === TokenType.Continue) return this.parseContinue();
    if (tok.type === TokenType.Print) return this.parsePrint();
    if (tok.type === TokenType.Input) return this.parseInput();
    if (tok.type === TokenType.If) return this.parseIf();
    if (tok.type === TokenType.Wait) return this.parseWait();
    if (tok.type === TokenType.Include) return this.parseInclude();

    if (TOKEN_TO_XCXTYPE.has(tok.type) || tok.type === TokenType.TypeJson) {
      if ((tok.type as any) === TokenType.TypeSet) return this.parseSetDeclaration();
      if ((tok.type as any) === TokenType.TypeMap) return this.parseMapDeclaration();
      return this.parseVarDeclaration();
    }
    if (tok.type === TokenType.Identifier && tok.value === "table") {
      return this.parseTableDeclaration();
    }

    // Reassignment: identifier followed by =
    if (tok.type === TokenType.Identifier && this.peek().type === TokenType.Assign) {
      return this.parseVarAssign();
    }

    // Array/String method call as statement: identifier . method ( ... ) ;
    if (tok.type === TokenType.Identifier && this.peek().type === TokenType.Dot) {
      const node = this.parsePrimary();
      this.expect(TokenType.Semicolon, "';'");
      return node;
    }

    // Function call as statement: identifier followed by (
    if (tok.type === TokenType.Identifier && this.peek().type === TokenType.LParen) {
      const call = this.parseCallExpr();
      this.expect(TokenType.Semicolon, "';'");
      return call;
    }

    throw new ParseError(`Unexpected token '${tok.value}'`, tok.line, tok.col, tok.value.length);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  public current(): Token { return this.tokens[this.pos]!; }
  public peek(offset = 1): Token { return this.tokens[this.pos + offset] ?? this.tokens[this.tokens.length - 1]!; }
  public consume(): Token { return this.tokens[this.pos++]!; }
  public isEOF(): boolean { return this.current().type === TokenType.EOF; }

  public expect(type: TokenType, label: string): Token {
    const tok = this.current();
    if (tok.type !== type) throw new ParseError(`Expected ${label}, got '${tok.value}'`, tok.line, tok.col, tok.value.length);
    return this.consume();
  }

  // ── Delegated Helper Handlers ──────────────────────────────────────────────
  public parseExpr = () => parseExpr(this);
  public parseOr = () => parseOr(this);
  public parseAnd = () => parseAnd(this);
  public parseEquality = () => parseEquality(this);
  public parseComparison = () => parseComparison(this);
  public parseConcatenation = () => parseConcatenation(this);
  public parseAdditive = () => parseAdditive(this);
  public parseMultiplicative = () => parseMultiplicative(this);
  public parseExponent = () => parseExponent(this);
  public parseUnary = () => parseUnary(this);
  public parsePrimary = () => parsePrimary(this);
  public parseDateExpr = () => parseDateExpr(this);
  public parseRandomExpr = () => parseRandomExpr(this);
  public parsePerfExpr = () => parsePerfExpr(this);
  public parseInputExpr = () => parseInputExpr(this);
  public parseJsonExpr = () => parseJsonExpr(this);
  public parseCallExpr = () => parseCallExpr(this);

  public parseConstDeclaration = () => parseConstDeclaration(this);
  public parseVarDeclaration = () => parseVarDeclaration(this);
  public parseVarAssign = () => parseVarAssign(this);
  public parseArrayDeclaration = () => parseArrayDeclaration(this);
  public parseTableDeclaration = () => parseTableDeclaration(this);
  public parseMapDeclaration = () => parseMapDeclaration(this);
  public parseSetDeclaration = () => parseSetDeclaration(this);
  public parseSetExpr = () => parseSetExpr(this);

  public parseIf = () => parseIf(this);
  public parseBlock = () => parseBlock(this);
  public parseBreak = () => parseBreak(this);
  public parseContinue = () => parseContinue(this);
  public parseWhile = () => parseWhile(this);
  public parseFor = () => parseFor(this);
  public parseFuncDeclaration = () => parseFuncDeclaration(this);
  public parseFuncBody = () => parseFuncBody(this);
  public parseReturn = () => parseReturn(this);
  public parsePrint = () => parsePrint(this);
  public parseInput = () => parseInput(this);
  public parseWait = () => parseWait(this);
  public parseTerminalCommand = () => parseTerminalCommand(this);
  public parseInclude = () => parseInclude(this);
}
