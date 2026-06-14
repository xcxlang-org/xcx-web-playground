import { TokenType, Token } from "../../lexer/token";
import type { Parser } from "../parser";
import {
    ASTNode,
    VarDeclarationNode,
    ConstDeclarationNode,
    ArrayDeclarationNode,
    TableDeclarationNode,
    MapDeclarationNode,
    MapEntry,
    VarAssignNode,
    XcxType,
    SetDeclarationNode,
    SetDomain,
    SetInitElement,
    SetOperator,
    SetBinaryExprNode,
    JsonLiteralNode
} from "../ast";
import { ParseError } from "../../errors/errors";
import {
    TOKEN_TO_XCXTYPE,
    TYPE_KEYWORD_MAP
} from "../constants";

export function parseConstDeclaration(p: Parser): ConstDeclarationNode {
    const constTok = p.consume(); // const
    const typeTok = p.current();
    let type: XcxType = "int";

    if (TOKEN_TO_XCXTYPE.has(typeTok.type)) {
        p.consume();
        type = TOKEN_TO_XCXTYPE.get(typeTok.type)!;
    } else {
        throw new ParseError(`Expected valid type for const variable, got '${typeTok.value}'`, typeTok.line, typeTok.col);
    }

    p.expect(TokenType.Colon, "':'");
    const nameTok = p.expect(TokenType.Identifier, "const variable name");
    p.expect(TokenType.Assign, "'='");
    const value = p.parseExpr();
    p.expect(TokenType.Semicolon, "';'");

    return { kind: "ConstDeclaration", name: nameTok.value, varType: type, value, line: constTok.line };
}

export function parseVarDeclaration(p: Parser): VarDeclarationNode {
    const typeTok = p.current();
    let type: XcxType = "int";

    if (TOKEN_TO_XCXTYPE.has(typeTok.type)) {
        p.consume();
        type = TOKEN_TO_XCXTYPE.get(typeTok.type)!;
    } else if (typeTok.type === TokenType.TypeJson) {
        p.consume();
        type = "json";
    } else {
        throw new ParseError(`Expected valid type for variable, got '${typeTok.value}'`, typeTok.line, typeTok.col);
    }

    p.expect(TokenType.Colon, "':'");
    const nameTok = p.expect(TokenType.Identifier, "variable name");

    let value: ASTNode | null = null;
    if (p.current().type === TokenType.Assign) {
        p.consume(); // '='
        value = p.parseExpr();
    } else if (p.current().type === TokenType.JsonString) {
        const jsonTok = p.consume();
        value = { kind: "JsonLiteral", value: jsonTok.value, line: jsonTok.line } as JsonLiteralNode;
    }
    p.expect(TokenType.Semicolon, "';'");

    return { kind: "VarDeclaration", name: nameTok.value, varType: type, value, line: typeTok.line };
}

export function parseVarAssign(p: Parser): VarAssignNode {
    const nameTok = p.expect(TokenType.Identifier, "variable name for assignment");
    p.expect(TokenType.Assign, "'='");
    const value = p.parseExpr();
    p.expect(TokenType.Semicolon, "';'");
    return { kind: "VarAssign", name: nameTok.value, value, line: nameTok.line };
}

export function parseArrayDeclaration(p: Parser): ArrayDeclarationNode {
    const arrayTok = p.consume(); // array
    p.expect(TokenType.Colon, "':'");

    const elemTypeTok = p.current();
    let elemType: XcxType = "int";
    if (TOKEN_TO_XCXTYPE.has(elemTypeTok.type)) {
        p.consume();
        elemType = TOKEN_TO_XCXTYPE.get(elemTypeTok.type)!;
    } else {
        throw new ParseError(`Expected valid type for array elements, got '${elemTypeTok.value}'`, elemTypeTok.line, elemTypeTok.col);
    }

    p.expect(TokenType.Colon, "':'");
    const nameTok = p.expect(TokenType.Identifier, "array name");

    let elements: ASTNode[] = [];
    let value: ASTNode | null = null;

    if (p.current().type === TokenType.Assign) {
        p.consume(); // '='
        if (p.current().type !== TokenType.LBrace) {
            value = p.parseExpr();
            p.expect(TokenType.Semicolon, "';'");
            return { kind: "ArrayDeclaration", name: nameTok.value, elementType: elemType, elements, value, line: arrayTok.line };
        }
    }

    if (p.current().type === TokenType.Semicolon) {
        p.consume(); // ';'
    } else {
        p.expect(TokenType.LBrace, "'{'");
        if (p.current().type !== TokenType.RBrace) {
            while (!p.isEOF() && p.current().type !== TokenType.RBrace) {
                elements.push(p.parseExpr());
                if (p.current().type === TokenType.Comma) {
                    p.consume();
                    if (p.current().type === TokenType.RBrace) break;
                }
            }
        }
        p.expect(TokenType.RBrace, "'}'");
        p.expect(TokenType.Semicolon, "';'");
    }

    return { kind: "ArrayDeclaration", name: nameTok.value, elementType: elemType, elements, value, line: arrayTok.line };
}

export function parseTableDeclaration(p: Parser): TableDeclarationNode {
    p.consume(); // table
    p.expect(TokenType.Colon, "':'");
    const nameTok = p.expect(TokenType.Identifier, "table name");
    p.expect(TokenType.LBrace, "'{'");

    // Schema / Columns parsing
    const schemaTok = p.current();
    if (schemaTok.type === TokenType.KwSchema || (schemaTok.type === TokenType.Identifier && schemaTok.value === "columns")) {
        p.consume();
    } else {
        throw new ParseError("Expected 'schema' or 'columns'", schemaTok.line, schemaTok.col);
    }
    p.expect(TokenType.Assign, "'='");
    p.expect(TokenType.LBracket, "'['");

    const columns: { name: string; type: XcxType; isAuto: boolean }[] = [];
    while (p.current().type !== TokenType.RBracket) {
        const colName = p.expect(TokenType.Identifier, "column name").value;

        const sepTok = p.current();
        if (sepTok.type === TokenType.Colon || sepTok.type === TokenType.MapBind) {
            p.consume();
        } else {
            throw new ParseError("Expected ':' or '::'", sepTok.line, sepTok.col);
        }

        const colTypeTok = p.current();
        let colType: XcxType | undefined = TOKEN_TO_XCXTYPE.get(colTypeTok.type);
        if (!colType && colTypeTok.type === TokenType.Identifier && TYPE_KEYWORD_MAP.has(colTypeTok.value)) {
            colType = TOKEN_TO_XCXTYPE.get(TYPE_KEYWORD_MAP.get(colTypeTok.value)!);
        }

        if (colType) {
            p.consume();
        } else {
            throw new ParseError(`Expected valid type in table schema, got '${colTypeTok.value}'`, colTypeTok.line, colTypeTok.col);
        }

        let isAuto = false;
        if (p.current().type === TokenType.Auto) {
            p.consume();
            isAuto = true;
        }

        columns.push({ name: colName, type: colType, isAuto });
        if (p.current().type === TokenType.Comma) {
            p.consume();
            if (p.current().type === TokenType.RBracket) break;
        }
    }
    p.expect(TokenType.RBracket, "']'");

    // Data / Rows parsing
    const dataTok = p.current();
    if (dataTok.type === TokenType.KwData || (dataTok.type === TokenType.Identifier && dataTok.value === "rows")) {
        p.consume();
    } else {
        throw new ParseError("Expected 'data' or 'rows'", dataTok.line, dataTok.col);
    }
    p.expect(TokenType.Assign, "'='");

    const rows: ASTNode[][] = [];
    p.expect(TokenType.LBracket, "'['");
    if (p.current().type === TokenType.KwEmpty) {
        p.consume(); // EMPTY
        p.expect(TokenType.RBracket, "']'");
    } else {
        while (p.current().type !== TokenType.RBracket) {
            const rowStartTok = p.current();
            if (rowStartTok.type !== TokenType.LParen && rowStartTok.type !== TokenType.LBracket) {
                throw new ParseError("Expected '(' or '[' for row declaration", rowStartTok.line, rowStartTok.col);
            }
            p.consume(); // LParen or LBracket

            const closeType = rowStartTok.type === TokenType.LParen ? TokenType.RParen : TokenType.RBracket;
            const rowExprs: ASTNode[] = [];
            while (p.current().type !== closeType) {
                rowExprs.push(p.parseExpr());
                if (p.current().type === TokenType.Comma) {
                    p.consume();
                    if (p.current().type === closeType) break;
                }
            }
            p.expect(closeType, "matching close brace for row");
            rows.push(rowExprs);

            if (p.current().type === TokenType.Comma) {
                p.consume();
                if (p.current().type === TokenType.RBracket) break;
            }
        }
        p.expect(TokenType.RBracket, "']' for data definition");
    }

    p.expect(TokenType.RBrace, "'}' to close table definition");
    p.expect(TokenType.Semicolon, "';' after table definition");

    return { kind: "TableDeclaration", name: nameTok.value, columns, rows, line: nameTok.line };
}

export function parseMapDeclaration(p: Parser): MapDeclarationNode {
    const mapTok = p.consume(); // consume 'map'
    p.expect(TokenType.Colon, "':'");
    const nameTok = p.expect(TokenType.Identifier, "map name");
    p.expect(TokenType.LBrace, "'{'");

    // parse schema
    p.expect(TokenType.KwSchema, "'schema'");
    p.expect(TokenType.Assign, "'='");
    p.expect(TokenType.LBracket, "'['");
    const keyTypeTok = p.consume();
    let keyType = TOKEN_TO_XCXTYPE.get(keyTypeTok.type);
    if (!keyType && TYPE_KEYWORD_MAP.has(keyTypeTok.value)) {
        keyType = TOKEN_TO_XCXTYPE.get(TYPE_KEYWORD_MAP.get(keyTypeTok.value)!);
    }
    if (!keyType) {
        throw new ParseError(`Expected valid XCX type in map schema, got '${keyTypeTok.value}'`, keyTypeTok.line, keyTypeTok.col);
    }

    const opTok = p.expect(TokenType.MapSchemaOp, "'<->' or '<=>'");
    const valueTypeTok = p.consume();
    let valueType = TOKEN_TO_XCXTYPE.get(valueTypeTok.type);
    if (!valueType && TYPE_KEYWORD_MAP.has(valueTypeTok.value)) {
        valueType = TOKEN_TO_XCXTYPE.get(TYPE_KEYWORD_MAP.get(valueTypeTok.value)!);
    }
    if (!valueType) {
        throw new ParseError(`Expected valid XCX type in map schema value expression, got '${valueTypeTok.value}'`, valueTypeTok.line, valueTypeTok.col);
    }
    p.expect(TokenType.RBracket, "']'");

    // data
    p.expect(TokenType.KwData, "'data'");
    p.expect(TokenType.Assign, "'='");

    const entries: MapEntry[] = [];

    p.expect(TokenType.LBracket, "'[' for map data");
    if (p.current().type === TokenType.KwEmpty) {
        p.consume(); // EMPTY
        p.expect(TokenType.RBracket, "']' to close empty map data");
    } else {
        while (p.current().type !== TokenType.RBracket) {
            if (p.current().type === TokenType.String && p.current().value === "EMPTY") {
                p.consume(); // EMPTY entry format
                p.expect(TokenType.MapBind, "'::'");
                const dummyVal = p.parseExpr();
                entries.push({
                    key: { kind: "Literal", value: "EMPTY", literalType: "str", line: opTok.line },
                    value: dummyVal
                });
            } else {
                const k = p.parseExpr();
                p.expect(TokenType.MapBind, "'::'");
                const v = p.parseExpr();
                entries.push({ key: k, value: v });
            }

            if (p.current().type === TokenType.Comma) {
                p.consume();
                if (p.current().type === TokenType.RBracket) break;
            }
        }
        p.expect(TokenType.RBracket, "']'");
    }

    p.expect(TokenType.RBrace, "'}' to close map definition");
    p.expect(TokenType.Semicolon, "';' after map definition");

    return {
        kind: "MapDeclaration",
        name: nameTok.value,
        keyType,
        valueType,
        entries,
        line: mapTok.line
    };
}

export function parseSetDeclaration(p: Parser): SetDeclarationNode {
    const setTok = p.consume(); // consume 'set'
    p.expect(TokenType.Colon, "':'");
    const domainTok = p.expect(TokenType.Identifier, "set domain (N/Z/Q/S/B/C)");
    const domain = domainTok.value as SetDomain;
    if (!["N", "Z", "Q", "S", "B", "C"].includes(domain)) {
        throw new ParseError(`Unknown set domain '${domain}'. Valid: N, Z, Q, S, B, C`, domainTok.line, domainTok.col);
    }
    p.expect(TokenType.Colon, "':'");
    const nameTok = p.expect(TokenType.Identifier, "set name");
    const line = setTok.line;

    // Optional rhs: = expr UNION expr, etc.
    if (p.current().type === TokenType.Assign) {
        p.consume();
        const value = p.parseSetExpr();
        p.expect(TokenType.Semicolon, "';'");
        return { kind: "SetDeclaration", domain, name: nameTok.value, init: [], value, line };
    }

    // Initializer: { ... } or just ';'
    if (p.current().type === TokenType.Semicolon) {
        p.consume(); // ';'
        return { kind: "SetDeclaration", domain, name: nameTok.value, init: [], value: null, line };
    }

    p.expect(TokenType.LBrace, "'{'");
    const init: SetInitElement[] = [];

    if (p.current().type !== TokenType.RBrace) {
        // Parse first element / range start
        const firstNode = p.parseExpr();

        if (p.current().type === TokenType.RangeSep) {
            // Range: from ,, to  @step?
            p.consume();
            const toNode = p.parseExpr();
            let stepNode: ASTNode | null = null;
            if (p.current().type === TokenType.Step) {
                p.consume();
                stepNode = p.parseExpr();
            }
            init.push({ kind: "range", from: firstNode, to: toNode, step: stepNode });
        } else {
            // Explicit values
            init.push({ kind: "value", node: firstNode });
            while (p.current().type === TokenType.Comma) {
                p.consume();
                if (p.current().type === TokenType.RBrace) break;
                init.push({ kind: "value", node: p.parseExpr() });
            }
        }
    }

    p.expect(TokenType.RBrace, "'}'");
    p.expect(TokenType.Semicolon, "';'");
    return { kind: "SetDeclaration", domain, name: nameTok.value, init, value: null, line };
}

export function parseSetExpr(p: Parser): ASTNode {
    const SET_OPS = new Set([TokenType.SetUnion, TokenType.SetIntersection, TokenType.SetDifference, TokenType.SetSymmetricDiff]);
    let left: ASTNode = { kind: "Identifier", name: (p.current() as Token).value, line: p.current().line } as ASTNode;
    p.consume();
    while (SET_OPS.has(p.current().type)) {
        const opTok = p.consume();
        const op = tokenToSetOp(opTok.type);
        const rightTok = p.expect(TokenType.Identifier, "set name");
        const right: ASTNode = { kind: "Identifier", name: rightTok.value, line: rightTok.line };
        left = { kind: "SetBinaryExpr", left, right, operator: op, line: opTok.line } as SetBinaryExprNode;
    }
    return left;
}

function tokenToSetOp(t: TokenType): SetOperator {
    switch (t) {
        case TokenType.SetUnion: return "UNION";
        case TokenType.SetIntersection: return "INTERSECTION";
        case TokenType.SetDifference: return "DIFFERENCE";
        case TokenType.SetSymmetricDiff: return "SYMMETRIC_DIFFERENCE";
        default: throw new ParseError(`Expected set operator`, 0, 0);
    }
}
