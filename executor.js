const userCode = process.argv[2];
const vm = require('vm');
const acorn = require('acorn');
const walk = require('acorn-walk');

let capturedOutput = '';
let errorDetails = null; // To store structured error information

// Create a new VM context
const context = vm.createContext({
    console: {
        log: (...args) => {
            args.forEach(arg => {
                capturedOutput += (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg) + String.fromCharCode(10);
            });
        },
        error: (...args) => {
            args.forEach(arg => {
                capturedOutput += 'Error: ' + (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg) + String.fromCharCode(10);
            });
        }
    },
    // Custom function to capture expression results
    __captureResult: (value) => {
        if (value !== undefined) {
            let displayValue;
            if (typeof value === 'function') {
                displayValue = value.name ? `[Function: ${value.name}]` : '[Function]';
            } else {
                try {
                    displayValue = JSON.stringify(value);
                } catch (e) {
                    displayValue = value.toString();
                }
            }
            capturedOutput += `=> ${displayValue}` + String.fromCharCode(10);
        }
    }
});

let transformedCode = '';

try {
    const ast = acorn.parse(userCode, { ecmaVersion: 2020, sourceType: 'script', locations: true }); // locations: true to get line/column

    let lastNodeEnd = 0;

    walk.simple(ast, {
        ExpressionStatement(node) {
            transformedCode += userCode.substring(lastNodeEnd, node.start);
            const expressionCode = userCode.substring(node.expression.start, node.expression.end);
            transformedCode += `__captureResult(${expressionCode});`;
            lastNodeEnd = node.end;
        },
        VariableDeclaration(node) {
            transformedCode += userCode.substring(lastNodeEnd, node.end);
            lastNodeEnd = node.end;
        },
        FunctionDeclaration(node) {
            transformedCode += userCode.substring(lastNodeEnd, node.end);
            lastNodeEnd = node.end;
        },
    });

    transformedCode += userCode.substring(lastNodeEnd);

    vm.runInContext(transformedCode, context, {
        displayErrors: false,
        timeout: 5000
    });

} catch (e) {
    errorDetails = {
        type: e.name || 'Error',
        message: e.message,
        stack: e.stack,
        line: e.loc ? e.loc.line : undefined, // For SyntaxError from acorn
        column: e.loc ? e.loc.column : undefined
    };

    // For runtime errors from vm.runInContext, try to parse stack trace for line/column
    if (!errorDetails.line && e.stack) {
        const stackLines = e.stack.split('\n');
        const atUserCode = stackLines.find(line => line.includes('<anonymous>')); // Look for lines related to user code
        if (atUserCode) {
            const match = atUserCode.match(/<anonymous>:(\d+):(\d+)/);
            if (match) {
                errorDetails.line = parseInt(match[1]);
                errorDetails.column = parseInt(match[2]);
            }
        }
    }
}

// Output a single JSON object to stdout
process.stdout.write(JSON.stringify({
    output: capturedOutput,
    error: errorDetails
}));