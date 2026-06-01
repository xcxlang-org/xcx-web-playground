# XCX Web playground Specification

## Overview
A statically typed, multi-paradigm backend language. This playground runs a sandboxed, TypeScript-based interpreter directly in your browser.

---

## 1. Data Types

| Type | Keyword | Examples | Notes |
|------|---------|----------|-------|
| Integer | `i` | `0`, `42`, `-100` | 64-bit signed integer |
| Float | `f` | `3.14`, `0.0`, `-2.5` | IEEE 754 double precision |
| String | `s` | `"hello"`, `"XCX"` | Immutable, Unicode support |

### Escape Sequences

String literals support standard escape sequences:

| Sequence | Effect |
|----------|--------|
| `\n`     | Newline |
| `\t`     | Horizontal Tab |
| `\r`     | Carriage Return |
| `\"`     | Double Quote |
| `\\`     | Backslash |
| `\xNN`   | Hexadecimal character (e.g., `\x1b`) |
| `\NNN`   | Octal character (e.g., `\033`) |

| Boolean | `b` | `true`, `false` | Logical values |
| Date | `date` | `date("2024-12-25")`, `date.now()` | Calendar date + time |

---

## 2. Variable Declaration

```xcx
i: myInt = 42;          --- Declare and initialize integer
s: greeting = "Hello";  --- Declare and initialize string
f: pi;                  --- Declare uninitialized float (default: 0.0)
b: flag = true;         --- Boolean variable
date: now = date.now(); --- Current date/time
```

---

## 3. Operators

### Arithmetic
| Op | Types | Result | Example |
|----|-------|--------|---------|
| `+` | i/f | i/f | `3 + 2` → `5` |
| `-` | i/f | i/f | `5 - 2` → `3` |
| `*` | i/f | i/f | `3 * 4` → `12` |
| `/` | i/f | i/f | `10 / 2` → `5` |
| `%` | i/f | i/f | `10 % 3` → `1` |
| `^` | i/f | i/f | `2 ^ 3` → `8` |

### String Concatenation
| Op | Types | Result | Example |
|----|-------|--------|---------|
| `+` | s, s | s | `"Hello" + " " + "World"` |
| `++` | s, s | s | `"a" ++ "b"` → `"ab"` |

### Comparison
| Op | Types | Result | Example |
|----|-------|--------|---------|
| `==` | any | b | `5 == 5` → `true` |
| `!=` | any | b | `5 != 3` → `true` |
| `<` | i/f/date | b | `3 < 5` → `true` |
| `>` | i/f/date | b | `5 > 3` → `true` |
| `<=` | i/f/date | b | `5 <= 5` → `true` |
| `>=` | i/f/date | b | `5 >= 3` → `true` |

### Logical
| Op | Types | Result | Example |
|----|-------|--------|---------|
| `&&` / `AND` | b, b | b | `true && false` → `false` |
| `||` / `OR` | b, b | b | `true \|\| false` → `true` |
| `!` / `!!` | b | b | `!true` → `false` |

### String Operators
| Op | Operands | Result | Example |
|----|----------|--------|---------|
| `HAS` | s, s | b | `"hello" HAS "ll"` → `true` |

### Date Arithmetic
| Op | Types | Result | Example |
|----|-------|--------|---------|
| `+` | date, i | date | `some_date + 1` → next day |
| `-` | date, i | date | `some_date - 7` → a week ago |
| `-` | date, date | i | `d1 - d2` → difference in whole days |
| `<`, `>`, `<=`, `>=`, `==`, `!=` | date, date | b | `christmas < new_year` |

---

## 4. Control Flow

### If / Else If / Else

```xcx
if (age >= 18) then;
    >! "Adult";
elseif (age >= 13) then;
    >! "Teenager";
else;
    >! "Child";
end;
```

---

## 5. Loops

### While Loop

```xcx
i: count = 0;
while (count < 10) do;
    >! count;
    count = count + 1;
end;
```

### For Loop (Range-based, inclusive on both ends)

**Basic:**
```xcx
for i in 1 to 5 do;
    >! i;
end;
--- prints: 1, 2, 3, 4, 5
```

**With Step:**
```xcx
for j in 0 to 10 @step 2 do;
    >! j;
end;
--- prints: 0, 2, 4, 6, 8, 10
```

**Reverse (negative step):**
```xcx
for k in 5 to 1 @step -1 do;
    >! k;
end;
--- prints: 5, 4, 3, 2, 1
```

### Break and Continue

```xcx
i: i = 0;
while (i < 100) do;
    if (i == 5) then;
        break;
    end;
    if (i % 2 == 0) then;
        continue;
    end;
    >! i;
    i = i + 1;
end;
```

---

## 6. Functions

### Declaration and Call

```xcx
func add(i: a, i: b -> i) {
    return a + b;
};

i: result = add(3, 5);  --- result = 8
```

**Syntax:** `func <name> ( [params] [-> returnType] ) { body } ;`

- Parameters: `type: name, type: name, ...`
- Return type (optional): `-> type` before closing `)`
- If no return type specified: function is **void** (returns empty string)

### Multiple Parameters

```xcx
func multiply(i: x, i: y -> i) {
    return x * y;
};
```

### Void Functions (no return type)

```xcx
func printTwice(s: text) {
    >! text;
    >! text;
};

printTwice("XCX");  --- prints "XCX" twice
```

---

## 7. Input/Output

### Print Statement

```xcx
>! 42;
>! "Hello, World!";
>! true;
```

Prints the value followed by a newline.

### User Input (`>?`)

The `>?` operator reads a line from `stdin` and attempts to parse it into the target variable's type. The variable must already be declared before reading.

```xcx
i: age;
>! "Enter age:";
>? age;
```

- For `i` / `int`: the input line is parsed as an integer; `halt.error` if not a valid integer.
- For `f` / `float`: parsed as a floating-point number; `halt.error` if invalid.
- For `b` / `bool`: accepts `true` or `false` (case-sensitive); `halt.error` otherwise.
- For `s` / `str`: the raw line is stored as-is (no parsing).

---

## 8. Arrays

Arrays are ordered, homogeneous, dynamically-sized collections.

### Declaration

```xcx
array:i: nums {10, 20, 30};
```

**Syntax:** `array:<elementType>: <name> { <value>, ... };`

- Element type is any of the four scalar types: `i`/`int`, `f`/`float`, `s`/`str`, `b`/`bool`.
- The initializer list may be empty: `array:i: empty {};`

### Array Methods

| Method            | Signature    | Returns | Description                                                         |
|-------------------|--------------|---------|---------------------------------------------------------------------|
| `.size()`         | `() → i`     | `i`     | Number of elements                                                  |
| `.get(i)`         | `(i) → T`    | `T`     | Element at position `i` (0-indexed); `halt.error` if out of bounds  |
| `.push(val)`      | `(T) → b`    | `b`     | Appends element to the end                                          |
| `.pop()`          | `() → T`     | `T`     | Removes and returns the last element                                |
| `.insert(i, val)` | `(i, T) → b` | `b`     | Inserts at position `i`, shifts rest; `halt.error` if out of bounds |
| `.update(i, val)` | `(i, T) → b` | `b`     | Overwrites element at position `i`; `halt.error` if out of bounds   |
| `.delete(i)`      | `(i) → b`    | `b`     | Removes element at position `i`; `halt.error` if out of bounds      |
| `.find(val)`      | `(T) → i`    | `i`     | Index of first occurrence, or `-1`                                  |
| `.contains(val)`  | `(T) → b`    | `b`     | Checks if value exists                                              |
| `.isEmpty()`      | `() → b`     | `b`     | `true` if empty                                                     |
| `.clear()`        | `() → b`     | `b`     | Removes all elements                                                |
| `.sort()`         | `() → b`     | `b`     | Sorts ascending (in-place)                                          |
| `.reverse()`      | `() → b`     | `b`     | Reverses order (in-place)                                           |
| `.show()`         | `() → b`     | `b`     | Prints contents to terminal                                         |

```xcx
array:i: nums {5, 2, 8, 1};
nums.sort();            --- {1, 2, 5, 8}
nums.reverse();         --- {8, 5, 2, 1}
nums.push(99);          --- {8, 5, 2, 1, 99}
i: last = nums.pop();   --- last = 99, nums = {8, 5, 2, 1}
nums.insert(1, 15);     --- inserts 15 at position 1
nums.update(0, 5);      --- sets element 0 to 5
nums.delete(3);         --- removes element at position 3
b: found = nums.contains(5);
i: idx   = nums.find(5);
b: empty = nums.isEmpty();
```

---

## 9. Constants

Constants are declared using the `const` keyword before the type. They must be initialized at declaration and **cannot be reassigned** afterwards. Attempting to assign to a constant is a **compile-time error** (`AssignToConst`).

```xcx
const i: MAX_CONNECTIONS = 1024;
const s: VERSION = "2.0.0";
```

---

## 10. Comments

### Line Comments
```xcx
--- This is a line comment until end of line
i: x = 5; --- inline comment
```

### Block Comments
```xcx
---
Multi-line comment
spanning multiple lines
---
i: x = 5;
```

---

## 11. Scope Rules

- **Global scope:** Top-level variables and functions
- **Function scope:** Parameters and local variables are scoped to the function
- **Block scope:** Variables declared in if/for/while blocks are scoped to that block
- **No shadowing:** A variable cannot be redeclared in any enclosing scope — this is a **compile-time error** (`RedefinedVariable`).

### No Variable Shadowing

XCX does **not** support variable shadowing. Declaring a variable with the same name in any scope — including a nested block — is a **compile-time error** (`RedefinedVariable`).

```xcx
i: x = 10;
if (true) then;
    i: x = 20;   --- COMPILE ERROR: RedefinedVariable
end;
```

If you need to change a value inside a block, use reassignment instead of redeclaration:

```xcx
i: x = 10;
if (true) then;
    x = 20;      --- OK: reassignment to existing variable
    >! x;        --- 20
end;
>! x;            --- 20 (the global variable was modified)
```

---

## 12. Type Checking

- **Static typing:** All variables must have explicit types
- **Type coercion:** Arithmetic operations preserve type (int/float mixing returns float)
- **String vs Numeric:** Operations are type-checked; mixing incompatible types causes error

---

## 13. Date and Time

The `date` type represents a calendar date with time (year, month, day, hour, minute, second, millisecond).

### Creation

Dates are created using the `date()` constructor or the `date.now()` built-in.

```xcx
date: d1 = date("2024-12-25");               --- YYYY-MM-DD (time defaults to 00:00:00)
date: d2 = date("25/12/2024", "DD/MM/YYYY"); --- Custom parse format
date: now = date.now();                      --- Current system date and time
```

**Supported parse format tokens:**

| Token | Meaning |
|-------|---------|
| `YYYY` | Four-digit year |
| `MM` | Month with leading zero (01–12) |
| `DD` | Day with leading zero (01–31) |
| `HH` | Hour with leading zero (00–23) |
| `mm` | Minute with leading zero (00–59) |
| `ss` | Second with leading zero (00–59) |

### Read-only Properties

Date objects expose the following read-only integer fields. Assigning to them is a **compile-time error**.

| Property | Type | Range | Description |
|----------|------|-------|-------------|
| `.year` | `i` | e.g. 2024 | Full four-digit year |
| `.month` | `i` | 1–12 | Month of the year |
| `.day` | `i` | 1–31 | Day of the month |
| `.hour` | `i` | 0–23 | Hour of the day |
| `.minute` | `i` | 0–59 | Minute of the hour |
| `.second` | `i` | 0–59 | Second of the minute |

```xcx
date: now = date.now();
>! now.year;
>! now.month;
>! now.day;
>! now.hour;
>! now.minute;
>! now.second;
```

### Arithmetic

Adding or subtracting an integer shifts the date by that many **whole days**. Subtracting two `date` values yields the difference as a whole number of days (`i`).

```xcx
date: christmas   = date("2024-12-25");
date: new_year    = date("2025-01-01");
date: tomorrow    = christmas + 1;
date: yesterday   = christmas - 1;
i: days_between   = new_year - christmas;  --- 7
```

### Comparison

All six comparison operators work between two `date` values and return `b`.

```xcx
b: is_before  = christmas < new_year;   --- true
b: same_day   = christmas == christmas; --- true
b: is_after   = new_year > christmas;   --- true
```

### Formatting

```xcx
s: s1 = now.format();                     --- Default: "YYYY-MM-DD HH:mm:ss"
s: s2 = now.format("DD/MM/YYYY");         --- e.g. "25/12/2024"
s: s3 = now.format("DD/MM/YYYY HH:mm");  --- e.g. "25/12/2024 08:30"
```

**Output format tokens:**

| Token | Output |
|-------|--------|
| `YYYY` | Four-digit year |
| `MM` | Month with leading zero |
| `M` | Month without leading zero |
| `DD` | Day with leading zero |
| `D` | Day without leading zero |
| `HH` | Hour with leading zero (24 h) |
| `mm` | Minute with leading zero |
| `ss` | Second with leading zero |
| `SSS` / `ms` | Milliseconds (three digits) |

---

## 14. Random Module

The `random` module provides pseudo-random number generation. All `random` functions are built-in and require no import.

### `random.int(min, max)`

Returns a random integer in the **inclusive** range `[min, max]`.

```xcx
i: r1 = random.int(1, 6);       --- simulates a die roll: 1–6
>! r1;
```

**With optional `@step`** — restricts the result to values that are congruent with `min` modulo `step` (i.e. only values `min`, `min + step`, `min + 2*step`, … up to `max` are possible).

```xcx
i: r2 = random.int(0, 10 @step 2);   --- one of: 0, 2, 4, 6, 8, 10
>! r2;
```

### `random.float(min, max)`

Returns a random IEEE 754 double in the **inclusive** range `[min, max]`.

```xcx
f: r3 = random.float(0.0, 1.0);      --- e.g. 0.7341...
>! r3;
```

**With optional `@step`** — quantises the result to the nearest step value.

```xcx
f: r4 = random.float(0.0, 1.0 @step 0.1);  --- one of: 0.0, 0.1, 0.2, … 1.0
>! r4;
```

### `random.choice from <array>`

Picks one element uniformly at random from an existing array. The array must be non-empty; a `halt.error` is raised otherwise. The return type matches the element type of the array.

```xcx
array:i: pool {10, 20, 30, 40, 50};
i: picked = random.choice from pool;
>! picked;
```

Works with arrays of any element type:

```xcx
array:s: colours {"red", "green", "blue"};
s: col = random.choice from colours;
>! col;
```

### Quick-reference table

| Call | Returns | Notes |
|------|---------|-------|
| `random.int(min, max)` | `i` | Uniform integer in [min, max] |
| `random.int(min, max @step s)` | `i` | Integer stepped by `s` |
| `random.float(min, max)` | `f` | Uniform float in [min, max] |
| `random.float(min, max @step s)` | `f` | Float quantised to step `s` |
| `random.choice from arr` | `T` | Random element from array |

---

## 15. Arrays

Arrays are collection structures initialized with a predefined set of items, or as assignments from values returned by methods like map keys. Array elements are enclosed in curly braces `{}`.

```xcx
array:i: numbers {1, 2, 3};

array:s: names = my_map.keys();
```

Arrays can be iterated sequentially with `for .. in .. do;`

```xcx
for number in numbers do;
    >! number;
end;
```

---

## 16. Maps

Map structures associate keys with values.

```xcx
map: ages {
    schema = [s <-> i]
    data = [ "alice" :: 30, "bob" :: 25 ]
};

--- Empty Map
map: scores {
    schema = [s <-> i]   --- both separators are equivalent (<-> and <=>)
    data = [EMPTY]
};
```

### Map Methods

| Method           | Signature       | Returns   | Description                               |
|------------------|-----------------|-----------|-------------------------------------------|
| `.size()`        | `() → i`        | `i`       | Number of key-value pairs                 |
| `.get(key)`      | `(K) → V`       | `V`       | Returns value; `halt.error` if key missing|
| `.contains(key)` | `(K) → b`       | `b`       | Checks if key exists                      |
| `.insert(k, v)`  | `(K, V) → b`    | `b`       | Inserts or overwrites                     |
| `.remove(key)`   | `(K) → b`       | `b`       | Removes pair; `false` if key missing      |
| `.keys()`        | `() → array:K`  | `array:K` | Returns array of keys                     |
| `.values()`      | `() → array:V`  | `array:V` | Returns array of values                   |
| `.clear()`       | `() → b`        | `b`       | Removes all pairs                         |
| `.show()`        | `() → b`        | `b`       | Prints map contents to terminal           |

Always use `.contains()` before `.get()`:

```
if (ages.contains("alice")) then;
    >! ages.get("alice");
end;
```

---

## 17. User Input (`>?`)

The `>?` operator reads a line from `stdin` and attempts to parse it into the target variable. The target variable's type must be statically defined before inputting, and the interpreter handles automatic cast conversions.

```xcx
i: age;
>! "Enter age:";
>? age;
```

---

## 18. Delay (`@wait`)

Pauses VM execution for a specified number of milliseconds using atomic thread halts.

```xcx
@wait 1000; --- Waits for 1 second
```

---

## 19. Tables

Relational data structures with optional auto-increment columns.

```xcx
table: products {
    columns = [ id :: i @auto, name :: s, price :: f ]
    rows = [ ("Laptop", 2999.99), ("Phone", 1499.50) ]
};

--- Empty Table
table: logs {
    columns = [ id :: i @auto, msg :: s ]
    rows = [EMPTY]
};
```

Columns and rows can also be written across multiple lines — both forms are equivalent:

```xcx
table: products {
    columns = [
        id    :: i @auto,
        name  :: s,
        price :: f
    ]
    rows = [
        ("Laptop", 2999.99),
        ("Phone",  1499.50)
    ]
};
```

The `@auto` modifier on an `i` column creates an auto-incremented ID — it is skipped in `.insert()` and `.add()`.

### Row Access

```xcx
products[0].name    --- "Laptop" (sugar for .get(0))
products[1].price   --- 1499.50
```

### Table Methods

| Method               | Signature               | Returns | Description                                      |
|----------------------|-------------------------|---------|--------------------------------------------------|
| `.count()`           | `() → i`                | `i`     | Number of rows                                   |
| `.get(i)`            | `(i) → row`             | `row`   | Row at index `i`                                 |
| `.insert(vals...)`   | `(T...) → b`            | `b`     | Adds row (skips `@auto` columns)                 |
| `.add(vals...)`      | `(T...) → b`            | `b`     | Alias for `.insert()` — identical behavior       |
| `.update(i, vals)`   | `(i, [T...]) → b`       | `b`     | Replaces row values; `@auto` columns preserved   |
| `.delete(i)`         | `(i) → b`               | `b`     | Removes row at index `i`                         |
| `.where(pred)`       | `(expr) → table`        | `table` | Filters — returns a new table                    |
| `.join(t, pred)`     | `(table, pred) → table` | `table` | Inner join with another table                    |
| `.show()`            | `() → b`                | `b`     | Prints table in aesthetic ASCII format           |

### Filtering (where)

```xcx
--- Shorthand syntax (column names usable directly)
table: expensive = products.where(price > 1000.0);
table: named     = products.where(name HAS "Pro");

--- Lambda
table: r = products.where(row -> row.price > 1000.0);

--- Chaining
table: result = products
    .where(price > 1000.0)
    .where(name HAS "Pro");
```

> [!IMPORTANT]
> **Name Conflicts in `.where()` (S301)**: Column names take precedence over local variables inside predicates. If a local variable has the same name as a column, rename the variable to avoid a compile error.

### Joins

```xcx
--- Key-based join
table: report = users.join(orders, "id", "user_id");

--- Lambda join
table: custom = tableA.join(tableB, (a, b) -> a.id == b.ref_id);
```

When joined tables share a column name (other than the join key), the resulting column is prefixed with `{table_name}_`.

---

## 20. Terminal and Input

### Raw Input (`input`)

The `input` module allows reading single keys without waiting for Enter.

**Methods**

| Call | Returns | Description |
|------|---------|-------------|
| `input.key()` | `s` | Returns key if available, `""` if not |
| `input.key() @wait` | `s` | Waits for a key and returns it |
| `input.ready()` | `b` | `true` if a key is waiting in the buffer |

**Key Constants**

| Value | Key |
|-------|-----|
| `"UP"` | Arrow Up |
| `"DOWN"` | Arrow Down |
| `"LEFT"` | Arrow Left |
| `"RIGHT"` | Arrow Right |
| `"ENTER"` | Enter |
| `"ESC"` | Escape |
| `"BACKSPACE"` | Backspace |
| `"TAB"` | Tab |
| `"F1"` ... `"F12"` | F1–F12 |
| `"KEY_CTRL_C"` | Ctrl+C |
| `"KEY_CTRL_Z"` | Ctrl+Z |
| `"KEY_CTRL_S"` | Ctrl+S |

Regular characters are returned directly: `"a"`, `"Z"`, `"5"`, `" "`.

**Example**
```xcx
s: k = input.key();
if (k == "UP") then;
    y = y - 1;
end;

--- wait for specific key
s: confirm = input.key() @wait;
if (confirm == "q") then;
    return;
end;
```

### Terminal Commands (`.terminal`)

Directly interact with the system environment or current process.

| Directive | Description |
|-----------|-------------|
| `.terminal !clear` | Clears the screen |
| `.terminal !exit` | Terminates the VM process |
| `.terminal !run s` | Runs another XCX file in a new process|
| `.terminal !raw` | Raw mode — no echo, no buffering |
| `.terminal !normal` | Restores normal terminal mode |
| `.terminal !cursor on` | Shows the cursor |
| `.terminal !cursor off` | Hides the cursor |
| `.terminal !move x y` | Moves the cursor to position x, y (i) |
| `.terminal !write expr` | Prints expr without a trailing newline |

> [!WARNING]
> **.terminal !run <file> Oczekuje na Implementację (TODO)**
> Metoda `!run` służy do odpalania innych plików w nowym wirtualnym procesie. Z uwagi na architekturę XCX Web Playground, pliki są wirtualne i zarządzane przez Front-end (Vue.js + Vite). By w pełni zaimplementować tę instrukcję, Interpreter musi spiąć się z systemem Wirtualnego Systemu Plików (VFS) Playgroundu, pozwalając na wymianę i parsowanie skryptów z wirtualnej struktury folderów środowiska graficznego. Z tego względu dodanie jej w tej chwili jest zawieszone, do momentu integracji interpretera wraz z VFS frontendu.


**Example — Game Loop**
```xcx
.terminal !raw;
.terminal !cursor off;
.terminal !clear;

while (true) do;
    s: k = input.key();
    if (k == "ESC") then; break; end;
    if (k == "UP") then; y = y - 1; end;

    .terminal !move x y;
    .terminal !write "@";
    @wait 16;
end;

.terminal !cursor on;
.terminal !normal;
```

### Error Handling and Constraints

*   `input.key()` in normal mode: Returns `""` and prints a warning alert.
*   `@wait` on `input.ready()`: Compilation error.
*   `.terminal` directives: Are not expressions and cannot be assigned to variables.
*   `.terminal !move`: Arguments must be integers (`i`).
*   Terminal Availability: The VM will halt with a fatal error if console handles are redirected or unavailable.

---

## 21. JSON

JSON objects in XCX 3.1 are mutable.

### Creation

```xcx
json: config <<< {"port": 8080, "debug": false} >>>;
json: user   <<< {"name": "", "age": 0} >>>;
```

Values in the literal can be placeholders (`""`, `0`, `false`) to be filled later via `.set()`.

### Serialization from Collections

You can also create JSON objects and arrays directly from XCX collections using the `.toJson()` method. This is available for:

- **Maps:** Returns a JSON object.
- **Tables:** Returns a JSON array of objects.

### Parsing

```xcx
json: parsed = json.parse(raw_string);
```

> [!CAUTION]
> **Panic on Invalid JSON (R305):** If parsing fails, the VM terminates immediately. Verify string content before parsing.

### Mutability Pattern

Declare a schema with zero-values, then populate:

```xcx
json: resp <<< {"token": "", "role": "", "uid": 0, "ok": false} >>>;
resp.set("token", crypto.token(32));
resp.set("role",  "admin");
resp.set("uid",   42);
resp.set("ok",    true);
```

### JSON Methods

| Method | Signature | Returns | Description |
|---|---|---|---|
| `.exists(path)` | `(s) → b` | `b` | Checks if path exists and is non-null |
| `.get(path/idx)` | `(s/i) → json` | `json` | Gets element at path or index |
| `.bind(path, var)` | `(s, ref) → b` | `b` | Extracts value into a pre-declared XCX variable |
| `.set(path, val)` | `(s, T) → b` | `b` | Sets value at path; creates key if missing |
| `.push(val)` | `(json) → b` | `b` | Appends element to a JSON array node |
| `.size() / .count()` | `() → i` | `i` | Number of keys (object) or elements (array) |
| `.toStr()` | `() → s` | `s` | Serializes to JSON string |
| `.inject(path, map, tbl)` | `(s, map, table) → b` | `b` | Bulk import of JSON array into XCX table |
| `.first()` | `() → json` | `json` | Returns the first element of a JSON array; halt.error if empty |

> [!NOTE]
> **`.push()` on JSON arrays:** `.push()` works exclusively on JSON nodes that are arrays (`[]`). Calling `.push()` on a JSON object (`{}`) results in a `halt.error`.
```xcx
json: data <<< {"items": []} >>>;
json: obj <<< {"id": 1} >>>;
data.get("items").push(obj);   --- OK: "items" is an array
data.push(obj);                --- halt.error: data is an object, not an array
```

> [!IMPORTANT]
> **`.bind()` syntax:** The second argument must be a previously declared variable. You cannot declare the type inline.
```xcx
--- Wrong
req.bind("ip", s: ip);

--- Correct
s: ip;
req.bind("ip", ip);
```

### Path Notation

Both dot-notation and bracket notation are supported for nested access:

```xcx
--- Nested field
json: cfg <<< {"server": {"host": "localhost"}} >>>;
s: host;
cfg.bind("server.host", host);

--- Array index
json: resp <<< {"items": []} >>>;
resp.set("items[0]", first_item);
resp.set("items[1]", second_item);
```

### `.inject()` — Bulk Import

Import a JSON array directly into an XCX table:

```xcx
json: data <<< {"users":[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]} >>>;
table: imported { columns=[uid::i, uname::s] rows=[EMPTY] };
map: mapping { schema=[s<->s] data=["uid"::"id", "uname"::"name"] };

data.inject("users", mapping, imported);
imported.show();
```

---

## 14. Modules & Virtual File System (VFS)

### `include`

Merges code from another file into the current namespace.

```xcx
include "utils.xcx";
include "math.xcx" as m;

m.PI;
m.sqrt(16.0);
```

Without an alias, all symbols are available directly in the current namespace. With an alias, all top-level symbols are prefixed: `alias.symbol`.

Cyclic dependencies are detected and rejected at compile time.

---

## 23. Error Handling (Halt)

XCX 3.1 uses a structured `halt` system for managing runtime conditions and errors.

### Halt Levels

| Level         | Behavior                                          | Use Case                      |
|---------------|---------------------------------------------------|-------------------------------|
| `halt.alert`  | Prints a message; execution continues.            | Logging, non-critical warnings|
| `halt.error`  | Prints to stderr; aborts the current frame.       | Recoverable logic errors      |
| `halt.fatal`  | Prints a message; terminates the VM immediately. | Critical failure, security breach |

### Examples

```xcx
halt.alert >! "Cache missed, fetching from DB...";

if (divisor == 0) then;
    halt.error >! "Division by zero!";
    return 0; --- Execution returns to caller from the recovery point
end;

if (NOT db.is_healthy()) then;
    halt.fatal >! "Database corrupted. Emergency shutdown.";
end;
```

### Semantic and Runtime Panics

Certain invalid operations result in an automatic **panic** (equivalent to `halt.fatal` or `halt.error` depending on context):
- **Division by zero** (arithmetic)
- **JSON Parse Failure**: Invalid string in `json.parse()` results in an immediate VM exit.
