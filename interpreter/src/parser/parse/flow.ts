import { TokenType } from "../../lexer/token";
import type { Parser } from "../parser";
import {
    ASTNode,
    IfNode,
    IfBranch,
    BreakNode,
    ContinueNode,
    WhileNode,
    ForNode,
    FuncDeclarationNode,
    FuncParam,
    ReturnNode,
    PrintNode,
    InputNode,
    WaitNode,
    TerminalCommandNode,
    TerminalCommandType,
    XcxType,
    IncludeNode
} from "../ast";
import { ParseError } from "../../errors/errors";
import {
    TOKEN_TO_XCXTYPE
} from "../constants";

export function parseIf(p: Parser): IfNode {
    const ifTok = p.consume();
    p.expect(TokenType.LParen, "'('");
    const ifCond = p.parseExpr();
    p.expect(TokenType.RParen, "')'");
    p.expect(TokenType.Then, "'then'");
    p.expect(TokenType.Semicolon, "';'");

    const ifBody = p.parseBlock();
    const elseifBranches: IfBranch[] = [];
    let elseBranch: ASTNode[] | null = null;

    while (p.current().type === TokenType.Elseif) {
        p.consume();
        p.expect(TokenType.LParen, "'('");
        const cond = p.parseExpr();
        p.expect(TokenType.RParen, "')'");
        p.expect(TokenType.Then, "'then'");
        p.expect(TokenType.Semicolon, "';'");
        elseifBranches.push({ condition: cond, body: p.parseBlock() });
    }

    if (p.current().type === TokenType.Else) {
        p.consume();
        p.expect(TokenType.Semicolon, "';'");
        elseBranch = p.parseBlock();
    }

    p.expect(TokenType.End, "'end'");
    p.expect(TokenType.Semicolon, "';'");

    return { kind: "If", ifBranch: { condition: ifCond, body: ifBody }, elseifBranches, elseBranch, line: ifTok.line };
}

export function parseBlock(p: Parser): ASTNode[] {
    const body: ASTNode[] = [];
    while (
        !p.isEOF() &&
        p.current().type !== TokenType.End &&
        p.current().type !== TokenType.Else &&
        p.current().type !== TokenType.Elseif
    ) {
        body.push(p.parseStatement());
    }
    return body;
}

export function parseBreak(p: Parser): BreakNode {
    const tok = p.consume();
    p.expect(TokenType.Semicolon, "';'");
    return { kind: "Break", line: tok.line };
}

export function parseContinue(p: Parser): ContinueNode {
    const tok = p.consume();
    p.expect(TokenType.Semicolon, "';'");
    return { kind: "Continue", line: tok.line };
}

export function parseWhile(p: Parser): WhileNode {
    const whileTok = p.consume();
    p.expect(TokenType.LParen, "'('");
    const condition = p.parseExpr();
    p.expect(TokenType.RParen, "')'");
    p.expect(TokenType.Do, "'do'");
    p.expect(TokenType.Semicolon, "';'");
    const body = p.parseBlock();
    p.expect(TokenType.End, "'end'");
    p.expect(TokenType.Semicolon, "';'");
    return { kind: "While", condition, body, line: whileTok.line };
}

export function parseFor(p: Parser): ForNode {
    const forTok = p.consume();
    const varTok = p.expect(TokenType.Identifier, "variable name");
    p.expect(TokenType.In, "'in'");
    const startOrColl = p.parseExpr();

    if (p.current().type === TokenType.To) {
        p.consume();
        const end = p.parseExpr();

        let step: ASTNode | null = null;
        if (p.current().type === TokenType.Step) {
            p.consume();
            step = p.parseExpr();
        }

        p.expect(TokenType.Do, "'do'");
        p.expect(TokenType.Semicolon, "';'");
        const body = p.parseBlock();
        p.expect(TokenType.End, "'end'");
        p.expect(TokenType.Semicolon, "';'");
        return { kind: "For", varName: varTok.value, start: startOrColl, end, step, body, line: forTok.line };
    } else {
        p.expect(TokenType.Do, "'do'");
        p.expect(TokenType.Semicolon, "';'");
        const body = p.parseBlock();
        p.expect(TokenType.End, "'end'");
        p.expect(TokenType.Semicolon, "';'");
        return { kind: "For", varName: varTok.value, collection: startOrColl, body, line: forTok.line };
    }
}

export function parseFuncDeclaration(p: Parser): FuncDeclarationNode {
    const funcTok = p.consume();
    const nameTok = p.expect(TokenType.Identifier, "function name");
    p.expect(TokenType.LParen, "'('");

    const params: FuncParam[] = [];
    let returnType: XcxType | null = null;

    while (p.current().type !== TokenType.RParen && !p.isEOF()) {
        if (p.current().type === TokenType.Arrow) {
            p.consume();
            const retTypeTok = p.current();
            if (!TOKEN_TO_XCXTYPE.has(retTypeTok.type)) {
                throw new ParseError(`Expected return type after '->'`, retTypeTok.line, retTypeTok.col);
            }
            returnType = TOKEN_TO_XCXTYPE.get(p.consume().type) as XcxType;
            break;
        }

        const paramTypeTok = p.current();

        // Handle array:T: paramName syntax
        if (paramTypeTok.type === TokenType.Array) {
            p.consume(); // consume 'array'
            p.expect(TokenType.Colon, "':' after 'array'");
            const elemTypeTok = p.current();
            if (!TOKEN_TO_XCXTYPE.has(elemTypeTok.type)) {
                throw new ParseError(`Expected element type after 'array:', got '${elemTypeTok.value}'`, elemTypeTok.line, elemTypeTok.col);
            }
            p.consume(); // consume element type
            p.expect(TokenType.Colon, "':' after element type");
            const paramName = p.expect(TokenType.Identifier, "parameter name");
            // Store as "array" type — the interpreter handles array args by kind
            params.push({ paramType: "array", name: paramName.value });
        } else {
            if (!TOKEN_TO_XCXTYPE.has(paramTypeTok.type)) {
                throw new ParseError(`Expected parameter type, got '${paramTypeTok.value}'`, paramTypeTok.line, paramTypeTok.col);
            }
            const paramType = TOKEN_TO_XCXTYPE.get(p.consume().type) as XcxType;
            p.expect(TokenType.Colon, "':'");
            const paramName = p.expect(TokenType.Identifier, "parameter name");
            params.push({ paramType, name: paramName.value });
        }

        if (p.current().type === TokenType.Comma) {
            p.consume();
            if (p.current().type === TokenType.RParen) break;
        }
    }

    p.expect(TokenType.RParen, "')'");
    p.expect(TokenType.LBrace, "'{'");
    const body = p.parseFuncBody();
    p.expect(TokenType.RBrace, "'}'");
    p.expect(TokenType.Semicolon, "';'");

    return { kind: "FuncDeclaration", name: nameTok.value, params, returnType, body, line: funcTok.line };
}

export function parseFuncBody(p: Parser): ASTNode[] {
    const body: ASTNode[] = [];
    while (!p.isEOF() && p.current().type !== TokenType.RBrace) {
        body.push(p.parseStatement());
    }
    return body;
}

export function parseReturn(p: Parser): ReturnNode {
    const tok = p.consume();
    if (p.current().type === TokenType.Semicolon) {
        p.consume();
        return { kind: "Return", value: null, line: tok.line };
    }
    const value = p.parseExpr();
    p.expect(TokenType.Semicolon, "';'");
    return { kind: "Return", value, line: tok.line };
}

export function parsePrint(p: Parser): PrintNode {
    const tok = p.consume();
    const value = p.parseExpr();
    p.expect(TokenType.Semicolon, "';'");
    return { kind: "Print", value, line: tok.line };
}

export function parseInput(p: Parser): InputNode {
    const inputTok = p.consume();
    const targetTok = p.expect(TokenType.Identifier, "input target variable");
    p.expect(TokenType.Semicolon, "';'");
    return { kind: "Input", name: targetTok.value, line: inputTok.line };
}

export function parseWait(p: Parser): WaitNode {
    const waitTok = p.consume();
    const msExpr = p.parseExpr();
    p.expect(TokenType.Semicolon, "';'");
    return { kind: "Wait", ms: msExpr, line: waitTok.line };
}

export function parseTerminalCommand(p: Parser): TerminalCommandNode {
    const dotTok = p.consume(); // .
    p.expect(TokenType.Identifier, "'terminal'"); // terminal
    p.expect(TokenType.Not, "'!'"); // !

    const cmdTok = p.expect(TokenType.Identifier, "terminal command");
    const cmdStr = cmdTok.value;

    let command: TerminalCommandType = "clear";
    let args: ASTNode[] = [];

    if (cmdStr === "clear") command = "clear";
    else if (cmdStr === "exit") command = "exit";
    else if (cmdStr === "run") {
        command = "run";
        args.push(p.parseExpr());
    }
    else if (cmdStr === "raw") command = "raw";
    else if (cmdStr === "normal") command = "normal";
    else if (cmdStr === "cursor") {
        const modeTok = p.expect(TokenType.Identifier, "cursor mode ('on' or 'off')");
        if (modeTok.value === "on") command = "cursor_on";
        else if (modeTok.value === "off") command = "cursor_off";
        else throw new ParseError(`Expected 'on' or 'off' after cursor directive`, modeTok.line, modeTok.col);
    }
    else if (cmdStr === "move") {
        command = "move";
        args.push(p.parseExpr());
        args.push(p.parseExpr());
    }
    else if (cmdStr === "write") {
        command = "write";
        args.push(p.parseExpr());
    }
    else {
        throw new ParseError(`Unknown terminal command '${cmdStr}'`, cmdTok.line, cmdTok.col);
    }

    p.expect(TokenType.Semicolon, "';' after terminal command");
    return { kind: "TerminalCommand", command, args, line: dotTok.line };
}

export function parseInclude(p: Parser): IncludeNode {
    const tok = p.consume(); // include
    const pathTok = p.expect(TokenType.String, "file path string after 'include'");
    // strip surrounding quotes from the lexed string literal
    const rawPath = pathTok.value;

    let alias: string | null = null;
    if (p.current().type === TokenType.As) {
        p.consume(); // as
        const aliasTok = p.expect(TokenType.Identifier, "alias name after 'as'");
        alias = aliasTok.value;
    }

    p.expect(TokenType.Semicolon, "';' after include statement");
    return { kind: "Include", path: rawPath, alias, line: tok.line };
}
