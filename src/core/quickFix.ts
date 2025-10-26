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
            const quickFix = this.createQuickFix(document, diagnostic, rule);
            if (quickFix) {
                actions.push(quickFix);
            }
        }

        return actions;
    }

    private createQuickFix(document: vscode.TextDocument, diagnostic: vscode.Diagnostic, rule: string): vscode.CodeAction | null {
        const action = new vscode.CodeAction(
            `Fix: ${rule}`,
            vscode.CodeActionKind.QuickFix
        );

        action.diagnostics = [diagnostic];
        action.isPreferred = true;

        switch (rule) {
            case 'prefer-let-const':
                return this.createVarToLetFix(document, action, diagnostic);
            
            case 'prefer-strict-equality':
                return this.createEqualityFix(document, action, diagnostic);
            
            case 'no-console-statements':
                return this.createConsoleFix(document, action, diagnostic);
            
            case 'no-debugger-statements':
                return this.createDebuggerFix(document, action, diagnostic);
            
            case 'no-magic-numbers':
                return this.createMagicNumberFix(document, action, diagnostic);
            
            case 'no-for-in-on-arrays':
                return this.createForInFix(document, action, diagnostic);
            
            case 'cache-array-length':
                return this.createArrayLengthFix(document, action, diagnostic);
            
            default:
                return null;
        }
    }

    private createVarToLetFix(document: vscode.TextDocument, action: vscode.CodeAction, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        action.edit = new vscode.WorkspaceEdit();
        action.edit.replace(
            document.uri,
            diagnostic.range,
            document.getText(diagnostic.range).replace(/var\s+/, 'let ')
        );
        return action;
    }

    private createEqualityFix(document: vscode.TextDocument, action: vscode.CodeAction, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        action.edit = new vscode.WorkspaceEdit();
        action.edit.replace(
            document.uri,
            diagnostic.range,
            document.getText(diagnostic.range).replace(/==/g, '===')
        );
        return action;
    }

    private createConsoleFix(document: vscode.TextDocument, action: vscode.CodeAction, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        action.edit = new vscode.WorkspaceEdit();
        const text = document.getText(diagnostic.range);
        action.edit.replace(
            document.uri,
            diagnostic.range,
            `// ${text}`
        );
        return action;
    }

    private createDebuggerFix(document: vscode.TextDocument, action: vscode.CodeAction, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        action.edit = new vscode.WorkspaceEdit();
        const text = document.getText(diagnostic.range);
        action.edit.replace(
            document.uri,
            diagnostic.range,
            `// ${text}`
        );
        return action;
    }

    private createMagicNumberFix(document: vscode.TextDocument, action: vscode.CodeAction, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        action.edit = new vscode.WorkspaceEdit();
        const text = document.getText(diagnostic.range);
        const magicNumber = text.match(/\b(?:[2-9]|[1-9]\d+)\b/)?.[0];
        
        if (magicNumber) {
            const constantName = `CONSTANT_${magicNumber}`.toUpperCase();
            action.edit.replace(
                document.uri,
                diagnostic.range,
                text.replace(magicNumber, constantName)
            );
        }
        return action;
    }

    private createForInFix(document: vscode.TextDocument, action: vscode.CodeAction, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        action.edit = new vscode.WorkspaceEdit();
        const text = document.getText(diagnostic.range);
        
        const forInMatch = text.match(/for\s*\(\s*(var|let|const)\s+(\w+)\s+in\s+([^)]+)\)/);
        if (forInMatch) {
            const [, declType, varName, arrayName] = forInMatch;
            const newText = text.replace(
                /for\s*\(\s*(var|let|const)\s+(\w+)\s+in\s+([^)]+)\)/,
                `for (${declType} ${varName} of ${arrayName})`
            );
            action.edit.replace(
                document.uri,
                diagnostic.range,
                newText
            );
        }
        return action;
    }

    private createArrayLengthFix(document: vscode.TextDocument, action: vscode.CodeAction, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        action.edit = new vscode.WorkspaceEdit();
        const text = document.getText(diagnostic.range);
        
        const arrayMatch = text.match(/(\w+)\.length/);
        if (arrayMatch) {
            const arrayName = arrayMatch[1];
            const newText = text.replace(
                new RegExp(`${arrayName}\\.length`, 'g'),
                `${arrayName}Length`
            );
            
            const lines = text.split('\n');
            const loopLineIndex = lines.findIndex((line: string) => line.includes('for'));
            if (loopLineIndex > 0) {
                const lengthDeclaration = `const ${arrayName}Length = ${arrayName}.length;\n`;
                action.edit.insert(
                    document.uri,
                    new vscode.Position(loopLineIndex, 0),
                    lengthDeclaration
                );
            }
            
            action.edit.replace(
                document.uri,
                diagnostic.range,
                newText
            );
        }
        return action;
    }
}
