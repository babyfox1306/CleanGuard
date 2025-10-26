import { Issue } from '../../core/analyzer';

export class StyleRules {
    async analyze(code: string, fileName: string): Promise<Issue[]> {
        const issues: Issue[] = [];
        const lines = code.split('\n');

        // Check for style issues
        issues.push(...this.checkVarUsage(lines, fileName));
        issues.push(...this.checkEqualityOperators(lines, fileName));
        issues.push(...this.checkConsoleStatements(lines, fileName));
        issues.push(...this.checkDebuggerStatements(lines, fileName));
        issues.push(...this.checkMagicNumbers(lines, fileName));

        return issues;
    }

    private checkVarUsage(lines: string[], fileName: string): Issue[] {
        const issues: Issue[] = [];

        lines.forEach((line, index) => {
            if (/^\s*var\s+/.test(line)) {
                issues.push({
                    line: index + 1,
                    column: 1,
                    message: 'Use let or const instead of var to avoid hoisting issues.',
                    severity: 'warning',
                    rule: 'prefer-let-const',
                    category: 'style'
                });
            }
        });

        return issues;
    }

    private checkEqualityOperators(lines: string[], fileName: string): Issue[] {
        const issues: Issue[] = [];

        lines.forEach((line, index) => {
            if (/==[^=]/.test(line) && !line.includes('!==')) {
                issues.push({
                    line: index + 1,
                    column: 1,
                    message: 'Use === instead of == to avoid type coercion.',
                    severity: 'warning',
                    rule: 'prefer-strict-equality',
                    category: 'style'
                });
            }
        });

        return issues;
    }

    private checkConsoleStatements(lines: string[], fileName: string): Issue[] {
        const issues: Issue[] = [];

        lines.forEach((line, index) => {
            if (/console\.(log|debug|info|warn|error)\s*\(/.test(line)) {
                issues.push({
                    line: index + 1,
                    column: 1,
                    message: 'Remove console statements before production deployment.',
                    severity: 'info',
                    rule: 'no-console-statements',
                    category: 'style'
                });
            }
        });

        return issues;
    }

    private checkDebuggerStatements(lines: string[], fileName: string): Issue[] {
        const issues: Issue[] = [];

        lines.forEach((line, index) => {
            if (/^\s*debugger\s*;?\s*$/.test(line)) {
                issues.push({
                    line: index + 1,
                    column: 1,
                    message: 'Remove debugger statements before production deployment.',
                    severity: 'warning',
                    rule: 'no-debugger-statements',
                    category: 'style'
                });
            }
        });

        return issues;
    }

    private checkMagicNumbers(lines: string[], fileName: string): Issue[] {
        const issues: Issue[] = [];

        lines.forEach((line, index) => {
            // Check for magic numbers (hardcoded numbers that should be constants)
            const magicNumberPattern = /\b(?:[2-9]|[1-9]\d+)\b/g;
            const matches = line.match(magicNumberPattern);
            
            if (matches) {
                // Skip common numbers that are usually fine
                const commonNumbers = ['0', '1', '100', '1000', '24', '60', '365'];
                const suspiciousNumbers = matches.filter(num => !commonNumbers.includes(num));
                
                if (suspiciousNumbers.length > 0) {
                    issues.push({
                        line: index + 1,
                        column: 1,
                        message: `Magic number detected: ${suspiciousNumbers[0]}. Consider using a named constant.`,
                        severity: 'info',
                        rule: 'no-magic-numbers',
                        category: 'style'
                    });
                }
            }
        });

        return issues;
    }
}
