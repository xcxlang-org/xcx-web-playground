import { snippetCompletion } from '@codemirror/autocomplete';

export const xcxCompletions = [
  snippetCompletion(`\${1:i,f,s,b}: \${2:name} = \${0};`, { label: 'xvar', detail: 'Variable declaration (pick type)' }),
  snippetCompletion(`const \${1:i,f,s,b}: \${2:NAME} = \${0};`, { label: 'const', detail: 'Constant declaration' }),
  snippetCompletion(`i(\${0:value})`, { label: 'toi', detail: 'Cast to int: i(x)' }),
  snippetCompletion(`f(\${0:value})`, { label: 'tof', detail: 'Cast to float: f(x)' }),
  snippetCompletion(`s(\${0:value})`, { label: 'tos', detail: 'Cast to string: s(x)' }),
  snippetCompletion(`func \${1:name}(\${2:s: param}) {
    \${0}
};`, { label: 'func', detail: 'Function without return value' }),
  snippetCompletion(`func \${1:name}(\${2:s: param} -> \${3:i}) {
    \${0}
    return \${4:value};
};`, { label: 'funcr', detail: 'Function with return value' }),
  snippetCompletion(`func \${1:name}(-> \${2:i}) {
    return \${0};
};`, { label: 'funcnp', detail: 'Function without params, with return' }),
  snippetCompletion(`func \${1:name}() {
    \${0}
};`, { label: 'funcv', detail: 'Void function without params' }),
  snippetCompletion(`fiber \${1:name}(\${2:s: param} -> \${3:json}) {
    \${0}
    yield \${4:value};
};`, { label: 'fiber', detail: 'Typed fiber — yield returns value' }),
  snippetCompletion(`fiber \${1:name}(\${2:s: param}) {
    \${0}
    yield;
};`, { label: 'fiberv', detail: 'Void fiber — yield without value' }),
  snippetCompletion(`fiber \${1:handle_name}(json: req -> json) {
    \${0}
    yield net.respond(200, <<< {"status": "ok"} >>>);
};`, { label: 'fiberh', detail: 'HTTP handler fiber — signature required by serve:' }),
  snippetCompletion(`fiber:\${1:b}: \${2:f} = \${3:fiber_name}(\${4:args});
\${1}: \${5:result} = \${2}.next();`, { label: 'fiberi', detail: 'Create typed fiber and get first yielded value' }),
  snippetCompletion(`fiber: \${1:f} = \${2:fiber_name}(\${3:args});
\${1}.run();`, { label: 'fiberiv', detail: 'Create void fiber and run one step' }),
  snippetCompletion(`fiber \${1:pipeline}(\${2:s: param} -> \${3:b}) {
    fiber:\${4:b}: \${5:step1} = \${6:check_one}(\${2});
    yield \${5}.next();

    fiber:\${4}: \${7:step2} = \${8:check_two}(\${2});
    yield \${7}.next();
};`, { label: 'fiberpipe', detail: 'Fiber calling other fibers (pipeline pattern)' }),
  snippetCompletion(`while (\${1:f}.isDone() == false) do;
    \${2:type}: \${3:val} = \${1}.next();
    \${0}
end;`, { label: 'fiberloop', detail: 'Consume fiber until done' }),
  snippetCompletion(`for \${1:val} in \${2:f} do;
    \${0}
end;`, { label: 'forfib', detail: 'for loop over fiber (auto-calls .next, .close on break)' }),
  snippetCompletion(`fiber:\${1:i}: \${2:sub} = \${3:fiber_name}(\${4:args});
yield from \${2};`, { label: 'yieldfrom', detail: 'Delegate yielding to a sub-fiber (yield from)' }),
  snippetCompletion(`if (\${1:condition}) then;
    \${0}
end;`, { label: 'if', detail: 'If statement' }),
  snippetCompletion(`if (\${1:condition}) then;
    \${2}
else;
    \${0}
end;`, { label: 'ifelse', detail: 'If-else statement' }),
  snippetCompletion(`if (\${1:condition}) then;
    \${2}
elif (\${3:condition2}) then;
    \${4}
else;
    \${0}
end;`, { label: 'ifelif', detail: 'If-elif-else (also: elf, els aliases)' }),
  snippetCompletion(`if (\${1:!ok}) then; \${0}; end;`, { label: 'ifg', detail: 'Single-line inline guard' }),
  snippetCompletion(`if (!\${1:ok}) then;
    yield net.respond(\${2:401}, <<< {"error": "\${3:Unauthorized}"} >>>);
    return;
end;`, { label: 'ifguard', detail: 'Auth/validation guard with early return' }),
  snippetCompletion(`while (\${1:condition}) do;
    \${0}
end;`, { label: 'while', detail: 'While loop' }),
  snippetCompletion(`for \${1:i} in \${2:0} to \${3:n} do;
    \${0}
end;`, { label: 'forr', detail: 'For loop — inclusive range [start, end]' }),
  snippetCompletion(`for \${1:i} in \${2:0} to \${3:n} @step \${4:2} do;
    \${0}
end;`, { label: 'forrs', detail: 'For loop with step' }),
  snippetCompletion(`for \${1:item} in \${2:collection} do;
    \${0}
end;`, { label: 'forin', detail: 'For loop over array, set or fiber' }),
  snippetCompletion(`for \${1:i} in 0 to (\${2:arr}.size() - 1) do;
    \${3:type}: \${4:val} = \${2}.get(\${1});
    \${0}
end;`, { label: 'foridx', detail: 'For loop with explicit index' }),
  snippetCompletion(`table: \${1:name} {
    columns = [
        id     :: i @auto,
        \${2:field} :: \${3:s}
    ]
    rows = [EMPTY]
};`, { label: 'table', detail: 'Empty table with @auto id' }),
  snippetCompletion(`table: \${1:name} {
    columns = [
        id     :: i @auto,
        \${2:name}  :: s,
        \${3:price} :: f
    ]
    rows = [
        ("\${4:Item}", \${5:9.99})
    ]
};`, { label: 'tabledata', detail: 'Table with initial rows' }),
  snippetCompletion(`table: \${1:result} = \${2:tbl}.where(\${3:column} == \${4:value});`, { label: 'where', detail: 'Filter table rows' }),
  snippetCompletion(`table: \${1:result} = \${2:tbl}
    .where(\${3:col1} == \${4:val1})
    .where(\${5:col2} == \${6:val2});`, { label: 'wherechain', detail: 'Chained .where() filters' }),
  snippetCompletion(`table: \${1:result} = \${2:tbl}.where(row -> row.\${3:field} > \${4:value});`, { label: 'wherelambda', detail: 'Filter with lambda row -> expr' }),
  snippetCompletion(`table: \${1:result} = \${2:tbl}.where(\${3:column} HAS "\${4:substring}");`, { label: 'wherehas', detail: 'Filter rows where string column contains substring' }),
  snippetCompletion(`table: \${1:result} = \${2:tableA}.join(\${3:tableB}, "\${4:id}", "\${5:ref_id}");`, { label: 'join', detail: 'Inner join two tables on key columns' }),
  snippetCompletion(`table: \${1:result} = \${2:tableA}.join(\${3:tableB}, (a, b) -> a.\${4:id} == b.\${5:ref_id});`, { label: 'joinlambda', detail: 'Inner join two tables with lambda predicate' }),
  snippetCompletion(`\${1:tbl}.insert(\${0:values});`, { label: 'insert', detail: 'Insert row (skip @auto columns)' }),
  snippetCompletion(`\${1:tbl}.add(\${0:values});`, { label: 'tadd', detail: 'Add row — alias for .insert() (skip @auto columns)' }),
  snippetCompletion(`\${1:tbl}.add(\${2:col} = \${3:val});`, { label: 'taddn', detail: 'Add row with named arguments (order-independent)' }),
  snippetCompletion(`\${1:tbl}.update(\${2:idx}, [\${0:values}]);`, { label: 'update', detail: 'Update row by index' }),
  snippetCompletion(`\${1:tbl}.delete(\${2:idx});`, { label: 'delete', detail: 'Delete row by index' }),
  snippetCompletion(`i: \${1:total} = \${2:tbl}.count();`, { label: 'tcount', detail: 'Get number of rows in table' }),
  snippetCompletion(`\${1:tbl}.show();`, { label: 'tshow', detail: 'Print table in ASCII format to terminal' }),
  snippetCompletion(`json: \${1:result} = \${2:tbl}.toJson();`, { label: 'ttojson', detail: 'Serialize table to JSON array of objects' }),
  snippetCompletion(`\${1:type}: \${2:val} = \${3:tbl}.get(\${4:idx}).\${5:field};`, { label: 'tget', detail: 'Get field value from table row' }),
  snippetCompletion(`i: \${1:found_idx} = -1;
i: \${2:total} = \${3:tbl}.count();
i: \${4:fi} = 0;
while (\${4:fi} < \${2:total}) do;
    if (\${3:tbl}.get(\${4:fi}).\${5:id} == \${6:target}) then;
        \${1:found_idx} = \${4:fi};
        break;
    end;
    \${4:fi} = \${4:fi} + 1;
end;
if (\${1:found_idx} == -1) then; \${0}; end;`, { label: 'tfind', detail: 'Find row index by field value (returns -1 if not found)' }),
  snippetCompletion(`json: \${1:name} <<< {\${0}} >>>;`, { label: 'jsonraw', detail: 'JSON raw block literal' }),
  snippetCompletion(`json: \${1:data} = json.parse(\${2:raw_string});`, { label: 'jsonp', detail: 'Parse JSON string (panics on invalid JSON — R305)' }),
  snippetCompletion(`\${1:obj}.set("\${2:key}", \${3:value});`, { label: 'jset', detail: 'Set JSON field value' }),
  snippetCompletion(`\${1:type}: \${2:var};
\${3:obj}.bind("\${4:key}", \${2:var});`, { label: 'jbind', detail: 'Extract JSON field into typed variable' }),
  snippetCompletion(`if (\${1:obj}.exists("\${2:key}")) then;
    \${0}
end;`, { label: 'jexists', detail: 'Check if JSON key exists before binding' }),
  snippetCompletion(`\${1:obj}.get("\${2:items}").push(\${3:item});`, { label: 'jpush', detail: 'Append item to a JSON array node (halt.error if node is object)' }),
  snippetCompletion(`s: \${1:path} = "\${2:items}[" + \${3:idx} + "]";
\${4:obj}.set(\${1:path}, \${5:item});`, { label: 'jbracket', detail: 'Set JSON array element via bracket notation' }),
  snippetCompletion(`map: \${1:mapping} {
    schema = [s <-> s]
    data   = ["\${2:col}" :: "\${3:json_key}"]
};
\${4:json_obj}.inject("\${5:array_key}", \${1:mapping}, \${6:tbl});`, { label: 'jinject', detail: 'Bulk import JSON array into XCX table' }),
  snippetCompletion(`s: \${1:str} = \${2:obj}.toStr();`, { label: 'jstr', detail: 'Serialize JSON to string' }),
  snippetCompletion(`json: \${1:resp} <<< {"status": "ok", "\${2:key}": \${3:0}} >>>;
\${1:resp}.set("\${2:key}", \${4:value});
yield net.respond(\${5:200}, \${1:resp});`, { label: 'jresp', detail: 'Build mutable JSON response and yield' }),
  snippetCompletion(`i: \${1:len} = \${2:obj}.size();`, { label: 'jsize', detail: 'Number of keys (object) or elements (array)' }),
  snippetCompletion(`json: \${1:row} = \${2:arr}.first();`, { label: 'jfirst', detail: 'First element of JSON array (halt.error if empty)' }),
  snippetCompletion(`\${1:type}: \${2:var};
\${3:obj}.bind("\${4:parent}.\${5:child}", \${2:var});`, { label: 'jbindpath', detail: 'Bind nested JSON field using dot-notation path' }),
  snippetCompletion(`array:\${1:i,f,s,b,json}: \${2:name} {\${0}};`, { label: 'array', detail: 'Array declaration (includes array:json)' }),
  snippetCompletion(`array:\${1:i,f,s,b,json}: \${2:name} {};`, { label: 'arraye', detail: 'Empty array' }),
  snippetCompletion(`i: \${1:size} = \${2:arr}.size();
i: \${3:idx} = 0;
while (\${3:idx} < \${1:size}) do;
    json: \${4:item} = \${2:arr}.get(\${3:idx});
    \${0}
    \${3:idx} = \${3:idx} + 1;
end;`, { label: 'arrayjsonloop', detail: 'Iterate over array:json with index' }),
  snippetCompletion(`set:\${1:N,Z,Q,C}: \${2:name} {\${3:1},,\${4:10}};`, { label: 'setr', detail: 'Set with inclusive range' }),
  snippetCompletion(`set:\${1:N,Z,Q}: \${2:name} {\${3:0},,\${4:100} @step \${5:2}};`, { label: 'setrs', detail: 'Set with range and step' }),
  snippetCompletion(`set:\${1:N,Z,Q,S,B,C}: \${2:name} {\${0}};`, { label: 'sete', detail: 'Set with explicit elements' }),
  snippetCompletion(`set:\${1:N}: \${2:result} = \${3:setA} UNION \${4:setB};`, { label: 'setunion', detail: 'Set union — A ∪ B' }),
  snippetCompletion(`set:\${1:N}: \${2:result} = \${3:setA} INTERSECTION \${4:setB};`, { label: 'setintersect', detail: 'Set intersection — A ∩ B' }),
  snippetCompletion(`set:\${1:N}: \${2:result} = \${3:setA} DIFFERENCE \${4:setB};`, { label: 'setdiff', detail: 'Set difference — A \ B' }),
  snippetCompletion(`set:\${1:N}: \${2:result} = \${3:setA} SYMMETRIC_DIFFERENCE \${4:setB};`, { label: 'setsymdiff', detail: 'Symmetric difference — A ⊕ B' }),
  snippetCompletion(`\${1:mySet}.add(\${2:value});`, { label: 'setadd', detail: 'Add element to set (ignores duplicate)' }),
  snippetCompletion(`\${1:mySet}.remove(\${2:value});`, { label: 'setremove', detail: 'Remove element from set (no-op if not present)' }),
  snippetCompletion(`b: \${1:found} = \${2:mySet}.contains(\${3:value});`, { label: 'setcontains', detail: 'Check if element exists in set' }),
  snippetCompletion(`for \${1:el} in \${2:mySet} do;
    \${0}
end;`, { label: 'forset', detail: 'Iterate over all elements in a set' }),
  snippetCompletion(`\${1:i}: \${2:picked} = random.choice from \${3:my_set};`, { label: 'randchoice', detail: 'Pick random element from set or array' }),
  snippetCompletion(`i: \${1:val} = random.int(\${2:1}, \${3:100});`, { label: 'randint', detail: 'Random integer in range [min, max] (step=1 by default)' }),
  snippetCompletion(`i: \${1:val} = random.int(\${2:0}, \${3:10} @step \${4:2});`, { label: 'randints', detail: 'Random integer from stepped range (e.g. even numbers)' }),
  snippetCompletion(`f: \${1:val} = random.float(\${2:0.0}, \${3:1.0});`, { label: 'randfloat', detail: 'Random float in range [min, max] (step=0.5 by default)' }),
  snippetCompletion(`f: \${1:val} = random.float(\${2:0.0}, \${3:1.0} @step \${4:0.25});`, { label: 'randfloats', detail: 'Random float from stepped range' }),
  snippetCompletion(`map: \${1:name} {
    schema = [\${2:s} <-> \${3:i}]
    data   = [EMPTY]
};`, { label: 'map', detail: 'Empty map' }),
  snippetCompletion(`map: \${1:name} {
    schema = [\${2:s} <-> \${3:i}]
    data   = [
        "\${4:key}" :: \${5:value}
    ]
};`, { label: 'mapd', detail: 'Map with initial data' }),
  snippetCompletion(`if (\${1:m}.contains(\${2:key})) then;
    \${3:type}: \${4:val} = \${1:m}.get(\${2:key});
    \${0}
end;`, { label: 'mapget', detail: 'Safe map access with .contains() guard' }),
  snippetCompletion(`json: \${1:result} = \${2:myMap}.toJson();`, { label: 'maptojson', detail: 'Serialize map to JSON object (keys converted to strings)' }),
  snippetCompletion(`array:\${1:s}: \${2:keys} = \${3:m}.keys();
array:\${4:i}: \${5:vals} = \${3:m}.values();`, { label: 'mapkv', detail: 'Get arrays of keys and values from map' }),
  snippetCompletion(`i: \${1:len} = \${2:str}.length;`, { label: 'strlen', detail: 'String length (property, no parentheses)' }),
  snippetCompletion(`s: \${1:upper} = \${2:str}.upper();
s: \${3:lower} = \${2:str}.lower();`, { label: 'strcase', detail: 'Convert string to upper/lower case' }),
  snippetCompletion(`s: \${1:clean} = \${2:str}.trim();`, { label: 'strtrim', detail: 'Remove leading and trailing whitespace' }),
  snippetCompletion(`s: \${1:result} = \${2:str}.replace("\${3:find}", "\${4:replace}");`, { label: 'strreplace', detail: 'Replace all occurrences of a substring' }),
  snippetCompletion(`s: \${1:part} = \${2:str}.slice(\${3:0}, \${4:5});`, { label: 'strslice', detail: 'Substring from index start up to end (exclusive)' }),
  snippetCompletion(`i: \${1:idx}  = \${2:str}.indexOf("\${3:search}");
i: \${4:ridx} = \${2:str}.lastIndexOf("\${3:search}");`, { label: 'strindex', detail: 'Index of first/last occurrence (-1 if not found)' }),
  snippetCompletion(`array:s: \${1:parts} = \${2:str}.split("\${3:,}");`, { label: 'strsplit', detail: 'Split string by separator into array' }),
  snippetCompletion(`b: \${1:starts} = \${2:str}.startsWith("\${3:prefix}");
b: \${4:ends}   = \${2:str}.endsWith("\${5:suffix}");`, { label: 'strbound', detail: 'Check string prefix/suffix' }),
  snippetCompletion(`i: \${1:num} = \${2:str}.toInt();`, { label: 'strparse', detail: 'Parse string to int (halt.error if invalid)' }),
  snippetCompletion(`s: \${1:result} = \${2:raw}.trim().lower().replace("\${3:-}", "\${4:_}");`, { label: 'strchain', detail: 'Common string normalization chain' }),
  snippetCompletion(`i: \${1:combined} = \${2:48} ++ \${3:77};`, { label: 'strconcat', detail: 'Integer digit concatenation: 48 ++ 77 → 4877' }),
  snippetCompletion(`halt.alert >! "\${1:message}";`, { label: 'alert', detail: 'Warning — program continues (log/debug)' }),
  snippetCompletion(`halt.error >! "\${1:message}";`, { label: 'herror', detail: 'Error — stops current frame, caller continues' }),
  snippetCompletion(`halt.fatal >! "\${1:message}";`, { label: 'fatal', detail: 'Fatal — immediately terminates entire VM' }),
  snippetCompletion(`if (\${1:divisor} == 0) then;
    halt.error >! "Division by zero in \${2:context}";
    return \${3:-1};
end;
\${4:type}: \${5:result} = \${6:num} / \${1:divisor};`, { label: 'safediv', detail: 'Guard against division by zero' }),
  snippetCompletion(`store.write("\${1:file.txt}", \${2:content});`, { label: 'storewrite', detail: 'Write string to file (creates if missing)' }),
  snippetCompletion(`if (store.exists("\${1:file.txt}")) then;
    s: \${2:content} = store.read("\${1:file.txt}");
    \${0}
end;`, { label: 'storeread', detail: 'Read file with exists() guard' }),
  snippetCompletion(`store.append("\${1:file.txt}", \${2:content});`, { label: 'storeappend', detail: 'Append to file' }),
  snippetCompletion(`store.delete("\${1:path}");`, { label: 'storedelete', detail: 'Remove file or directory (recursive)' }),
  snippetCompletion(`array:s: \${1:entries} = store.list("\${2:path}");`, { label: 'storelist', detail: 'List files and folders at path' }),
  snippetCompletion(`b: \${1:is_dir} = store.isDir("\${2:path}");`, { label: 'storeisdir', detail: 'Check if path is a directory' }),
  snippetCompletion(`i: \${1:bytes} = store.size("\${2:file.txt}");`, { label: 'storesize', detail: 'File size in bytes' }),
  snippetCompletion(`store.mkdir("\${1:path/to/dir}");`, { label: 'storemkdir', detail: 'Create directory (recursive)' }),
  snippetCompletion(`array:s: \${1:matches} = store.glob("\${2:*.xcx}");`, { label: 'storeglob', detail: 'List files matching glob pattern' }),
  snippetCompletion(`store.zip("\${1:source}", "\${2:archive.zip}");
store.unzip("\${2:archive.zip}", "\${3:dest}");`, { label: 'storezip', detail: 'Zip and unzip operations' }),
  snippetCompletion(`date: \${1:now} = date.now();`, { label: 'datenow', detail: 'Get current date and time' }),
  snippetCompletion(`date: \${1:d} = date("\${2:2026-01-01}");`, { label: 'datelit', detail: 'Date from ISO string' }),
  snippetCompletion(`date: \${1:d} = date("\${2:25/12/2024}", "\${3:DD/MM/YYYY}");`, { label: 'datelitf', detail: 'Date from string with custom format' }),
  snippetCompletion(`s: \${1:str} = \${2:now}.format("\${3:DD/MM/YYYY HH:mm}");`, { label: 'datefmt', detail: 'Format date to string' }),
  snippetCompletion(`date: \${1:tomorrow}   = \${2:today} + 1;
date: \${3:yesterday}  = \${2:today} - 1;`, { label: 'datearith', detail: 'Add/subtract days from a date' }),
  snippetCompletion(`i: \${1:days} = \${2:date_a} - \${3:date_b};`, { label: 'datediff', detail: 'Number of days between two dates (integer result)' }),
  snippetCompletion(`i: \${1:yr}  = \${2:d}.year;
i: \${3:mo}  = \${2:d}.month;
i: \${4:day} = \${2:d}.day;
i: \${5:hr}  = \${2:d}.hour;
i: \${6:min} = \${2:d}.minute;
i: \${7:sec} = \${2:d}.second;`, { label: 'dateprop', detail: 'Access all date/time fields (read-only integers)' }),
  snippetCompletion(`date: \${1:now} = date.now();
s: \${2:key} = \${3:ip} + ":" + \${1:now}.hour + ":" + \${1:now}.minute;`, { label: 'ratelimitkey', detail: 'Build per-minute rate limit key from IP + timestamp' }),
  snippetCompletion(`s: \${1:value} = env.get("\${2:ENV_VAR}");`, { label: 'envget', detail: 'Get environment variable (halt.error if not set)' }),
  snippetCompletion(`array:s: \${1:args} = env.args();`, { label: 'envargs', detail: 'Get CLI arguments passed to the program' }),
  snippetCompletion(`array:s: \${1:args} = env.args();
for \${2:arg} in \${1:args} do;
    >! \${2:arg};
end;`, { label: 'envargsloop', detail: 'Get and iterate over CLI arguments' }),
  snippetCompletion(`s: \${1:k} = input.key();`, { label: 'inputkey', detail: 'Read key if available, empty string if not (normal mode)' }),
  snippetCompletion(`s: \${1:k} = input.key() @wait;`, { label: 'inputkeyw', detail: 'Block until a key is pressed and return it' }),
  snippetCompletion(`b: \${1:has_key} = input.ready();`, { label: 'inputready', detail: 'true if a key is waiting in the buffer' }),
  snippetCompletion(`s: \${1:k} = input.key();
if (\${1:k} == "UP") then;
    \${2:y} = \${2:y} - 1;
elif (\${1:k} == "DOWN") then;
    \${2:y} = \${2:y} + 1;
elif (\${1:k} == "LEFT") then;
    \${3:x} = \${3:x} - 1;
elif (\${1:k} == "RIGHT") then;
    \${3:x} = \${3:x} + 1;
elif (\${1:k} == "ESC") then;
    \${0}
end;`, { label: 'inputhandle', detail: 'Arrow key + ESC input handler' }),
  snippetCompletion(`include "\${1:module.xcx}";`, { label: 'inc', detail: 'Include module into current namespace' }),
  snippetCompletion(`include "\${1:module.xcx}" as \${2:alias};`, { label: 'incas', detail: 'Include module with alias prefix' }),
  snippetCompletion(`>! \${0};`, { label: 'print', detail: 'Print output (>!)' }),
  snippetCompletion(`>! "\${1:Prompt}:";
\${1:i,f,s,b}: \${3:var};
>? \${3:var};`, { label: 'input', detail: 'Print prompt and read input (>?)' }),
  snippetCompletion(`@wait \${1:500};`, { label: 'wait', detail: 'Synchronous delay in milliseconds' }),
];
