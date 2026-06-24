import { Token, TokenType, makeToken } from "./token";
import { TYPE_KEYWORD_STRINGS, TYPE_KEYWORD_MAP, WORD_KEYWORDS, BOOLEAN_LITERALS } from "./keywords";
import { LexerError } from "../errors/errors";

export class Lexer {
  private pos = 0;
  private line = 1;
  private col = 1;
  private lastEmitted: Token | null = null;

  constructor(private readonly src: string) { }

  private matchSeq2(c0: string, c1: string): boolean {
    return this.src[this.pos] === c0 && this.src[this.pos + 1] === c1;
  }

  private matchSeq3(c0: string, c1: string, c2: string): boolean {
    return this.src[this.pos] === c0 &&
      this.src[this.pos + 1] === c1 &&
      this.src[this.pos + 2] === c2;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    const emit = (tok: Token): void => { tokens.push(tok); this.lastEmitted = tok; };

    while (!this.isEOF()) {
      this.skipWhitespace();
      if (this.isEOF()) break;

      // Comments: --- followed by newline = block, otherwise line
      if (this.matchSeq3("-", "-", "-")) {
        const after = this.src[this.pos + 3];
        if (after === "\n" || after === "\r" || after === undefined) {
          this.skipBlockComment();
        } else {
          this.skipLineComment();
        }
        continue;
      }

      // Three-char tokens
      if (this.matchSeq3("<", "<", "<")) { emit(this.readJsonBlock()); continue; }
      if (this.matchSeq3("<", "=", ">")) { emit(makeToken(TokenType.MapSchemaOp, "<=>", this.line, this.col)); this.advance(3); continue; }
      if (this.matchSeq3("<", "-", ">")) { emit(makeToken(TokenType.MapSchemaOp, "<->", this.line, this.col)); this.advance(3); continue; }

      // Two-char tokens — check before single-char
      if (this.matchSeq2("-", ">")) { emit(makeToken(TokenType.Arrow, "->", this.line, this.col)); this.advance(2); continue; }
      if (this.matchSeq2(">", "!")) { emit(makeToken(TokenType.Print, ">!", this.line, this.col)); this.advance(2); continue; }
      if (this.matchSeq2(">", "?")) { emit(makeToken(TokenType.Input, ">?", this.line, this.col)); this.advance(2); continue; }
      if (this.matchSeq2("+", "+")) { emit(makeToken(TokenType.PlusPlus, "++", this.line, this.col)); this.advance(2); continue; }
      if (this.matchSeq2("=", "=")) { emit(makeToken(TokenType.EqEq, "==", this.line, this.col)); this.advance(2); continue; }
      if (this.matchSeq2("!", "=")) { emit(makeToken(TokenType.NotEq, "!=", this.line, this.col)); this.advance(2); continue; }
      if (this.matchSeq2("<", "=")) { emit(makeToken(TokenType.LtEq, "<=", this.line, this.col)); this.advance(2); continue; }
      if (this.matchSeq2(">", "=")) { emit(makeToken(TokenType.GtEq, ">=", this.line, this.col)); this.advance(2); continue; }
      if (this.matchSeq2("&", "&")) { emit(makeToken(TokenType.And, "&&", this.line, this.col)); this.advance(2); continue; }
      if (this.matchSeq2("|", "|")) { emit(makeToken(TokenType.Or, "||", this.line, this.col)); this.advance(2); continue; }
      if (this.matchSeq2("!", "!")) { emit(makeToken(TokenType.NotNot, "!!", this.line, this.col)); this.advance(2); continue; }

      const ch = this.current();

      switch (ch) {
        case ":": {
          if (this.src[this.pos + 1] === ':') { emit(makeToken(TokenType.MapBind, "::", this.line, this.col)); this.advance(2); continue; }
          emit(makeToken(TokenType.Colon, ":", this.line, this.col)); this.advance(); continue;
        }
        case ";": emit(makeToken(TokenType.Semicolon, ";", this.line, this.col)); this.advance(); continue;
        case "=": emit(makeToken(TokenType.Assign, "=", this.line, this.col)); this.advance(); continue;
        case "+": emit(makeToken(TokenType.Plus, "+", this.line, this.col)); this.advance(); continue;
        case "-": emit(makeToken(TokenType.Minus, "-", this.line, this.col)); this.advance(); continue;
        case "*": emit(makeToken(TokenType.Star, "*", this.line, this.col)); this.advance(); continue;
        case "/": emit(makeToken(TokenType.Slash, "/", this.line, this.col)); this.advance(); continue;
        case "%": emit(makeToken(TokenType.Percent, "%", this.line, this.col)); this.advance(); continue;
        case "^": emit(makeToken(TokenType.Caret, "^", this.line, this.col)); this.advance(); continue;
        case "<": {
          if (this.src[this.pos + 1] === '=') {
            if (this.src[this.pos + 2] === '>') {
              emit(makeToken(TokenType.MapSchemaOp, "<=>", this.line, this.col)); this.advance(3); continue;
            }
            emit(makeToken(TokenType.LtEq, "<=", this.line, this.col)); this.advance(2); continue;
          }
          if (this.src[this.pos + 1] === '-') {
            if (this.src[this.pos + 2] === '>') {
              emit(makeToken(TokenType.MapSchemaOp, "<->", this.line, this.col)); this.advance(3); continue;
            }
          }
          if (this.src[this.pos + 1] === '<' && this.src[this.pos + 2] === '<') {
            // Json block <<< ... >>>
            const sc = this.col;
            const sl = this.line;
            this.advance(3);
            let jsonStr = "";
            while (!this.isEOF()) {
              if (this.current() === '>' && this.src[this.pos + 1] === '>' && this.src[this.pos + 2] === '>') {
                this.advance(3);
                emit(makeToken(TokenType.JsonString, jsonStr, sl, sc));
                break;
              }
              if (this.current() === '\n') { this.line++; this.col = 0; }
              jsonStr += this.current();
              this.advance();
            }
            if (this.isEOF() && jsonStr !== "") {
              throw new LexerError("Unterminated JSON block", sl, sc);
            }
            continue;
          }
          if (this.src[this.pos + 1] === '>') { emit(makeToken(TokenType.NotEq, "<>", this.line, this.col)); this.advance(2); continue; }
          emit(makeToken(TokenType.Lt, "<", this.line, this.col)); this.advance(); continue;
        }
        case ">": {
          if (this.src[this.pos + 1] === '=') { emit(makeToken(TokenType.GtEq, ">=", this.line, this.col)); this.advance(2); continue; }
          if (this.src[this.pos + 1] === '!') { emit(makeToken(TokenType.Print, ">!", this.line, this.col)); this.advance(2); continue; }
          emit(makeToken(TokenType.Gt, ">", this.line, this.col)); this.advance(); continue;
        }
        case "!": emit(makeToken(TokenType.Not, "!", this.line, this.col)); this.advance(); continue;
        case "(": emit(makeToken(TokenType.LParen, "(", this.line, this.col)); this.advance(); continue;
        case ")": emit(makeToken(TokenType.RParen, ")", this.line, this.col)); this.advance(); continue;
        case "[": emit(makeToken(TokenType.LBracket, "[", this.line, this.col)); this.advance(); continue;
        case "]": emit(makeToken(TokenType.RBracket, "]", this.line, this.col)); this.advance(); continue;
        case ",": {
          if (this.src[this.pos + 1] === ",") {
            emit(makeToken(TokenType.RangeSep, ",,", this.line, this.col)); this.advance(2);
          } else {
            emit(makeToken(TokenType.Comma, ",", this.line, this.col)); this.advance();
          }
          continue;
        }
        case "{": emit(makeToken(TokenType.LBrace, "{", this.line, this.col)); this.advance(); continue;
        case "}": emit(makeToken(TokenType.RBrace, "}", this.line, this.col)); this.advance(); continue;
        case ".": emit(makeToken(TokenType.Dot, ".", this.line, this.col)); this.advance(); continue;
        case "@": emit(this.readAtKeyword()); continue;
      }

      if (this.current() === '"') { emit(this.readString()); continue; }
      if (this.isDigit(ch)) { emit(this.readNumber()); continue; }
      if (this.isAlpha(ch)) { emit(this.readIdentifierOrKeyword()); continue; }

      // Unicode set operator symbols
      if (ch === '\u222A') { emit(makeToken(TokenType.SetUnion, '\u222A', this.line, this.col)); this.advance(); continue; } // ∪
      if (ch === '\u2229') { emit(makeToken(TokenType.SetIntersection, '\u2229', this.line, this.col)); this.advance(); continue; } // ∩
      if (ch === '\u2295') { emit(makeToken(TokenType.SetSymmetricDiff, '\u2295', this.line, this.col)); this.advance(); continue; } // ⊕
      if (ch === '\\') { emit(makeToken(TokenType.SetDifference, '\\', this.line, this.col)); this.advance(); continue; } // \

      throw new LexerError(`Unexpected character '${ch}'`, this.line, this.col);
    }

    const eof = makeToken(TokenType.EOF, "", this.line, this.col);
    tokens.push(eof);
    return tokens;
  }

  // ── Readers ──────────────────────────────────────────────────────────────────

  private readString(): Token {
    const startLine = this.line;
    const startCol = this.col;
    this.advance();
    let value = "";
    while (!this.isEOF() && this.current() !== '"') {
      if (this.current() === "\n") throw new LexerError("Unterminated string literal", startLine, startCol);
      if (this.current() === "\\") {
        this.advance();
        if (this.isEOF()) throw new LexerError("Unterminated string literal", startLine, startCol);
        const escapeChar = this.current();
        switch (escapeChar) {
          case 'n': value += '\n'; this.advance(); break;
          case 't': value += '\t'; this.advance(); break;
          case 'r': value += '\r'; this.advance(); break;
          case '"': value += '"'; this.advance(); break;
          case '\\': value += '\\'; this.advance(); break;
          case 'x': {
            this.advance();
            const hex = this.peek(2);
            if (!/^[0-9a-fA-F]{2}$/.test(hex)) {
              throw new LexerError(`Invalid hex escape sequence '\\x${hex}'`, this.line, this.col);
            }
            value += String.fromCharCode(parseInt(hex, 16));
            this.advance(2);
            break;
          }
          default:
            if (this.isDigit(escapeChar) && this.src[this.pos + 1] !== undefined && this.isDigit(this.src[this.pos + 1]!) && this.src[this.pos + 2] !== undefined && this.isDigit(this.src[this.pos + 2]!)) {
              const octal = this.peek(3);
              if (!/^[0-7]{3}$/.test(octal)) {
                throw new LexerError(`Invalid octal escape sequence '\\${octal}'`, this.line, this.col);
              }
              const num = parseInt(octal, 8);
              if (num > 255) throw new LexerError(`Octal escape sequence '\\${octal}' out of bounds`, this.line, this.col);
              value += String.fromCharCode(num);
              this.advance(3);
            } else {
              throw new LexerError(`Unknown escape sequence '\\${escapeChar}'`, this.line, this.col);
            }
        }
      } else {
        value += this.current();
        this.advance();
      }
    }
    if (this.isEOF()) throw new LexerError("Unterminated string literal", startLine, startCol);
    this.advance();
    return makeToken(TokenType.String, value, startLine, startCol);
  }

  private readJsonBlock(): Token {
    const startLine = this.line;
    const startCol = this.col;
    this.advance(3); // skip <<<
    let value = "";
    while (!this.isEOF() && !this.matchSeq3(">", ">", ">")) {
      if (this.current() === "\n") { this.line++; this.col = 0; }
      value += this.current();
      this.advance();
    }
    if (this.isEOF()) throw new LexerError("Unterminated raw JSON block (<<< ... >>>)", startLine, startCol);
    this.advance(3); // skip >>>
    return makeToken(TokenType.JsonString, value, startLine, startCol);
  }

  private readNumber(): Token {
    const startLine = this.line;
    const startCol = this.col;
    let raw = "";
    let isFloat = false;
    while (!this.isEOF() && (this.isDigit(this.current()) || this.current() === ".")) {
      if (this.current() === ".") {
        if (isFloat) break;
        isFloat = true;
      }
      raw += this.current();
      this.advance();
    }
    return makeToken(isFloat ? TokenType.Float : TokenType.Integer, raw, startLine, startCol);
  }

  private readAtKeyword(): Token {
    const startLine = this.line;
    const startCol = this.col;
    this.advance(); // skip '@'
    let raw = "@";
    while (!this.isEOF() && (this.isAlphaNumeric(this.current()) || this.current() === "_")) {
      raw += this.current();
      this.advance();
    }
    if (raw === "@step") {
      return makeToken(TokenType.Step, raw, startLine, startCol);
    }
    if (raw === "@wait") {
      return makeToken(TokenType.Wait, raw, startLine, startCol);
    }
    if (raw === "@auto") {
      return makeToken(TokenType.Auto, raw, startLine, startCol);
    }
    throw new LexerError(`Unknown @ keyword '${raw}'`, startLine, startCol);
  }

  /**
   * Context-sensitive type keywords:
   *   - word followed by ':'  → TypeXxx  (variable / param declaration)
   *   - word preceded by '->' → TypeXxx  (function return-type annotation)
   *   - everywhere else       → Identifier
   *
   * "date" is also a type keyword (TypeDate) in the same contexts.
   * In expression position ("date.now()", "date(...)") it stays Identifier.
   *
   * Special words (array, const, from, …) are always keywords.
   */
  private readIdentifierOrKeyword(): Token {
    const startLine = this.line;
    const startCol = this.col;
    let raw = "";
    while (!this.isEOF() && (this.isAlphaNumeric(this.current()) || this.current() === "_")) {
      raw += this.current();
      this.advance();
    }

    // Hard word keywords (if, then, func, return, AND, OR, from, …) — always keyword
    const wordKw = WORD_KEYWORDS.get(raw);
    if (wordKw !== undefined) return makeToken(wordKw, raw, startLine, startCol);

    // Boolean literals
    if (BOOLEAN_LITERALS.has(raw)) return makeToken(TokenType.Boolean, raw, startLine, startCol);

    // Type keywords — context-sensitive
    if (TYPE_KEYWORD_STRINGS.has(raw)) {
      // Case 1: preceded by '->'  →  return-type position
      if (this.lastEmitted !== null && this.lastEmitted.type === TokenType.Arrow) {
        return makeToken(TYPE_KEYWORD_MAP.get(raw)!, raw, startLine, startCol);
      }

      // Case 2: followed by ':'  →  declaration position
      const savedPos = this.pos;
      const savedLine = this.line;
      const savedCol = this.col;
      this.skipWhitespace();
      const nextCh = this.current();
      this.pos = savedPos;
      this.line = savedLine;
      this.col = savedCol;

      if (nextCh === ":") {
        return makeToken(TYPE_KEYWORD_MAP.get(raw)!, raw, startLine, startCol);
      }

      // Everywhere else → plain identifier  (e.g. "date" in "date.now()", "random" etc.)
      return makeToken(TokenType.Identifier, raw, startLine, startCol);
    }

    return makeToken(TokenType.Identifier, raw, startLine, startCol);
  }

  // ── Comment skippers ─────────────────────────────────────────────────────────

  private skipLineComment(): void {
    while (!this.isEOF() && this.current() !== "\n") this.advance();
  }

  private skipBlockComment(): void {
    const startLine = this.line;
    this.advance(3);
    while (!this.isEOF()) {
      if (this.src[this.pos] === "*" && this.src[this.pos + 1] === "-" && this.src[this.pos + 2] === "-" && this.src[this.pos + 3] === "-") { this.advance(4); return; }
      if (this.current() === "\n") { this.line++; this.col = 0; }
      this.advance();
    }
    throw new LexerError("Unterminated block comment", startLine, 1);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private skipWhitespace(): void {
    while (!this.isEOF()) {
      const ch = this.current();
      if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
        if (ch === "\n") { this.line++; this.col = 0; }
        this.advance();
      } else {
        break;
      }
    }
  }

  private current(): string { return this.src[this.pos] ?? ""; }
  private peek(len: number): string { return this.src.slice(this.pos, this.pos + len); }
  private advance(n = 1): void { this.pos += n; this.col += n; }
  private isEOF(): boolean { return this.pos >= this.src.length; }
  private isDigit(ch: string): boolean { return ch >= "0" && ch <= "9"; }
  private isAlpha(ch: string): boolean {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
  }
  private isAlphaNumeric(ch: string): boolean {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch === '_';
  }
}