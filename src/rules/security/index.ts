import { Issue } from '../core/analyzer';

export class SecurityRules {
    private secretPatterns = [
        /(?:password|passwd|pwd)\s*[:=]\s*["'][^"']+["']/gi,
        /(?:api[_-]?key|apikey)\s*[:=]\s*["'][^"']+["']/gi,
        /(?:secret|token|auth[_-]?token)\s*[:=]\s*["'][^"']+["']/gi,
        /(?:private[_-]?key|privatekey)\s*[:=]\s*["'][^"']+["']/gi,
        /(?:access[_-]?key|accesskey)\s*[:=]\s*["'][^"']+["']/gi,
    ];

    private sqlInjectionPatterns = [
        /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\+.*/gi,
        /INSERT\s+INTO\s+.*\s+VALUES\s*\(.*\+.*\)/gi,
        /UPDATE\s+.*\s+SET\s+.*\+.*\s+WHERE/gi,
        /DELETE\s+FROM\s+.*\s+WHERE\s+.*\+.*/gi,
    ];

    private xssPatterns = [
        /\.innerHTML\s*=/gi,
        /\.outerHTML\s*=/gi,
        /document\.write\s*\(/gi,
        /eval\s*\(/gi,
    ];

    async analyze(code: string, fileName: string): Promise<Issue[]> {
        const issues: Issue[] = [];
        const lines = code.split('\n');

        // Check for hardcoded secrets
        issues.push(...this.checkHardcodedSecrets(lines, fileName));

        // Check for SQL injection patterns
        issues.push(...this.checkSQLInjection(lines, fileName));

        // Check for XSS vulnerabilities
        issues.push(...this.checkXSSVulnerabilities(lines, fileName));

        // Check for eval usage
        issues.push(...this.checkEvalUsage(lines, fileName));

        // Check for innerHTML usage
        issues.push(...this.checkInnerHTMLUsage(lines, fileName));

        return issues;
    }

    private checkHardcodedSecrets(lines: string[], fileName: string): Issue[] {
        const issues: Issue[] = [];

        lines.forEach((line, index) => {
            for (const pattern of this.secretPatterns) {
                if (pattern.test(line)) {
                    issues.push({
                        line: index + 1,
                        column: 1,
                        message: 'Hardcoded secret detected. Use environment variables instead.',
                        severity: 'error',
                        rule: 'no-hardcoded-secrets',
                        category: 'security'
                    });
                }
            }
        });

        return issues;
    }

    private checkSQLInjection(lines: string[], fileName: string): Issue[] {
        const issues: Issue[] = [];

        lines.forEach((line, index) => {
            for (const pattern of this.sqlInjectionPatterns) {
                if (pattern.test(line)) {
                    issues.push({
                        line: index + 1,
                        column: 1,
                        message: 'Potential SQL injection vulnerability. Use parameterized queries.',
                        severity: 'error',
                        rule: 'no-sql-injection',
                        category: 'security'
                    });
                }
            }
        });

        return issues;
    }

    private checkXSSVulnerabilities(lines: string[], fileName: string): Issue[] {
        const issues: Issue[] = [];

        lines.forEach((line, index) => {
            for (const pattern of this.xssPatterns) {
                if (pattern.test(line)) {
                    issues.push({
                        line: index + 1,
                        column: 1,
                        message: 'Potential XSS vulnerability. Sanitize user input before rendering.',
                        severity: 'warning',
                        rule: 'no-xss-vulnerability',
                        category: 'security'
                    });
                }
            }
        });

        return issues;
    }

    private checkEvalUsage(lines: string[], fileName: string): Issue[] {
        const issues: Issue[] = [];

        lines.forEach((line, index) => {
            if (/eval\s*\(/.test(line)) {
                issues.push({
                    line: index + 1,
                    column: 1,
                    message: 'eval() usage detected. This is dangerous and should be avoided.',
                    severity: 'error',
                    rule: 'no-eval',
                    category: 'security'
                });
            }
        });

        return issues;
    }

    private checkInnerHTMLUsage(lines: string[], fileName: string): Issue[] {
        const issues: Issue[] = [];

        lines.forEach((line, index) => {
            if (/\.innerHTML\s*=/.test(line)) {
                issues.push({
                    line: index + 1,
                    column: 1,
                    message: 'innerHTML usage detected. Use textContent or sanitize input to prevent XSS.',
                    severity: 'warning',
                    rule: 'no-innerHTML',
                    category: 'security'
                });
            }
        });

        return issues;
    }
}
