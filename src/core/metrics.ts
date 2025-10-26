import * as vscode from 'vscode';

export interface QualityMetrics {
    complexity: number;
    maintainability: number;
    duplication: number;
    linesOfCode: number;
    qualityScore: number;
}

export class MetricsCalculator {
    calculateMetrics(code: string, fileName: string): QualityMetrics {
        const lines = code.split('\n');
        const linesOfCode = lines.filter(line => 
            line.trim().length > 0 && !line.trim().startsWith('//')
        ).length;

        const complexity = this.calculateCyclomaticComplexity(code);
        const maintainability = this.calculateMaintainabilityIndex(code, complexity);
        const duplication = this.calculateDuplication(code);
        const qualityScore = this.calculateQualityScore(complexity, maintainability, duplication);

        return {
            complexity,
            maintainability,
            duplication,
            linesOfCode,
            qualityScore
        };
    }

    private calculateCyclomaticComplexity(code: string): number {
        const complexityKeywords = [
            'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', 
            '&&', '||', '?', 'try', 'throw', 'return'
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

    private calculateMaintainabilityIndex(code: string, complexity: number): number {
        const lines = code.split('\n');
        const totalLines = lines.length;
        
        // Halstead Volume approximation
        const operators = code.match(/[+\-*/=<>!&|^%~?:]/g)?.length || 0;
        const operands = code.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g)?.length || 0;
        
        const volume = (operators + operands) * Math.log2(operators + operands + 1);
        
        // Maintainability Index formula (simplified)
        const maintainability = Math.max(0, Math.min(100, 
            171 - 5.2 * Math.log(volume) - 0.23 * complexity - 16.2 * Math.log(totalLines)
        ));
        
        return Math.round(maintainability);
    }

    private calculateDuplication(code: string): number {
        // Simple duplication detection based on repeated lines
        const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 10);
        const lineCounts = new Map<string, number>();
        
        for (const line of lines) {
            lineCounts.set(line, (lineCounts.get(line) || 0) + 1);
        }
        
        let duplicatedLines = 0;
        for (const count of lineCounts.values()) {
            if (count > 1) {
                duplicatedLines += count - 1;
            }
        }
        
        return Math.round((duplicatedLines / lines.length) * 100);
    }

    private calculateQualityScore(complexity: number, maintainability: number, duplication: number): number {
        // Weighted quality score
        const complexityScore = Math.max(0, 100 - (complexity * 5));
        const maintainabilityScore = maintainability;
        const duplicationScore = Math.max(0, 100 - duplication);
        
        return Math.round((complexityScore * 0.3 + maintainabilityScore * 0.4 + duplicationScore * 0.3));
    }

    generateQualityReport(metrics: QualityMetrics): string {
        let report = `# CleanGuard Quality Report\n\n`;
        report += `## Overall Quality Score: ${metrics.qualityScore}/100\n\n`;
        
        report += `### Metrics Breakdown:\n`;
        report += `- **Cyclomatic Complexity**: ${metrics.complexity} (${this.getComplexityRating(metrics.complexity)})\n`;
        report += `- **Maintainability Index**: ${metrics.maintainability}/100 (${this.getMaintainabilityRating(metrics.maintainability)})\n`;
        report += `- **Code Duplication**: ${metrics.duplication}% (${this.getDuplicationRating(metrics.duplication)})\n`;
        report += `- **Lines of Code**: ${metrics.linesOfCode}\n\n`;
        
        report += `### Recommendations:\n`;
        if (metrics.complexity > 10) {
            report += `- Consider breaking down complex functions into smaller ones\n`;
        }
        if (metrics.maintainability < 50) {
            report += `- Improve code readability and reduce complexity\n`;
        }
        if (metrics.duplication > 20) {
            report += `- Extract common code into reusable functions\n`;
        }
        
        return report;
    }

    private getComplexityRating(complexity: number): string {
        if (complexity <= 5) return 'Low (Good)';
        if (complexity <= 10) return 'Moderate';
        if (complexity <= 20) return 'High';
        return 'Very High (Needs Refactoring)';
    }

    private getMaintainabilityRating(maintainability: number): string {
        if (maintainability >= 80) return 'Excellent';
        if (maintainability >= 60) return 'Good';
        if (maintainability >= 40) return 'Fair';
        return 'Poor (Needs Improvement)';
    }

    private getDuplicationRating(duplication: number): string {
        if (duplication <= 5) return 'Low (Good)';
        if (duplication <= 15) return 'Moderate';
        if (duplication <= 30) return 'High';
        return 'Very High (Needs Refactoring)';
    }
}
