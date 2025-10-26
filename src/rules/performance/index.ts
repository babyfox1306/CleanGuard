import { Issue } from '../../core/analyzer';

export class PerformanceRules {
    async analyze(code: string, fileName: string): Promise<Issue[]> {
        const issues: Issue[] = [];
        const lines = code.split('\n');

        // Check for performance anti-patterns
        issues.push(...this.checkForInOnArrays(lines, fileName));
        issues.push(...this.checkDocumentWrite(lines, fileName));
        issues.push(...this.checkHeavyDOMQueries(lines, fileName));
        issues.push(...this.checkInefficientLoops(lines, fileName));
        issues.push(...this.checkMemoryLeaks(lines, fileName));
        issues.push(...this.checkUnnecessaryDOMManipulation(lines, fileName));
        issues.push(...this.checkSynchronousOperations(lines, fileName));
        issues.push(...this.checkLargeObjectCreation(lines, fileName));
        issues.push(...this.checkInefficientStringConcatenation(lines, fileName));
        issues.push(...this.checkUnusedImports(lines, fileName));

        return issues;
    }

    private checkForInOnArrays(lines: string[], fileName: string): Issue[] {
        const issues: Issue[] = [];

        lines.forEach((line, index) => {
            if (/for\s*\(\s*var\s+\w+\s+in\s+.*\[/.test(line) || 
                /for\s*\(\s*let\s+\w+\s+in\s+.*\[/.test(line) ||
                /for\s*\(\s*const\s+\w+\s+in\s+.*\[/.test(line)) {
                issues.push({
                    line: index + 1,
                    column: 1,
                    message: 'Using for...in on arrays is inefficient. Use for...of or forEach instead.',
                    severity: 'warning',
                    rule: 'no-for-in-on-arrays',
                    category: 'performance'
                });
            }
        });

        return issues;
    }

    private checkDocumentWrite(lines: string[], fileName: string): Issue[] {
        const issues: Issue[] = [];

        lines.forEach((line, index) => {
            if (/document\.write\s*\(/.test(line)) {
                issues.push({
                    line: index + 1,
                    column: 1,
                    message: 'document.write() blocks rendering and is deprecated. Use DOM manipulation instead.',
                    severity: 'warning',
                    rule: 'no-document-write',
                    category: 'performance'
                });
            }
        });

        return issues;
    }

    private checkHeavyDOMQueries(lines: string[], fileName: string): Issue[] {
        const issues: Issue[] = [];

        lines.forEach((line, index) => {
            // Check for repeated DOM queries in loops
            if (/for\s*\([^)]*\)\s*\{[^}]*querySelector[^}]*\}/.test(line) ||
                /for\s*\([^)]*\)\s*\{[^}]*getElementById[^}]*\}/.test(line)) {
                issues.push({
                    line: index + 1,
                    column: 1,
                    message: 'DOM queries inside loops are inefficient. Cache the element outside the loop.',
                    severity: 'warning',
                    rule: 'no-dom-queries-in-loops',
                    category: 'performance'
                });
            }
        });

        return issues;
    }

    private checkInefficientLoops(lines: string[], fileName: string): Issue[] {
        const issues: Issue[] = [];

        lines.forEach((line, index) => {
            // Check for array.length in loop condition
            if (/for\s*\([^)]*\.length[^)]*\)/.test(line)) {
                issues.push({
                    line: index + 1,
                    column: 1,
                    message: 'Accessing array.length in loop condition is inefficient. Cache the length.',
                    severity: 'info',
                    rule: 'cache-array-length',
                    category: 'performance'
                });
            }
        });

        return issues;
    }

    private checkMemoryLeaks(lines: string[], fileName: string): Issue[] {
        const issues: Issue[] = [];

        lines.forEach((line, index) => {
            // Check for potential memory leaks
            if (/addEventListener[^)]*\)[^;]*$/.test(line) && !line.includes('removeEventListener')) {
                issues.push({
                    line: index + 1,
                    column: 1,
                    message: 'Event listeners should be removed to prevent memory leaks.',
                    severity: 'warning',
                    rule: 'check-event-listener-cleanup',
                    category: 'performance'
                });
            }
        });

        return issues;
    }

    private checkUnnecessaryDOMManipulation(lines: string[], fileName: string): Issue[] {
        const issues: Issue[] = [];

        lines.forEach((line, index) => {
            // Check for multiple DOM manipulations
            if (/\.style\.[^=]*=.*\.style\.[^=]*=/.test(line)) {
                issues.push({
                    line: index + 1,
                    column: 1,
                    message: 'Multiple style changes cause reflows. Use cssText or classes instead.',
                    severity: 'info',
                    rule: 'batch-dom-manipulation',
                    category: 'performance'
                });
            }
        });

        return issues;
    }

    private checkSynchronousOperations(lines: string[], fileName: string): Issue[] {
        const issues: Issue[] = [];

        lines.forEach((line, index) => {
            // Check for synchronous XMLHttpRequest
            if (/XMLHttpRequest[^)]*open[^)]*false/.test(line)) {
                issues.push({
                    line: index + 1,
                    column: 1,
                    message: 'Synchronous XMLHttpRequest blocks the UI. Use async requests or fetch API.',
                    severity: 'error',
                    rule: 'no-sync-xhr',
                    category: 'performance'
                });
            }
        });

        return issues;
    }

    private checkLargeObjectCreation(lines: string[], fileName: string): Issue[] {
        const issues: Issue[] = [];

        lines.forEach((line, index) => {
            // Check for large object literals
            if (line.length > 200 && /^\s*\{/.test(line.trim())) {
                issues.push({
                    line: index + 1,
                    column: 1,
                    message: 'Large object literals can impact performance. Consider using a factory function.',
                    severity: 'info',
                    rule: 'avoid-large-object-literals',
                    category: 'performance'
                });
            }
        });

        return issues;
    }

    private checkInefficientStringConcatenation(lines: string[], fileName: string): Issue[] {
        const issues: Issue[] = [];

        lines.forEach((line, index) => {
            // Check for string concatenation in loops
            if (/for\s*\([^)]*\)\s*\{[^}]*\+[^}]*\}/.test(line)) {
                issues.push({
                    line: index + 1,
                    column: 1,
                    message: 'String concatenation in loops is inefficient. Use array.join() or template literals.',
                    severity: 'warning',
                    rule: 'no-string-concat-in-loops',
                    category: 'performance'
                });
            }
        });

        return issues;
    }

    private checkUnusedImports(lines: string[], fileName: string): Issue[] {
        const issues: Issue[] = [];

        lines.forEach((line, index) => {
            // Simple check for unused imports (this is basic, ESLint handles this better)
            if (/^import\s+.*from\s+['"]/.test(line.trim())) {
                // This is a placeholder - ESLint will handle unused imports
                // We could add more sophisticated analysis here
            }
        });

        return issues;
    }
}
