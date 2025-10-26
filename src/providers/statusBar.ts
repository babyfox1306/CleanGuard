import * as vscode from 'vscode';

export class StatusBarProvider {
    private statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.command = 'cleanguard.showTimeline';
    }

    show() {
        this.statusBarItem.show();
    }

    updateIssueCount(count: number) {
        if (count === 0) {
            this.statusBarItem.text = '$(shield) CleanGuard: Clean';
            this.statusBarItem.backgroundColor = undefined;
        } else if (count <= 5) {
            this.statusBarItem.text = `$(warning) CleanGuard: ${count} issues`;
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        } else {
            this.statusBarItem.text = `$(error) CleanGuard: ${count} issues`;
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        }
    }

    dispose() {
        this.statusBarItem.dispose();
    }
}
