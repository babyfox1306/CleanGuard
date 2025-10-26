import * as vscode from 'vscode';
import * as path from 'path';
import { StorageManager, TimelineData, ReviewHistory } from '../core/storage';
import { Issue } from '../core/analyzer';

export class TimelineProvider implements vscode.TreeDataProvider<TimelineItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TimelineItem | undefined | null | void> = new vscode.EventEmitter<TimelineItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TimelineItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private storageManager: StorageManager;
    private timelineData: TimelineData | null = null;
    private webviewPanel: vscode.WebviewPanel | undefined;

    constructor(private context: vscode.ExtensionContext) {
        this.storageManager = new StorageManager();
        this.loadTimelineData();
    }

    private async loadTimelineData() {
        this.timelineData = await this.storageManager.loadHistory();
    }

    async saveReview(fileName: string, filePath: string, issues: Issue[], metrics: any) {
        await this.storageManager.saveReview(fileName, filePath, issues, metrics);
        await this.loadTimelineData();
        this._onDidChangeTreeData.fire();
        
        // Update webview if open
        if (this.webviewPanel) {
            this.updateWebview();
        }
    }

    getTreeItem(element: TimelineItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TimelineItem): Thenable<TimelineItem[]> {
        if (!element) {
            // Return summary items
            const items: TimelineItem[] = [];
            
            if (this.timelineData) {
                // Add summary item
                const summaryItem = new TimelineItem(
                    `📊 ${this.timelineData.summary.totalReviews} reviews, ${this.timelineData.summary.totalIssues} issues`,
                    vscode.TreeItemCollapsibleState.None
                );
                summaryItem.tooltip = `Average Quality Score: ${this.timelineData.summary.averageQualityScore}/100`;
                summaryItem.iconPath = new vscode.ThemeIcon('graph');
                summaryItem.command = {
                    command: 'cleanguard.showTimeline',
                    title: 'Show Timeline'
                };
                items.push(summaryItem);

                // Add recent reviews
                const recentReviews = this.timelineData.reviews.slice(0, 5);
                recentReviews.forEach((review, index) => {
                    const item = new TimelineItem(
                        `${review.fileName} (${review.issueCount} issues)`,
                        vscode.TreeItemCollapsibleState.None
                    );
                    
                    item.tooltip = `Reviewed: ${new Date(review.timestamp).toLocaleString()}`;
                    item.iconPath = review.issueCount === 0 ? 
                        new vscode.ThemeIcon('check') : 
                        new vscode.ThemeIcon('warning');
                    
                    items.push(item);
                });
            }
            
            return Promise.resolve(items);
        }
        return Promise.resolve([]);
    }

    showTimeline() {
        if (this.webviewPanel) {
            this.webviewPanel.reveal(vscode.ViewColumn.One);
            return;
        }

        this.webviewPanel = vscode.window.createWebviewPanel(
            'cleanguardTimeline',
            'CleanGuard Timeline',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.webviewPanel.onDidDispose(() => {
            this.webviewPanel = undefined;
        });

        this.updateWebview();
    }

    private async updateWebview() {
        if (!this.webviewPanel) return;

        const timelineData = await this.storageManager.loadHistory();
        const html = this.generateTimelineHTML(timelineData);
        
        this.webviewPanel.webview.html = html;
    }

    private generateTimelineHTML(data: TimelineData): string {
        const trendData = data.summary.trendData;
        const chartData = trendData.map(point => ({
            x: point.date,
            y: point.issues,
            quality: point.qualityScore
        }));

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CleanGuard Timeline</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }
        .stat-label {
            color: var(--vscode-descriptionForeground);
            margin-top: 5px;
        }
        .chart-container {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        .recent-reviews {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
        }
        .review-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .review-item:last-child {
            border-bottom: none;
        }
        .export-buttons {
            text-align: center;
            margin-top: 20px;
        }
        .export-btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 0 10px;
        }
        .export-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ CleanGuard Timeline</h1>
        <p>Code Quality Tracking Dashboard</p>
    </div>

    <div class="stats">
        <div class="stat-card">
            <div class="stat-number">${data.summary.totalReviews}</div>
            <div class="stat-label">Total Reviews</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${data.summary.totalIssues}</div>
            <div class="stat-label">Total Issues</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${data.summary.averageQualityScore}</div>
            <div class="stat-label">Avg Quality Score</div>
        </div>
    </div>

    <div class="chart-container">
        <h3>📈 Issues Trend</h3>
        <canvas id="issuesChart" width="400" height="200"></canvas>
    </div>

    <div class="recent-reviews">
        <h3>📋 Recent Reviews</h3>
        ${data.reviews.slice(0, 10).map(review => `
            <div class="review-item">
                <div>
                    <strong>${review.fileName}</strong>
                    <br>
                    <small>${new Date(review.timestamp).toLocaleString()}</small>
                </div>
                <div>
                    <span style="color: ${review.issueCount === 0 ? 'green' : 'orange'}">
                        ${review.issueCount} issues
                    </span>
                </div>
            </div>
        `).join('')}
    </div>

    <div class="export-buttons">
        <button class="export-btn" onclick="exportCSV()">📊 Export CSV</button>
        <button class="export-btn" onclick="exportJSON()">📄 Export JSON</button>
    </div>

    <script>
        const chartData = ${JSON.stringify(chartData)};
        
        const ctx = document.getElementById('issuesChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(d => d.x),
                datasets: [{
                    label: 'Issues',
                    data: chartData.map(d => d.y),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        function exportCSV() {
            const csv = generateCSV();
            downloadFile(csv, 'cleanguard-timeline.csv', 'text/csv');
        }

        function exportJSON() {
            const json = JSON.stringify(${JSON.stringify(data)}, null, 2);
            downloadFile(json, 'cleanguard-timeline.json', 'application/json');
        }

        function generateCSV() {
            const reviews = ${JSON.stringify(data.reviews)};
            let csv = 'Date,File,Issues,Complexity,Maintainability,Duplication\\n';
            
            reviews.forEach(review => {
                const date = new Date(review.timestamp).toLocaleDateString();
                csv += \`\${date},\${review.fileName},\${review.issueCount},\${review.metrics.complexity},\${review.metrics.maintainability},\${review.metrics.duplication}\\n\`;
            });
            
            return csv;
        }

        function downloadFile(content, filename, contentType) {
            const blob = new Blob([content], { type: contentType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        }
    </script>
</body>
</html>`;
    }
}

class TimelineItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
    }
}
