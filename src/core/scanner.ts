import * as vscode from 'vscode';
import * as path from 'path';
import { Analyzer, AnalysisResult } from './analyzer';
import { MetricsCalculator, QualityMetrics } from './metrics';

export interface WorkspaceScanResult {
    totalFiles: number;
    totalIssues: number;
    qualityMetrics: QualityMetrics;
    fileResults: AnalysisResult[];
    scanDuration: number;
}

export class Scanner {
    private analyzer: Analyzer;
    private metricsCalculator: MetricsCalculator;

    constructor() {
        this.analyzer = new Analyzer();
        this.metricsCalculator = new MetricsCalculator();
    }

    async scanWorkspace(workspaceFolder: vscode.WorkspaceFolder): Promise<WorkspaceScanResult> {
        const startTime = Date.now();
        
        // Find all TypeScript/JavaScript files
        const pattern = new vscode.RelativePattern(workspaceFolder, '**/*.{ts,js,tsx,jsx}');
        const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**');
        
        const fileResults: AnalysisResult[] = [];
        let totalIssues = 0;
        let totalLinesOfCode = 0;
        let totalComplexity = 0;
        let totalMaintainability = 0;
        let totalDuplication = 0;

        // Process files in batches to avoid overwhelming the system
        const batchSize = 10;
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (file) => {
                try {
                    const document = await vscode.workspace.openTextDocument(file);
                    const issues = await this.analyzer.analyzeFile(document);
                    const metrics = this.metricsCalculator.calculateMetrics(document.getText(), file.fsPath);
                    
                    const result: AnalysisResult = {
                        file: file.fsPath,
                        issues,
                        metrics: {
                            complexity: metrics.complexity,
                            maintainability: metrics.maintainability,
                            duplication: metrics.duplication
                        }
                    };

                    // Update totals
                    totalIssues += issues.length;
                    totalLinesOfCode += metrics.linesOfCode;
                    totalComplexity += metrics.complexity;
                    totalMaintainability += metrics.maintainability;
                    totalDuplication += metrics.duplication;

                    return result;
                } catch (error) {
                    console.error(`Failed to scan ${file.fsPath}:`, error);
                    return null;
                }
            });

            const batchResults = await Promise.all(batchPromises);
            fileResults.push(...batchResults.filter(result => result !== null) as AnalysisResult[]);
        }

        // Calculate overall workspace metrics
        const avgComplexity = fileResults.length > 0 ? totalComplexity / fileResults.length : 0;
        const avgMaintainability = fileResults.length > 0 ? totalMaintainability / fileResults.length : 0;
        const avgDuplication = fileResults.length > 0 ? totalDuplication / fileResults.length : 0;
        
        const overallQualityScore = Math.round(
            (Math.max(0, 100 - avgComplexity * 5) * 0.3) +
            (avgMaintainability * 0.4) +
            (Math.max(0, 100 - avgDuplication) * 0.3)
        );

        const qualityMetrics: QualityMetrics = {
            complexity: Math.round(avgComplexity),
            maintainability: Math.round(avgMaintainability),
            duplication: Math.round(avgDuplication),
            linesOfCode: totalLinesOfCode,
            qualityScore: overallQualityScore
        };

        const scanDuration = Date.now() - startTime;

        return {
            totalFiles: fileResults.length,
            totalIssues,
            qualityMetrics,
            fileResults,
            scanDuration
        };
    }

    async scanChangedFiles(): Promise<AnalysisResult[]> {
        const results: AnalysisResult[] = [];
        
        // Get all open editors
        const openEditors = vscode.window.tabGroups.all
            .flatMap(group => group.tabs)
            .map(tab => tab.input)
            .filter(input => input instanceof vscode.TabInputText)
            .map(input => (input as vscode.TabInputText).uri);

        for (const uri of openEditors) {
            try {
                const document = await vscode.workspace.openTextDocument(uri);
                if (document.languageId === 'typescript' || document.languageId === 'javascript') {
                    const issues = await this.analyzer.analyzeFile(document);
                    const metrics = this.metricsCalculator.calculateMetrics(document.getText(), uri.fsPath);
                    
                    results.push({
                        file: uri.fsPath,
                        issues,
                        metrics: {
                            complexity: metrics.complexity,
                            maintainability: metrics.maintainability,
                            duplication: metrics.duplication
                        }
                    });
                }
            } catch (error) {
                console.error(`Failed to scan ${uri.fsPath}:`, error);
            }
        }

        return results;
    }

    generateScanReport(result: WorkspaceScanResult): string {
        let report = `# CleanGuard Workspace Scan Report\n\n`;
        report += `**Scan completed in ${result.scanDuration}ms**\n\n`;
        
        report += `## Summary\n`;
        report += `- **Files Scanned**: ${result.totalFiles}\n`;
        report += `- **Total Issues**: ${result.totalIssues}\n`;
        report += `- **Overall Quality Score**: ${result.qualityMetrics.qualityScore}/100\n\n`;
        
        report += `## Quality Metrics\n`;
        report += `- **Average Complexity**: ${result.qualityMetrics.complexity}\n`;
        report += `- **Average Maintainability**: ${result.qualityMetrics.maintainability}/100\n`;
        report += `- **Average Duplication**: ${result.qualityMetrics.duplication}%\n`;
        report += `- **Total Lines of Code**: ${result.qualityMetrics.linesOfCode}\n\n`;
        
        if (result.totalIssues > 0) {
            report += `## Files with Issues\n`;
            const filesWithIssues = result.fileResults.filter(file => file.issues.length > 0);
            
            filesWithIssues.forEach(file => {
                report += `- **${path.basename(file.file)}**: ${file.issues.length} issues\n`;
            });
        }
        
        return report;
    }
}
