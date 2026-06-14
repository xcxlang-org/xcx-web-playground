import { TokenType } from "../../lexer/token";
import type { Parser } from "../parser";
import {
    ASTNode,
    BinaryOp,
    UnaryOp,
    IdentifierNode,
    PerfNode,
    ArrayMethodName,
    StringMethodName,
    DateProperty,
    StringProperty,
    GenericMethodCallNode,
    DatePropertyNode,
    StringPropertyNode,
    DateFormatNode,
    ArrayMethodCallNode,
    StringMethodCallNode,
    PropertyAccessNode,
    JsonLiteralNode,
    JsonParseNode,
    CallExprNode
} from "../ast";
import { ParseError } from "../../errors/errors";
import {
    DATE_PROPERTIES,
    STRING_PROPERTIES,
    SHARED_METHODS,
    TABLE_METHODS,
    JSON_METHODS,
    ARRAY_METHODS,
    STRING_METHODS,
    CMP_TYPES
} from "../constants";

export function parseExpr(p: Parser): ASTNode {
    // Check for lambda: `id -> expr`
    if (p.current().type === TokenType.Identifier && p.peek(1).type === TokenType.Arrow) {
        const param = p.consume().value;
        const arrowLine = p.consume().line;
        const body = p.parseExpr();
        return { kind: "Lambda", params: [param], body, line: arrowLine };
    }

    // Check for `(id1, id2) -> expr`
    if (p.current().type === TokenType.LParen) {
        let isLambda = false;
        let offset = 1;
        let depth = 1;
        while (p.peek(offset).type !== TokenType.EOF) {
            if (p.peek(offset).type === TokenType.LParen) depth++;
            if (p.peek(offset).type === TokenType.RParen) depth--;
            if (depth === 0) {
                if (p.peek(offset + 1).type === TokenType.Arrow) {
                    isLambda = true;
                }
                break;
            }
            offset++;
        }
        if (isLambda) {
            p.consume(); // (
            const params: string[] = [];
            if (p.current().type !== TokenType.RParen) {
                while (true) {
                    params.push(p.expect(TokenType.Identifier, "lambda param").value);
                    if (p.current().type === TokenType.Comma) {
                        p.consume();
                        if (p.current().type === TokenType.RParen) break;
                    } else {
                        break;
                    }
                }
            }
            p.expect(TokenType.RParen, "')'");
            const arrowLine = p.expect(TokenType.Arrow, "'->'").line;
            const body = p.parseExpr();
            return { kind: "Lambda", params, body, line: arrowLine };
        }
    }

    return p.parseOr();
}

export function parseOr(p: Parser): ASTNode {
    let left = p.parseAnd();
    while (p.current().type === TokenType.Or) {
        const op = p.consume().value as BinaryOp;
        left = { kind: "BinaryExpr", operator: op, left, right: p.parseAnd(), line: p.current().line };
    }
    return left;
}

export function parseAnd(p: Parser): ASTNode {
    let left = p.parseEquality();
    while (p.current().type === TokenType.And) {
        const op = p.consume().value as BinaryOp;
        left = { kind: "BinaryExpr", operator: op, left, right: p.parseEquality(), line: p.current().line };
    }
    return left;
}

export function parseEquality(p: Parser): ASTNode {
    let left = p.parseComparison();
    while (p.current().type === TokenType.EqEq || p.current().type === TokenType.NotEq) {
        const opTok = p.consume();
        left = { kind: "BinaryExpr", operator: opTok.value as BinaryOp, left, right: p.parseComparison(), line: opTok.line };
    }
    return left;
}

export function parseComparison(p: Parser): ASTNode {
    let left = p.parseAdditive();
    while (CMP_TYPES.has(p.current().type)) {
        const opTok = p.consume();
        left = { kind: "BinaryExpr", operator: opTok.value as BinaryOp, left, right: p.parseAdditive(), line: opTok.line };
    }
    return left;
}

export function parseAdditive(p: Parser): ASTNode {
    let left = p.parseConcatenation();
    while (
        p.current().type === TokenType.Plus ||
        p.current().type === TokenType.Minus
    ) {
        const opTok = p.consume();
        left = { kind: "BinaryExpr", operator: opTok.value as BinaryOp, left, right: p.parseConcatenation(), line: opTok.line };
    }
    return left;
}

export function parseConcatenation(p: Parser): ASTNode {
    let left = p.parseMultiplicative();
    while (p.current().type === TokenType.PlusPlus) {
        const opTok = p.consume();
        left = { kind: "BinaryExpr", operator: opTok.value as BinaryOp, left, right: p.parseMultiplicative(), line: opTok.line };
    }
    return left;
}



export function parseMultiplicative(p: Parser): ASTNode {
    let left = p.parseExponent();
    while (
        p.current().type === TokenType.Star ||
        p.current().type === TokenType.Slash ||
        p.current().type === TokenType.Percent
    ) {
        const opTok = p.consume();
        left = { kind: "BinaryExpr", operator: opTok.value as BinaryOp, left, right: p.parseExponent(), line: opTok.line };
    }
    return left;
}

export function parseExponent(p: Parser): ASTNode {
    let left = p.parseUnary();
    if (p.current().type === TokenType.Caret) {
        const opTok = p.consume();
        const right = p.parseExponent();
        return { kind: "BinaryExpr", operator: "^", left, right, line: opTok.line };
    }
    return left;
}

export function parseUnary(p: Parser): ASTNode {
    if (p.current().type === TokenType.Minus) {
        const opTok = p.consume();
        return { kind: "UnaryExpr", operator: "-" as UnaryOp, operand: p.parseUnary(), line: opTok.line };
    }
    if (p.current().type === TokenType.Not) {
        const opTok = p.consume();
        return { kind: "UnaryExpr", operator: "!" as UnaryOp, operand: p.parseUnary(), line: opTok.line };
    }
    if (p.current().type === TokenType.NotNot) {
        const opTok = p.consume();
        return { kind: "UnaryExpr", operator: "!!" as UnaryOp, operand: p.parseUnary(), line: opTok.line };
    }
    return p.parsePrimary();
}

export function parsePrimary(p: Parser): ASTNode {
    const tok = p.current();
    let node: ASTNode;

    if (tok.type === TokenType.Integer) { p.consume(); node = { kind: "Literal", value: parseInt(tok.value, 10), literalType: "int", line: tok.line }; }
    else if (tok.type === TokenType.Float) { p.consume(); node = { kind: "Literal", value: parseFloat(tok.value), literalType: "float", line: tok.line }; }
    else if (tok.type === TokenType.String) { p.consume(); node = { kind: "Literal", value: tok.value, literalType: "str", line: tok.line }; }
    else if (tok.type === TokenType.Boolean) { p.consume(); node = { kind: "Literal", value: tok.value === "true", literalType: "bool", line: tok.line }; }

    // ── date.now()  or  date("...") ──────────────────────────────────────────
    else if (tok.type === TokenType.Identifier && tok.value === "date") {
        node = p.parseDateExpr();
    }

    // ── perf.ms() / perf.us() / perf.ns() ────────────────────────────────────
    else if (tok.type === TokenType.Identifier && tok.value === "perf") {
        node = p.parsePerfExpr();
    }

    // ── random.int / random.float / random.choice ──────────────────────────
    else if (tok.type === TokenType.Identifier && tok.value === "random") {
        node = p.parseRandomExpr();
    }

    // input methods
    else if (tok.type === TokenType.Identifier && tok.value === "input") {
        node = p.parseInputExpr();
    }

    // json parsing methods
    else if (tok.type === TokenType.Identifier && tok.value === "json") {
        node = p.parseJsonExpr();
    }

    // json raw block
    else if (tok.type === TokenType.JsonString) {
        p.consume();
        node = { kind: "JsonLiteral", value: tok.value, line: tok.line } as JsonLiteralNode;
    }

    // ── function call ────────────────────────────────────────────────────────
    else if (tok.type === TokenType.Identifier && p.peek().type === TokenType.LParen) {
        node = p.parseCallExpr();
    }

    else if (tok.type === TokenType.Identifier) { p.consume(); node = { kind: "Identifier", name: tok.value, line: tok.line }; }

    else if (tok.type === TokenType.LParen) {
        p.consume();
        node = p.parseExpr();
        p.expect(TokenType.RParen, "')'");
    } else {
        throw new ParseError(`Expected expression, got '${tok.value}'`, tok.line, tok.col);
    }

    while (!p.isEOF() && (p.current().type === TokenType.Dot || p.current().type === TokenType.LBracket)) {
        if (p.current().type === TokenType.LBracket) {
            p.consume();
            const indexExpr = p.parseExpr();
            const closing = p.expect(TokenType.RBracket, "']'");
            node = { kind: "GenericMethodCall", object: node, method: "get", args: [indexExpr], line: closing.line } as GenericMethodCallNode;
            continue;
        }

        const dotTok = p.consume();
        const memberTok = p.expect(TokenType.Identifier, "property or method name");

        if (DATE_PROPERTIES.has(memberTok.value)) {
            node = { kind: "DateProperty", object: node, property: memberTok.value as DateProperty, line: dotTok.line } as DatePropertyNode;
            continue;
        }
        if (STRING_PROPERTIES.has(memberTok.value)) {
            node = { kind: "StringProperty", object: node, property: memberTok.value as StringProperty, line: dotTok.line } as StringPropertyNode;
            continue;
        }

        if (p.current().type === TokenType.LParen) {
            p.consume();
            const args: ASTNode[] = [];
            if (p.current().type !== TokenType.RParen) {
                while (!p.isEOF() && p.current().type !== TokenType.RParen) {
                    args.push(p.parseExpr());
                    if (p.current().type === TokenType.Comma) {
                        p.consume();
                        if (p.current().type === TokenType.RParen) break;
                    }
                }
            }
            p.expect(TokenType.RParen, "')'");

            if (memberTok.value === "format") {
                const fmtStr = args.length > 0 ? args[0] : null;
                node = { kind: "DateFormat", object: node, formatStr: fmtStr, line: dotTok.line } as DateFormatNode;
                continue;
            }
            if (SHARED_METHODS.has(memberTok.value) || TABLE_METHODS.has(memberTok.value) || JSON_METHODS.has(memberTok.value)) {
                node = { kind: "GenericMethodCall", object: node, method: memberTok.value, args, line: dotTok.line } as GenericMethodCallNode;
                continue;
            }
            if (ARRAY_METHODS.has(memberTok.value)) {
                if (node.kind !== "Identifier") throw new ParseError(`Array method '${memberTok.value}' can only be called on identifier`, memberTok.line, memberTok.col);
                node = { kind: "ArrayMethodCall", arrayName: (node as IdentifierNode).name, method: memberTok.value as ArrayMethodName, args, line: dotTok.line } as ArrayMethodCallNode;
                continue;
            }
            if (STRING_METHODS.has(memberTok.value)) {
                node = { kind: "StringMethodCall", object: node, method: memberTok.value as StringMethodName, args, line: dotTok.line } as StringMethodCallNode;
                continue;
            }
            // Unknown method name — fall through to GenericMethodCall.
            // Runtime dispatch (evalGenericMethodCall) will validate the object kind
            // and handle namespace method calls (e.g. m.sqrt_f(...)).
            node = { kind: "GenericMethodCall", object: node, method: memberTok.value, args, line: dotTok.line } as GenericMethodCallNode;
        } else {
            node = { kind: "PropertyAccess", object: node, property: memberTok.value, line: dotTok.line } as PropertyAccessNode;
            continue;
        }
    }

    return node;
}

export function parseDateExpr(p: Parser): ASTNode {
    const dateTok = p.consume(); // date
    if (p.current().type === TokenType.Dot) {
        p.consume(); // .
        p.expect(TokenType.Identifier, "'now' after 'date.'");
        p.expect(TokenType.LParen, "'(' after 'now'");
        p.expect(TokenType.RParen, "')' after 'now('");
        return { kind: "DateNow", line: dateTok.line };
    } else if (p.current().type === TokenType.LParen) {
        p.consume(); // (
        const arg1 = p.parseExpr();
        let formatArg: ASTNode | null = null;
        if (p.current().type === TokenType.Comma) {
            p.consume(); // ,
            formatArg = p.parseExpr();
        }
        p.expect(TokenType.RParen, "')' to close date constructor");
        return { kind: "DateConstructor", dateStr: arg1, format: formatArg, line: dateTok.line };
    } else {
        throw new ParseError("Expected '.' or '(' after date identifier", dateTok.line, dateTok.col);
    }
}

export function parsePerfExpr(p: Parser): ASTNode {
    const perfTok = p.consume(); // perf
    p.expect(TokenType.Dot, "'.' after perf");
    const methodTok = p.expect(TokenType.Identifier, "perf method ('ms', 'us', 'ns')");
    p.expect(TokenType.LParen, "'('");
    p.expect(TokenType.RParen, "')'");

    if (methodTok.value === "ms" || methodTok.value === "us" || methodTok.value === "ns") {
        return { kind: "Perf", method: methodTok.value, line: perfTok.line } as PerfNode;
    } else {
        throw new ParseError(`Unknown perf method '${methodTok.value}'`, methodTok.line, methodTok.col);
    }
}

export function parseRandomExpr(p: Parser): ASTNode {
    const randTok = p.consume(); // random
    p.expect(TokenType.Dot, "'.' after random");
    const method = p.expect(TokenType.Identifier, "random method ('int', 'float', 'choice')");

    if (method.value === "choice") {
        p.expect(TokenType.From, "'from' required for random.choice");
        const arrTok = p.expect(TokenType.Identifier, "array name for random.choice from");
        return { kind: "RandomChoice", arrayName: arrTok.value, line: randTok.line };
    }

    p.expect(TokenType.LParen, "'(' after random method");
    const min = p.parseExpr();
    p.expect(TokenType.Comma, "',' separating random range");
    const max = p.parseExpr();

    let step: ASTNode | null = null;
    if (p.current().type === TokenType.Step) {
        p.consume();
        step = p.parseExpr();
    }

    p.expect(TokenType.RParen, "')' after random params");

    if (method.value === "int") {
        return { kind: "RandomInt", min, max, step, line: randTok.line };
    } else if (method.value === "float") {
        return { kind: "RandomFloat", min, max, step, line: randTok.line };
    } else {
        throw new ParseError(`Unknown random method '${method.value}'`, method.line, method.col);
    }
}

export function parseInputExpr(p: Parser): ASTNode {
    const inputTok = p.consume(); // 'input'
    p.expect(TokenType.Dot, "'.' after input");
    const methodTok = p.expect(TokenType.Identifier, "input method ('key' or 'ready')");

    if (methodTok.value === "key") {
        p.expect(TokenType.LParen, "'('");
        p.expect(TokenType.RParen, "')'");

        let wait = false;
        if (p.current().type === TokenType.Wait) {
            p.consume();
            wait = true;
        }
        return { kind: "InputKey", wait, line: inputTok.line } as any;
    } else if (methodTok.value === "ready") {
        p.expect(TokenType.LParen, "'('");
        p.expect(TokenType.RParen, "')'");
        return { kind: "InputReady", line: inputTok.line } as any;
    } else {
        throw new ParseError(`Unknown input method '${methodTok.value}'`, methodTok.line, methodTok.col);
    }
}

export function parseJsonExpr(p: Parser): ASTNode {
    const line = p.current().line;
    p.consume(); // json
    p.expect(TokenType.Dot, "'.' after json");
    const methodTok = p.expect(TokenType.Identifier, "json parse method");
    p.expect(TokenType.LParen, "'('");

    if (methodTok.value === "parse") {
        const expr = p.parseExpr();
        p.expect(TokenType.RParen, "')'");
        return { kind: "JsonParse", expr, line } as JsonParseNode;
    } else {
        throw new ParseError(`Unknown json method '${methodTok.value}'`, methodTok.line, methodTok.col);
    }
}

export function parseCallExpr(p: Parser): CallExprNode {
    const nameTok = p.consume();
    p.expect(TokenType.LParen, "'('");
    const args: ASTNode[] = [];
    while (p.current().type !== TokenType.RParen && !p.isEOF()) {
        args.push(p.parseExpr());
        if (p.current().type === TokenType.Comma) {
            p.consume();
            if (p.current().type === TokenType.RParen) break;
        }
    }
    p.expect(TokenType.RParen, "')'");
    return { kind: "CallExpr", callee: nameTok.value, args, line: nameTok.line };
}
