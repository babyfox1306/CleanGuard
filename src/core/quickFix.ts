import * as vscode from 'vscode';
import { Issue } from '../core/analyzer';

export class QuickFixProvider {
    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
        const actions: vscode.CodeAction[] = [];

        // Get diagnostics from CleanGuard
        const cleanguardDiagnostics = context.diagnostics.filter(
            diagnostic => diagnostic.source === 'CleanGuard'
        );

        for (const diagnostic of cleanguardDiagnostics) {
            const rule = diagnostic.code as string;
            const quickFix = this.createQuickFix(diagnostic, rule);
            if (quickFix) {
                actions.push(quickFix);
            }
        }

        return actions;
    }

    private createQuickFix(diagnostic: vscode.Diagnostic, rule: string): vscode.CodeAction | null {
        const action = new vscode.CodeAction(
            `Fix: ${rule}`,
            vscode.CodeActionKind.QuickFix
        );

        action.diagnostics = [diagnostic];
        action.isPreferred = true;

        switch (rule) {
            case 'prefer-let-const':
                return this.createVarToLetFix(action, diagnostic);
            
            case 'prefer-strict-equality':
                return this.createEqualityFix(action, diagnostic);
            
            case 'no-console-statements':
                return this.createConsoleFix(action, diagnostic);
            
            case 'no-debugger-statements':
                return this.createDebuggerFix(action, diagnostic);
            
            case 'no-magic-numbers':
                return this.createMagicNumberFix(action, diagnostic);
            
            case 'no-for-in-on-arrays':
                return this.createForInFix(action, diagnostic);
            
            case 'cache-array-length':
                return this.createArrayLengthFix(action, diagnostic);
            
            default:
                return null;
        }
    }

    private createVarToLetFix(action: vscode.CodeAction, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        action.edit = new vscode.WorkspaceEdit();
        action.edit.replace(
            diagnostic.range.document.uri,
            diagnostic.range,
            diagnostic.range.document.getText(diagnostic.range).replace(/var\s+/, 'let ')
        );
        return action;
    }

    private createEqualityFix(action: vscode.CodeAction, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        action.edit = new vscode.WorkspaceEdit();
        action.edit.replace(
            diagnostic.range.document.uri,
            diagnostic.range,
            diagnostic.range.document.getText(diagnostic.range).replace(/==/g, '===')
        );
        return action;
    }

    private createConsoleFix(action: vscode.CodeAction, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        action.edit = new vscode.WorkspaceEdit();
        // Comment out the console statement
        const text = diagnostic.range.document.getText(diagnostic.range);
        action.edit.replace(
            diagnostic.range.document.uri,
            diagnostic.range,
            `// ${text}`
        );
        return action;
    }

    private createDebuggerFix(action: vscode.CodeAction, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        action.edit = new vscode.WorkspaceEdit();
        // Comment out the debugger statement
        const text = diagnostic.range.document.getText(diagnostic.range);
        action.edit.replace(
            diagnostic.range.document.uri,
            diagnostic.range,
            `// ${text}`
        );
        return action;
    }

    private createMagicNumberFix(action: vscode.CodeAction, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        action.edit = new vscode.WorkspaceEdit();
        const text = diagnostic.range.document.getText(diagnostic.range);
        const magicNumber = text.match(/\b(?:[2-9]|[1-9]\d+)\b/)?.[0];
        
        if (magicNumber) {
            const constantName = `CONSTANT_${magicNumber}`.toUpperCase();
            action.edit.replace(
                diagnostic.range.document.uri,
                diagnostic.range,
                text.replace(magicNumber, constantName)
            );
        }
        return action;
    }

    private createForInFix(action: vscode.CodeAction, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        action.edit = new vscode.WorkspaceEdit();
        const text = diagnostic.range.document.getText(diagnostic.range);
        
        // Convert for...in to for...of
        const forInMatch = text.match(/for\s*\(\s*(var|let|const)\s+(\w+)\s+in\s+([^)]+)\)/);
        if (forInMatch) {
            const [, declType, varName, arrayName] = forInMatch;
            const newText = text.replace(
                /for\s*\(\s*(var|let|const)\s+(\w+)\s+in\s+([^)]+)\)/,
                `for (${declType} ${varName} of ${arrayName})`
            );
            action.edit.replace(
                diagnostic.range.document.uri,
                diagnostic.range,
                newText
            );
        }
        return action;
    }

    private createArrayLengthFix(action: vscode.CodeAction, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        action.edit = new vscode.WorkspaceEdit();
        const text = diagnostic.range.document.getText(diagnostic.range);
        
        // Extract array name and cache length
        const arrayMatch = text.match(/(\w+)\.length/);
        if (arrayMatch) {
            const arrayName = arrayMatch[1];
            const newText = text.replace(
                new RegExp(`${arrayName}\\.length`, 'g'),
                `${arrayName}Length`
            );
            
            // Add length variable declaration before the loop
            const lines = text.split('\n');
            const loopLineIndex = lines.findIndex(line => line.includes('for'));
            if (loopLineIndex > 0) {
                const lengthDeclaration = `const ${arrayName}Length = ${arrayName}.length;\n`;
                action.edit.insert(
                    diagnostic.range.document.uri,
                    new vscode.Position(loopLineIndex, 0),
                    lengthDeclaration
                );
            }
            
            action.edit.replace(
                diagnostic.range.document.uri,
                diagnostic.range,
                newText
            );
        }
        return action;
    }
}
