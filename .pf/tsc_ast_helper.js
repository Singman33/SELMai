
// Use TypeScript from our sandbox location with RELATIVE PATH
// This is portable - works on any machine in any location
const path = require('path');
const fs = require('fs');

// Find project root by going up from .pf directory
const projectRoot = path.resolve(__dirname, '..');

// Build path to TypeScript module relative to project root
const tsPath = path.join(projectRoot, '.auditor_venv', '.theauditor_tools', 'node_modules', 'typescript', 'lib', 'typescript.js');

// Try to load TypeScript with helpful error message
let ts;
try {
    if (!fs.existsSync(tsPath)) {
        throw new Error(`TypeScript not found at expected location: ${tsPath}. Run 'aud setup-claude' to install tools.`);
    }
    ts = require(tsPath);
} catch (error) {
    console.error(JSON.stringify({
        success: false,
        error: `Failed to load TypeScript: ${error.message}`,
        expectedPath: tsPath,
        projectRoot: projectRoot
    }));
    process.exit(1);
}

// Get file path and output path from command line arguments
const filePath = process.argv[2];
const outputPath = process.argv[3];

if (!filePath || !outputPath) {
    console.error(JSON.stringify({ error: "File path and output path required" }));
    process.exit(1);
}

try {
    // Read the source file
    const sourceCode = fs.readFileSync(filePath, 'utf8');
    
    // Create a source file object
    const sourceFile = ts.createSourceFile(
        filePath,
        sourceCode,
        ts.ScriptTarget.Latest,
        true,  // setParentNodes - important for full AST traversal
        ts.ScriptKind.TSX  // Support both TS and TSX
    );
    
    // Helper function to serialize AST nodes
    function serializeNode(node, depth = 0) {
        if (depth > 100) {  // Prevent infinite recursion
            return { kind: "TooDeep" };
        }
        
        const result = {
            kind: node.kind !== undefined ? (ts.SyntaxKind[node.kind] || node.kind) : 'Unknown',
            kindValue: node.kind || 0,
            pos: node.pos || 0,
            end: node.end || 0,
            flags: node.flags || 0
        };
        
        // Add text content for leaf nodes
        if (node.text !== undefined) {
            result.text = node.text;
        }
        
        // Add identifier name
        if (node.name) {
            if (typeof node.name === 'object') {
                // Handle both escapedName and regular name
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
        
        // Add type information if available
        if (node.type) {
            result.type = serializeNode(node.type, depth + 1);
        }
        
        // Add children - handle nodes with members property
        const children = [];
        if (node.members && Array.isArray(node.members)) {
            // Handle nodes with members (interfaces, enums, etc.)
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
        
        // Get line and column information
        // CRITICAL FIX: Use getStart() to exclude leading trivia for accurate line numbers
        const actualStart = node.getStart ? node.getStart(sourceFile) : node.pos;
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(actualStart);
        result.line = line + 1;  // Convert to 1-indexed
        result.column = character;
        
        // RESTORED: Text extraction needed for accurate symbol names in taint analysis
        result.text = sourceCode.substring(node.pos, node.end).trim();
        
        return result;
    }
    
    // Collect diagnostics (errors, warnings)
    const diagnostics = [];
    const program = ts.createProgram([filePath], {
        target: ts.ScriptTarget.Latest,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.Preserve,
        allowJs: true,
        checkJs: false,
        noEmit: true,
        skipLibCheck: true  // Skip checking .d.ts files for speed
    });
    
    const allDiagnostics = ts.getPreEmitDiagnostics(program);
    allDiagnostics.forEach(diagnostic => {
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
    
    // Collect symbols and type information
    const checker = program.getTypeChecker();
    const symbols = [];
    
    // Visit nodes to collect symbols
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
    
    // Output the complete AST with metadata
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
    
    // Write output to file instead of stdout to avoid pipe buffer limits
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
    process.exit(0);  // CRITICAL: Ensure clean exit on success
    
} catch (error) {
    console.error(JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
    }));
    process.exit(1);
}
