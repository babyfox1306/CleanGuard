import * as vscode from 'vscode';
import { Issue } from '../core/analyzer';

export class DiagnosticProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('cleanguard');
    }

    showDiagnostics(document: vscode.TextDocument, issues: Issue[]) {
        const diagnostics: vscode.Diagnostic[] = issues.map(issue => {
            const range = new vscode.Range(
                issue.line - 1,
                issue.column - 1,
                issue.line - 1,
                issue.column - 1
            );

            const diagnostic = new vscode.Diagnostic(
                range,
                `[CleanGuard] ${issue.message}`,
                this.getSeverity(issue.severity)
            );

            diagnostic.source = 'CleanGuard';
            diagnostic.code = issue.rule;
            diagnostic.tags = this.getTags(issue.category);

            return diagnostic;
        });

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    clearDiagnostics(document?: vscode.TextDocument) {
        if (document) {
            this.diagnosticCollection.delete(document.uri);
        } else {
            this.diagnosticCollection.clear();
        }
    }

    private getSeverity(severity: 'error' | 'warning' | 'info'): vscode.DiagnosticSeverity {
        switch (severity) {
            case 'error':
                return vscode.DiagnosticSeverity.Error;
            case 'warning':
                return vscode.DiagnosticSeverity.Warning;
            case 'info':
            default:
                return vscode.DiagnosticSeverity.Information;
        }
    }

    private getTags(category: 'security' | 'performance' | 'style'): vscode.DiagnosticTag[] {
        const tags: vscode.DiagnosticTag[] = [];
        
        switch (category) {
            case 'performance':
                tags.push(vscode.DiagnosticTag.Unnecessary);
                break;
            case 'style':
                tags.push(vscode.DiagnosticTag.Unnecessary);
                break;
        }
        
        return tags;
    }

    dispose() {
        this.diagnosticCollection.dispose();
    }
}
