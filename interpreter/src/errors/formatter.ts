import { XcxError, ParseError, LexerError } from "./errors";

export const ANSI = {
    RED_BOLD: "\x1b[31;1m",
    YELLOW_BOLD: "\x1b[33;1m",
    CYAN: "\x1b[36m",
    BOLD: "\x1b[1m",
    RESET: "\x1b[0m",
};

export function formatCompilerError(err: XcxError, sourceLines: string[]): string {
    const isSema = err.code && err.code.startsWith("S");

    let title = `${ANSI.RED_BOLD}ERROR${ANSI.RESET}${ANSI.BOLD}: `;
    if (err.code) {
        title += `[${err.code}] ${err.message}${ANSI.RESET}`;
    } else {
        title += `${err.message}${ANSI.RESET}`;
    }

    if (!(err instanceof ParseError) && !(err instanceof LexerError) && !isSema) {
        return title + "\n";
    }

    const lineIdx = err.line - 1;
    const rawLine = (lineIdx >= 0 && lineIdx < sourceLines.length) ? sourceLines[lineIdx] : undefined;

    if (!rawLine) {
        return title;
    }

    const lineNumStr = String(err.line).padStart(3, " ");
    const col = err.col || 1;
    let len = err.len || 1;

    if (col - 1 + len > rawLine.length + 1) {
        len = Math.max(1, rawLine.length - col + 1);
    }

    const padding = " ".repeat(col + 5);
    const underline = len > 0 ? "~".repeat(len) : "^";

    return `${title}\n${ANSI.CYAN} ${lineNumStr} |${ANSI.RESET} ${rawLine}\n${padding}${ANSI.YELLOW_BOLD}${underline}${ANSI.RESET}\n`;
}

export function formatHaltError(level: "alert" | "error" | "fatal", msg: string): string {
    if (level === "alert") return "";
    if (level === "error") return `XCX Error: ${msg}\n`;
    return `XCX Fatal: ${msg}\n`;
}
