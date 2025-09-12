
// Batch TypeScript AST extraction - processes multiple files in one program
const path = require('path');
const fs = require('fs');

// Find project root by going up from .pf directory
const projectRoot = path.resolve(__dirname, '..');

// Build path to TypeScript module
const tsPath = path.join(projectRoot, '.auditor_venv', '.theauditor_tools', 'node_modules', 'typescript', 'lib', 'typescript.js');

// Load TypeScript
let ts;
try {
    if (!fs.existsSync(tsPath)) {
        throw new Error(`TypeScript not found at: ${tsPath}`);
    }
    ts = require(tsPath);
} catch (error) {
    console.error(JSON.stringify({
        success: false,
        error: `Failed to load TypeScript: ${error.message}`
    }));
    process.exit(1);
}

// Get request and output paths from command line
const requestPath = process.argv[2];
const outputPath = process.argv[3];

if (!requestPath || !outputPath) {
    console.error(JSON.stringify({ error: "Request and output paths required" }));
    process.exit(1);
}

try {
    // Read batch request
    const request = JSON.parse(fs.readFileSync(requestPath, 'utf8'));
    const filePaths = request.files || [];
    
    if (filePaths.length === 0) {
        fs.writeFileSync(outputPath, JSON.stringify({}), 'utf8');
        process.exit(0);
    }
    
    // Create a SINGLE TypeScript program with ALL files
    // This is the key optimization - TypeScript will parse dependencies ONCE
    const program = ts.createProgram(filePaths, {
        target: ts.ScriptTarget.Latest,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.Preserve,
        allowJs: true,
        checkJs: false,
        noEmit: true,
        skipLibCheck: true,  // Skip checking .d.ts files for speed
        moduleResolution: ts.ModuleResolutionKind.NodeJs
    });
    
    const checker = program.getTypeChecker();
    const results = {};
    
    // Process each file using the SHARED program
    for (const filePath of filePaths) {
        try {
            const sourceFile = program.getSourceFile(filePath);
            if (!sourceFile) {
                results[filePath] = {
                    success: false,
                    error: `Could not load source file: ${filePath}`
                };
                continue;
            }
            
            const sourceCode = sourceFile.text;
            
            // Helper function to serialize AST nodes (same as single-file version)
            function serializeNode(node, depth = 0) {
                if (depth > 100) return { kind: "TooDeep" };
                
                const result = {
                    kind: node.kind !== undefined ? (ts.SyntaxKind[node.kind] || node.kind) : 'Unknown',
                    kindValue: node.kind || 0,
                    pos: node.pos || 0,
                    end: node.end || 0,
                    flags: node.flags || 0
                };
                
                if (node.text !== undefined) result.text = node.text;
                
                if (node.name) {
                    if (typeof node.name === 'object') {
                        if (node.name.escapedText !== undefined) {
                            result.name = node.name.escapedText;
                        } else if (node.name.text !== undefined) {
                            result.name = node.name.text;
                        } else {
                            result.name = serializeNode(node.name, depth + 1);
                        }
                    } else {
                        result.name = node.name;
                    }
                }
                
                if (node.type) {
                    result.type = serializeNode(node.type, depth + 1);
                }
                
                const children = [];
                if (node.members && Array.isArray(node.members)) {
                    node.members.forEach(member => {
                        if (member) children.push(serializeNode(member, depth + 1));
                    });
                }
                ts.forEachChild(node, child => {
                    if (child) children.push(serializeNode(child, depth + 1));
                });
                
                if (children.length > 0) {
                    result.children = children;
                }
                
                // CRITICAL FIX: Use getStart() to exclude leading trivia for accurate line numbers
                const actualStart = node.getStart ? node.getStart(sourceFile) : node.pos;
                const { line, character } = sourceFile.getLineAndCharacterOfPosition(actualStart);
                result.line = line + 1;
                result.column = character;
                // RESTORED: Text extraction needed for accurate symbol names in taint analysis
                result.text = sourceCode.substring(node.pos, node.end).trim();
                
                return result;
            }
            
            // Collect diagnostics for this file
            const diagnostics = [];
            const fileDiagnostics = ts.getPreEmitDiagnostics(program, sourceFile);
            fileDiagnostics.forEach(diagnostic => {
                const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
                const location = diagnostic.file && diagnostic.start
                    ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
                    : null;
                
                diagnostics.push({
                    message,
                    category: ts.DiagnosticCategory[diagnostic.category],
                    code: diagnostic.code,
                    line: location ? location.line + 1 : null,
                    column: location ? location.character : null
                });
            });
            
            // Collect symbols for this file
            const symbols = [];
            function visit(node) {
                try {
                    const symbol = checker.getSymbolAtLocation(node);
                    if (symbol && symbol.getName) {
                        const type = checker.getTypeOfSymbolAtLocation(symbol, node);
                        const typeString = checker.typeToString(type);
                        
                        symbols.push({
                            name: symbol.getName ? symbol.getName() : 'anonymous',
                            kind: symbol.flags ? (ts.SymbolFlags[symbol.flags] || symbol.flags) : 0,
                            type: typeString || 'unknown',
                            line: node.pos !== undefined ? sourceFile.getLineAndCharacterOfPosition(node.pos).line + 1 : 0
                        });
                    }
                } catch (e) {
                    // Log error for debugging
                    console.error(`[ERROR] Symbol extraction failed at ${filePath}:${node.pos}: ${e.message}`);
                }
                ts.forEachChild(node, visit);
            }
            visit(sourceFile);
            
            // Log symbol extraction results
            console.error(`[INFO] Found ${symbols.length} symbols in ${filePath}`);
            
            // Build result for this file
            const result = {
                success: true,
                fileName: filePath,
                languageVersion: ts.ScriptTarget[sourceFile.languageVersion],
                ast: serializeNode(sourceFile),
                diagnostics: diagnostics,
                symbols: symbols,
                nodeCount: 0,
                hasTypes: symbols.some(s => s.type && s.type !== 'any')
            };
            
            // Count nodes
            function countNodes(node) {
                if (!node) return;
                result.nodeCount++;
                if (node.children && Array.isArray(node.children)) {
                    node.children.forEach(countNodes);
                }
            }
            if (result.ast) countNodes(result.ast);
            
            results[filePath] = result;
            
        } catch (error) {
            results[filePath] = {
                success: false,
                error: `Error processing file: ${error.message}`,
                ast: null,
                diagnostics: [],
                symbols: []
            };
        }
    }
    
    // Write all results to output file
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
    process.exit(0);
    
} catch (error) {
    console.error(JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
    }));
    process.exit(1);
}
