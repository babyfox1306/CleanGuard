import * as vscode from 'vscode';
import { Analyzer } from './core/analyzer';
import { Scanner } from './core/scanner';
import { MetricsCalculator } from './core/metrics';
import { StatusBarProvider } from './providers/statusBar';
import { TimelineProvider } from './providers/timelineView';
import { DiagnosticProvider } from './providers/diagnosticProvider';
import { Exporter } from './utils/exporter';
import { QuickFixProvider } from './core/quickFix';

let analyzer: Analyzer;
let scanner: Scanner;
let metricsCalculator: MetricsCalculator;
let statusBar: StatusBarProvider;
let timelineProvider: TimelineProvider;
let diagnosticProvider: DiagnosticProvider;
let exporter: Exporter;
let quickFixProvider: QuickFixProvider;

export function activate(context: vscode.ExtensionContext) {
    console.log('CleanGuard extension is now active!');

    // Initialize core components
    analyzer = new Analyzer();
    scanner = new Scanner();
    metricsCalculator = new MetricsCalculator();
    statusBar = new StatusBarProvider();
    timelineProvider = new TimelineProvider(context);
    diagnosticProvider = new DiagnosticProvider();
    exporter = new Exporter();
    quickFixProvider = new QuickFixProvider();

    // Register code action provider for quick fixes
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            { scheme: 'file', language: 'typescript' },
            quickFixProvider,
            {
                providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
            }
        )
    );

    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            { scheme: 'file', language: 'javascript' },
            quickFixProvider,
            {
                providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
            }
        )
    );

    // Register commands
    const reviewFileCommand = vscode.commands.registerCommand('cleanguard.reviewFile', async () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showWarningMessage('No active file to review');
            return;
        }

        const document = activeEditor.document;
        if (document.languageId !== 'typescript' && document.languageId !== 'javascript') {
            vscode.window.showWarningMessage('CleanGuard currently supports TypeScript and JavaScript only');
            return;
        }

        try {
            vscode.window.setStatusBarMessage('CleanGuard: Analyzing file...', 2000);
            const issues = await analyzer.analyzeFile(document);
            const metrics = metricsCalculator.calculateMetrics(document.getText(), document.fileName);
            
            // Show diagnostics
            diagnosticProvider.showDiagnostics(document, issues);
            
            if (issues.length === 0) {
                vscode.window.showInformationMessage('✅ No issues found in current file');
            } else {
                vscode.window.showWarningMessage(`Found ${issues.length} issues in current file`);
            }
            
            // Update status bar
            statusBar.updateIssueCount(issues.length);
            
            // Save to timeline with enhanced data
            await timelineProvider.saveReview(document.fileName, document.fileName, issues, metrics);
            
            // Show quality report
            const report = metricsCalculator.generateQualityReport(metrics);
            const doc = await vscode.workspace.openTextDocument({
                content: report,
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
            
        } catch (error) {
            vscode.window.showErrorMessage(`CleanGuard analysis failed: ${error}`);
        }
    });

    const reviewWorkspaceCommand = vscode.commands.registerCommand('cleanguard.reviewWorkspace', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showWarningMessage('No workspace folder found');
            return;
        }

        try {
            vscode.window.setStatusBarMessage('CleanGuard: Analyzing workspace...', 5000);
            const result = await scanner.scanWorkspace(workspaceFolder);
            
            if (result.totalIssues === 0) {
                vscode.window.showInformationMessage('✅ No issues found in workspace');
            } else {
                vscode.window.showWarningMessage(`Found ${result.totalIssues} issues across ${result.totalFiles} files`);
            }
            
            // Update status bar
            statusBar.updateIssueCount(result.totalIssues);
            
            // Show scan report
            const report = scanner.generateScanReport(result);
            const doc = await vscode.workspace.openTextDocument({
                content: report,
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
            
        } catch (error) {
            vscode.window.showErrorMessage(`CleanGuard workspace analysis failed: ${error}`);
        }
    });

    const showTimelineCommand = vscode.commands.registerCommand('cleanguard.showTimeline', () => {
        timelineProvider.showTimeline();
    });

    const exportCSVCommand = vscode.commands.registerCommand('cleanguard.exportCSV', async () => {
        await exporter.exportToCSV();
    });

    const exportJSONCommand = vscode.commands.registerCommand('cleanguard.exportJSON', async () => {
        await exporter.exportToJSON();
    });

    const exportReportCommand = vscode.commands.registerCommand('cleanguard.exportReport', async () => {
        await exporter.exportQualityReport();
    });

    // Register all commands
    context.subscriptions.push(reviewFileCommand);
    context.subscriptions.push(reviewWorkspaceCommand);
    context.subscriptions.push(showTimelineCommand);
    context.subscriptions.push(exportCSVCommand);
    context.subscriptions.push(exportJSONCommand);
    context.subscriptions.push(exportReportCommand);

    // Register timeline view
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('cleanguardTimeline', timelineProvider)
    );

    // Auto-analyze on file save
    const onSaveListener = vscode.workspace.onDidSaveTextDocument(async (document) => {
        const config = vscode.workspace.getConfiguration('cleanguard');
        if (!config.get('enabled', true)) {
            return;
        }

        if (document.languageId === 'typescript' || document.languageId === 'javascript') {
            try {
                const issues = await analyzer.analyzeFile(document);
                const metrics = metricsCalculator.calculateMetrics(document.getText(), document.fileName);
                diagnosticProvider.showDiagnostics(document, issues);
                statusBar.updateIssueCount(issues.length);
                await timelineProvider.saveReview(document.fileName, document.fileName, issues, metrics);
            } catch (error) {
                console.error('Auto-analysis failed:', error);
            }
        }
    });

    context.subscriptions.push(onSaveListener);

    // Initialize status bar
    statusBar.show();
}

export function deactivate() {
    if (statusBar) {
        statusBar.dispose();
    }
    if (diagnosticProvider) {
        diagnosticProvider.dispose();
    }
}
