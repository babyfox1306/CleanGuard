import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Issue } from './analyzer';

export interface ReviewHistory {
    timestamp: string;
    fileName: string;
    filePath: string;
    issueCount: number;
    issues: Issue[];
    metrics: {
        complexity: number;
        maintainability: number;
        duplication: number;
    };
}

export interface TimelineData {
    reviews: ReviewHistory[];
    summary: {
        totalReviews: number;
        totalIssues: number;
        averageQualityScore: number;
        trendData: Array<{
            date: string;
            issues: number;
            qualityScore: number;
        }>;
    };
}

export class StorageManager {
    private historyFile: string;
    private maxHistoryDays: number = 30; // Free tier limit

    constructor(workspaceFolder?: vscode.WorkspaceFolder) {
        this.historyFile = path.join(
            workspaceFolder?.uri.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
            '.vscode',
            'review-history.json'
        );
    }

    async saveReview(fileName: string, filePath: string, issues: Issue[], metrics: any): Promise<void> {
        try {
            const review: ReviewHistory = {
                timestamp: new Date().toISOString(),
                fileName: path.basename(fileName),
                filePath,
                issueCount: issues.length,
                issues,
                metrics: {
                    complexity: metrics.complexity,
                    maintainability: metrics.maintainability,
                    duplication: metrics.duplication
                }
            };

            const history = await this.loadHistory();
            history.reviews.unshift(review);

            // Keep only last 30 days for free tier
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - this.maxHistoryDays);
            
            history.reviews = history.reviews.filter(item => 
                new Date(item.timestamp) > thirtyDaysAgo
            );

            await this.saveHistory(history);
        } catch (error) {
            console.error('Failed to save review:', error);
        }
    }

    async loadHistory(): Promise<TimelineData> {
        try {
            if (fs.existsSync(this.historyFile)) {
                const data = fs.readFileSync(this.historyFile, 'utf8');
                const parsed = JSON.parse(data);
                return this.processTimelineData(parsed);
            }
        } catch (error) {
            console.error('Failed to load review history:', error);
        }

        return {
            reviews: [],
            summary: {
                totalReviews: 0,
                totalIssues: 0,
                averageQualityScore: 0,
                trendData: []
            }
        };
    }

    private async saveHistory(data: TimelineData): Promise<void> {
        try {
            const dir = path.dirname(this.historyFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.historyFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Failed to save review history:', error);
        }
    }

    private processTimelineData(data: any): TimelineData {
        const reviews = data.reviews || [];
        
        // Calculate summary
        const totalReviews = reviews.length;
        const totalIssues = reviews.reduce((sum: number, review: ReviewHistory) => sum + review.issueCount, 0);
        
        // Calculate average quality score
        const qualityScores = reviews.map((review: ReviewHistory) => {
            const complexity = review.metrics?.complexity || 0;
            const maintainability = review.metrics?.maintainability || 0;
            const duplication = review.metrics?.duplication || 0;
            return Math.round(
                (Math.max(0, 100 - complexity * 5) * 0.3) +
                (maintainability * 0.4) +
                (Math.max(0, 100 - duplication) * 0.3)
            );
        });
        
        const averageQualityScore = qualityScores.length > 0 
            ? Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length)
            : 0;

        // Generate trend data (daily aggregation)
        const trendData = this.generateTrendData(reviews);

        return {
            reviews,
            summary: {
                totalReviews,
                totalIssues,
                averageQualityScore,
                trendData
            }
        };
    }

    private generateTrendData(reviews: ReviewHistory[]): Array<{date: string, issues: number, qualityScore: number}> {
        const dailyData = new Map<string, {issues: number[], qualityScores: number[]}>();

        reviews.forEach(review => {
            const date = new Date(review.timestamp).toISOString().split('T')[0];
            if (!dailyData.has(date)) {
                dailyData.set(date, { issues: [], qualityScores: [] });
            }
            
            const dayData = dailyData.get(date)!;
            dayData.issues.push(review.issueCount);
            
            const qualityScore = Math.round(
                (Math.max(0, 100 - (review.metrics?.complexity || 0) * 5) * 0.3) +
                ((review.metrics?.maintainability || 0) * 0.4) +
                (Math.max(0, 100 - (review.metrics?.duplication || 0)) * 0.3)
            );
            dayData.qualityScores.push(qualityScore);
        });

        return Array.from(dailyData.entries())
            .map(([date, data]) => ({
                date,
                issues: Math.round(data.issues.reduce((sum, count) => sum + count, 0) / data.issues.length),
                qualityScore: Math.round(data.qualityScores.reduce((sum, score) => sum + score, 0) / data.qualityScores.length)
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    async exportToCSV(): Promise<string> {
        const data = await this.loadHistory();
        let csv = 'Date,File,Issues,Complexity,Maintainability,Duplication\n';
        
        data.reviews.forEach(review => {
            const date = new Date(review.timestamp).toLocaleDateString();
            const fileName = review.fileName;
            const issues = review.issueCount;
            const complexity = review.metrics?.complexity || 0;
            const maintainability = review.metrics?.maintainability || 0;
            const duplication = review.metrics?.duplication || 0;
            
            csv += `${date},${fileName},${issues},${complexity},${maintainability},${duplication}\n`;
        });
        
        return csv;
    }

    async exportToJSON(): Promise<string> {
        const data = await this.loadHistory();
        return JSON.stringify(data, null, 2);
    }

    async clearHistory(): Promise<void> {
        try {
            if (fs.existsSync(this.historyFile)) {
                fs.unlinkSync(this.historyFile);
            }
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    }
}
