import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { runSource } from "./index";
import { registerVFS } from "./vfs";

// Configure input mocks for specific interactive tests.
const INPUT_MOCKS: Record<string, string[]> = {
    "test_input_wait.xcx": ["42", "3.1415", "Hello XCX", "true"],
    "test_arrays_const_input.xcx": ["10", "20", "30", "40", "50", "input_string"]
};

// Configure tests expecting an intentional halt signal.
const EXPECTED_HALTS: Record<string, string> = {
    "test_halt.xcx": "halt.fatal"
};

// Automated "golden" pattern base, defined inline to prevent file tree clutter.
const GOLDEN_OUTPUTS: Record<string, string[]> = {
    "test_escapes.xcx": [
        "Line 1\nLine 2",
        "Tabs\tare\tcool",
        "Hex ABC",
        "Octal ABC",
        "Back \\ slash",
        '"double quotes"'
    ],
    "hello.xcx": [
        "2",
        "3.14",
        "Warsaw",
        "true",
        "5",
        "2.71828",
        "Smith",
        "false",
        "Hello World",
        "15"
    ],
    "string_methods.xcx": [
        "=== STRING METHODS ===",
        "xcx_language",
        "3",
        "Prog",
        "25",
        "6",
        "HELLO",
        "true",
        "true",
        "3",
        "3.14159",
        "=== END ==="
    ],
    "test_sets.xcx": [
        "=== SET DECLARATIONS ===",
        "{1, 2, 3, 4, 5}",
        "{0, 2, 4, 6, 8, 10}",
        "{red, green, blue}",
        "{A, B, C, D, E}",
        "=== METHODS ===",
        "5",
        "5",
        "false",
        "true",
        "false",
        "{1, 2, 3, 4, 5, 6}",
        "{2, 3, 4, 5, 6}",
        "=== SET OPERATIONS ===",
        "{1, 2, 3, 4, 5, 6, 7}",
        "{3, 4, 5}",
        "{1, 2}",
        "=== ITERATION ===",
        "10",
        "20",
        "30",
        "=== END ==="
    ],
    "test_maps.xcx": [
        "=== MAP DECLARATIONS ===",
        "[alice::30, bob::25]",
        "[]",
        "[EMPTY::none]",
        "=== MAP METHODS ===",
        "2",
        "2",
        "true",
        "false",
        "3",
        "40",
        "2",
        "=== ITERATION / KEYS / VALUES ===",
        "bob",
        "charlie",
        "25",
        "40",
        "=== CLEAR ===",
        "0"
    ],
    "test_while_break_continue.xcx": [
        "=== BLOCK W1: basic while ===",
        "1", "2", "3", "4", "5",
        "=== BLOCK W2: while false immediately ===",
        "no iterations OK",
        "=== BLOCK W3: exactly one iteration ===",
        "once OK",
        "=== BLOCK W4: complex condition ===",
        "1", "2", "3",
        "=== BLOCK W5: sum 1..10 ===",
        "55",
        "=== BLOCK W6: while with float ===",
        "1.2",
        "=== BLOCK W7: basic break ===",
        "1", "2", "3",
        "after break",
        "=== BLOCK W8: break doesn't trigger ===",
        "1", "2", "3",
        "=== BLOCK W9: continue odd numbers ===",
        "1", "3", "5", "7",
        "=== BLOCK W10: continue skips everything ===",
        "continue OK",
        "=== BLOCK W11: break and continue together ===",
        "1", "3", "5",
        "end W11",
        "=== BLOCK W12: nested while inner break ===",
        "1", "3", "2", "3", "3", "3",
        "=== BLOCK W13: nested while outer break ===",
        "1", "2", "3", "1", "2", "3", "2",
        "=== BLOCK W14: nested while inner continue ===",
        "1", "3", "4", "1", "3", "4",
        "=== BLOCK W15: while with string ===",
        "xxxx",
        "=== BLOCK W16: bool as flag ===",
        "5",
        "=== BLOCK W17: break on first iteration ===",
        "break first OK",
        "=== BLOCK W18: external variable modification ===",
        "8", "104",
        "=== BLOCK W19: continue doesn't stuck loop ===",
        "3", "6", "9", "3",
        "=== BLOCK W20: while inside if ===",
        "1", "2", "3",
        "=== BLOCK W21: if/elseif/else inside while ===",
        "one", "other", "three", "other", "other",
        "=== ALL WHILE/BREAK/CONTINUE TESTS FINISHED ==="
    ],
    "edge_functions.xcx": [
        "=== BLOCK F0: keywords as identifiers ===",
        "42",
        "10",
        "3.14",
        "2.71",
        "hun",
        "rnd",
        "true",
        "false",
        "52",
        "5.85",
        "hunrnd",
        "false",
        "=== BLOCK F1: void without parameters ===",
        "hi!",
        "hi!",
        "=== BLOCK F2: void with parameters ===",
        "Hey, Anna!",
        "Hey, XCX!",
        "=== BLOCK F3: return int ===",
        "7",
        "0",
        "1000",
        "=== BLOCK F4: return types ===",
        "99",
        "1.5",
        "xcx",
        "true",
        "=== BLOCK F5: logic inside function ===",
        "7",
        "10",
        "5",
        "5",
        "8",
        "0",
        "=== BLOCK F6: recursion ===",
        "1",
        "1",
        "120",
        "3628800",
        "0",
        "1",
        "13",
        "55",
        "=== BLOCK F7: function in expression ===",
        "10",
        "6",
        "result: 30",
        "true",
        "=== BLOCK F8: type aliases in parameters ===",
        "42",
        "true",
        "false",
        "=== BLOCK F9: local variables ===",
        "6",
        "60",
        "foobarbaz",
        "=== BLOCK F10: outer variable access ===",
        "105",
        "100",
        "=== END OF FUNCTION TESTS ==="
    ],
    "test_input_wait.xcx": [
        "42",
        "3.1415",
        "Hello XCX",
        "true",
        "Waiting sec..",
        "End of edge cases!"
    ],
    "test_json.xcx": [
        "Raw object keys exist?",
        "true",
        "true",
        "Checking nested elements",
        "2",
        "admin",
        "Modifying fields",
        "4",
        "Injecting new structure",
        "2",
        "Binding data",
        "4",
        "developer",
        "Testing stringification",
        "{}",
        "Testing keys method",
        "[name, nested, roles, version]"
    ],
    "test_include.xcx": [
        "=== BASIC INCLUDE ===",
        "3.14159265358979",
        "4.000000000000004",
        "=== ALIAS INCLUDE ===",
        "3.14159265358979",
        "5.000000000016778",
        "=== INCLUDE OK ==="
    ],
    "test_float_arith_loop.xcx": [
        "[09] Float Arith: 250500250.00000003"
    ]
};

interface TestResult {
    filepath: string;
    name: string;
    success: boolean;
    output: string[];
    error?: string;
    reason?: string;
}

async function runAllTests() {
    const testsDir = path.resolve(__dirname, "../tests");
    if (!fs.existsSync(testsDir)) {
        console.error(`Tests directory does not exist at: ${testsDir}`);
        process.exit(1);
    }

    const libDir = path.resolve(__dirname, "../lib");
    if (fs.existsSync(libDir)) {
        fs.readdirSync(libDir).forEach(file => {
            if (file.endsWith(".xcx")) {
                const content = fs.readFileSync(path.join(libDir, file), 'utf8');
                registerVFS(file, content);
            }
        });
    }

    const files = fs.readdirSync(testsDir)
        .filter(f => f.endsWith(".xcx") && f !== "benchmark_for_loop.xcx")
        .sort();

    console.log("==========================================");
    console.log("  XCx 4.3 TEST RUNNER");
    console.log("==========================================");

    const results: TestResult[] = [];

    for (const filename of files) {
        const filepath = path.join(testsDir, filename);
        const source = fs.readFileSync(filepath, "utf-8");

        const inputMocks = INPUT_MOCKS[filename] || [];
        const expectedHalt = EXPECTED_HALTS[filename];

        const runRes = runSource(source, inputMocks);

        let success = false;
        let reason = "";

        if (expectedHalt) {
            // We expect an intentional halt signal
            if (runRes.error && runRes.error.includes(expectedHalt)) {
                success = true;
            } else {
                success = false;
                reason = `Expected error containing '${expectedHalt}', but received: ${runRes.error || "no error"}`;
            }
        } else {
            if (runRes.error) {
                success = false;
                reason = `Interpreter reported an unexpected error: ${runRes.error}`;
            } else {
                // Compare with golden pattern if it exists
                const golden = GOLDEN_OUTPUTS[filename];
                if (golden) {
                    const matching = compareOutputs(runRes.output, golden);
                    if (matching) {
                        success = true;
                    } else {
                        success = false;
                        reason = `Console output differs from the golden pattern.`;
                    }
                } else {
                    // No golden pattern: execution without error means success
                    success = true;
                }
            }
        }

        results.push({
            filepath,
            name: filename,
            success,
            output: runRes.output,
            error: runRes.error,
            reason
        });

        const statusText = success ? "\x1b[32mOK\x1b[0m" : "\x1b[31mFAILED\x1b[0m";
        console.log(`test ${filename.padEnd(30)} ... ${statusText}`);
    }

    console.log("==========================================");
    const passedCount = results.filter(r => r.success).length;
    console.log(`Summary: ${passedCount}/${results.length} tests passed successfully.`);
    console.log("==========================================");

    // Interactive prompt or automatic verbose on non-TTY / --verbose flag
    const isVerbose = process.argv.includes("--verbose") || process.argv.includes("-v") || !process.stdin || !process.stdin.isTTY;

    if (isVerbose) {
        printDetailedLogs(results);
        process.exit(results.every(r => r.success) ? 0 : 1);
    } else {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question("Show detailed test outputs? (yes/no): ", (answer) => {
            const cleanAns = answer.trim().toLowerCase();
            if (cleanAns === "yes" || cleanAns === "y") {
                printDetailedLogs(results);
            }
            rl.close();
            process.exit(results.every(r => r.success) ? 0 : 1);
        });
    }
}

function printDetailedLogs(results: TestResult[]) {
    console.log("\n--- DETAILED TEST EXECUTION LOGS ---");
    for (const res of results) {
        console.log(`\n==========================================`);
        console.log(`TEST: ${res.name}`);
        console.log(`==========================================`);
        console.log(`Status: ${res.success ? "SUCCESS" : "FAILED"}`);
        if (res.reason) console.log(`Reason: ${res.reason}`);
        console.log(`\n--- STDOUT OUTPUT ---`);
        if (res.output.length === 0) {
            console.log("(no output)");
        } else {
            res.output.forEach(line => console.log(line));
        }
        if (res.error) {
            console.log(`\n--- REPORTED ERROR ---`);
            console.log(res.error);
        }
    }
    console.log("\n==========================================");
}

function compareOutputs(actual: string[], expected: string[]): boolean {
    if (actual.length !== expected.length) return false;
    for (let i = 0; i < actual.length; i++) {
        if (actual[i]!.trim() !== expected[i]!.trim()) return false;
    }
    return true;
}

runAllTests().catch(console.error);
