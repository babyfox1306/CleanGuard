import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ESLint } from 'eslint';
import { SecurityRules } from '../rules/security';
import { PerformanceRules } from '../rules/performance';
import { StyleRules } from '../rules/style';
import { ConfigLoader, CleanGuardConfig } from './configLoader';

export interface AnalysisResult {
    file: string;
    issues: Issue[];
    metrics: {
        complexity: number;
        maintainability: number;
        duplication: number;
    };
}

export interface Issue {
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
    rule: string;
    category: 'security' | 'performance' | 'style';
}

export class Analyzer {
    private eslint: ESLint;
    private securityRules: SecurityRules;
    private performanceRules: PerformanceRules;
    private styleRules: StyleRules;
    private configLoader: ConfigLoader;
    private config: CleanGuardConfig | null = null;

    constructor() {
        this.securityRules = new SecurityRules();
        this.performanceRules = new PerformanceRules();
        this.styleRules = new StyleRules();
        this.configLoader = new ConfigLoader();
        this.initializeESLint();
    }

    private async initializeESLint() {
        this.eslint = new ESLint({
            useEslintrc: false,
            baseConfig: {
                parser: '@typescript-eslint/parser',
                parserOptions: {
                    ecmaVersion: 2020,
                    sourceType: 'module',
                },
                rules: {
                    // Basic TypeScript rules
                    '@typescript-eslint/no-unused-vars': 'warn',
                    '@typescript-eslint/no-explicit-any': 'warn',
                    '@typescript-eslint/prefer-const': 'error',
                    'eqeqeq': 'error',
                    'no-var': 'error',
                }
            }
        });
    }

    async analyzeFile(document: vscode.TextDocument): Promise<Issue[]> {
        // Load config if not already loaded
        if (!this.config) {
            this.config = await this.configLoader.loadConfig();
        }

        // Check if analysis is enabled
        if (!this.config.enabled) {
            return [];
        }

        // Check if file should be excluded
        if (this.configLoader.isFileExcluded(document.fileName, this.config)) {
            return [];
        }

        // Check if file is too large
        if (this.configLoader.isFileTooLarge(document.fileName, this.config)) {
            return [{
                line: 1,
                column: 1,
                message: `File is too large (${Math.round(fs.statSync(document.fileName).size / 1024)}KB). Skipping analysis.`,
                severity: 'info',
                rule: 'file-too-large',
                category: 'performance'
            }];
        }

        const issues: Issue[] = [];

        // Run ESLint analysis
        try {
            const eslintResults = await this.eslint.lintText(document.getText(), {
                filePath: document.fileName
            });

            for (const result of eslintResults) {
                for (const message of result.messages) {
                    issues.push({
                        line: message.line || 1,
                        column: message.column || 1,
                        message: message.message,
                        severity: message.severity === 2 ? 'error' : 'warning',
                        rule: message.ruleId || 'unknown',
                        category: this.categorizeRule(message.ruleId || 'unknown')
                    });
                }
            }
        } catch (error) {
            console.error('ESLint analysis failed:', error);
        }

        // Run custom rules based on configuration
        if (this.config.rules.security) {
            const securityIssues = await this.securityRules.analyze(document.getText(), document.fileName);
            issues.push(...securityIssues);
        }

        if (this.config.rules.performance) {
            const performanceIssues = await this.performanceRules.analyze(document.getText(), document.fileName);
            issues.push(...performanceIssues);
        }

        if (this.config.rules.style) {
            const styleIssues = await this.styleRules.analyze(document.getText(), document.fileName);
            issues.push(...styleIssues);
        }

        return issues;
    }

    async analyzeWorkspace(workspaceFolder: vscode.WorkspaceFolder): Promise<AnalysisResult[]> {
        const results: AnalysisResult[] = [];
        
        // Load config
        if (!this.config) {
            this.config = await this.configLoader.loadConfig();
        }
        
        // Find all TypeScript/JavaScript files
        const pattern = new vscode.RelativePattern(workspaceFolder, '**/*.{ts,js,tsx,jsx}');
        const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**');

        // Process files in batches for better performance
        const batchSize = 5;
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (file) => {
                try {
                    // Check if file should be excluded
                    if (this.configLoader.isFileExcluded(file.fsPath, this.config!)) {
                        return null;
                    }

                    // Check if file is too large
                    if (this.configLoader.isFileTooLarge(file.fsPath, this.config!)) {
                        return {
                            file: file.fsPath,
                            issues: [{
                                line: 1,
                                column: 1,
                                message: 'File too large, skipped analysis',
                                severity: 'info' as const,
                                rule: 'file-too-large',
                                category: 'performance' as const
                            }],
                            metrics: {
                                complexity: 0,
                                maintainability: 0,
                                duplication: 0
                            }
                        };
                    }

                    const document = await vscode.workspace.openTextDocument(file);
                    const issues = await this.analyzeFile(document);
                    
                    results.push({
                        file: file.fsPath,
                        issues,
                        metrics: this.calculateMetrics(document.getText())
                    });

                    return null; // We already added to results
                } catch (error) {
                    console.error(`Failed to analyze ${file.fsPath}:`, error);
                    return null;
                }
            });

            await Promise.all(batchPromises);
        }

        return results;
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
                issue.severity === 'error' ? vscode.DiagnosticSeverity.Error :
                issue.severity === 'warning' ? vscode.DiagnosticSeverity.Warning :
                vscode.DiagnosticSeverity.Information
            );

            diagnostic.source = 'CleanGuard';
            diagnostic.code = issue.rule;
            return diagnostic;
        });

        const diagnosticCollection = vscode.languages.createDiagnosticCollection('cleanguard');
        diagnosticCollection.set(document.uri, diagnostics);
    }

    private categorizeRule(ruleId: string): 'security' | 'performance' | 'style' {
        if (ruleId.includes('security') || ruleId.includes('no-eval') || ruleId.includes('no-innerHTML')) {
            return 'security';
        }
        if (ruleId.includes('performance') || ruleId.includes('no-for-in') || ruleId.includes('no-document-write')) {
            return 'performance';
        }
        return 'style';
    }

    private calculateMetrics(code: string) {
        // Simple metrics calculation
        const lines = code.split('\n').length;
        const complexity = this.calculateCyclomaticComplexity(code);
        const maintainability = Math.max(0, 100 - (complexity * 5) - (lines / 10));
        
        return {
            complexity,
            maintainability: Math.round(maintainability),
            duplication: 0 // Will be implemented with jscpd later
        };
    }

    private calculateCyclomaticComplexity(code: string): number {
        // Simple cyclomatic complexity calculation
        const complexityKeywords = [
            'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', '&&', '||', '?'
        ];
        
        let complexity = 1; // Base complexity
        for (const keyword of complexityKeywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const matches = code.match(regex);
            if (matches) {
                complexity += matches.length;
            }
        }
        
        return complexity;
    }
}
