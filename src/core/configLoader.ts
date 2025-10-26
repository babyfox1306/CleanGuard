import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface CleanGuardConfig {
    enabled: boolean;
    rules: {
        security: boolean;
        performance: boolean;
        style: boolean;
    };
    customRules: string[];
    excludePatterns: string[];
    maxFileSize: number; // in KB
    autoAnalyzeOnSave: boolean;
    showStatusBar: boolean;
}

export class ConfigLoader {
    private defaultConfig: CleanGuardConfig = {
        enabled: true,
        rules: {
            security: true,
            performance: true,
            style: true
        },
        customRules: [],
        excludePatterns: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.git/**'
        ],
        maxFileSize: 500, // 500KB
        autoAnalyzeOnSave: true,
        showStatusBar: true
    };

    async loadConfig(): Promise<CleanGuardConfig> {
        const config = { ...this.defaultConfig };

        // Load from VS Code settings
        const vscodeConfig = vscode.workspace.getConfiguration('cleanguard');
        config.enabled = vscodeConfig.get('enabled', config.enabled);
        config.rules.security = vscodeConfig.get('rules.security', config.rules.security);
        config.rules.performance = vscodeConfig.get('rules.performance', config.rules.performance);
        config.rules.style = vscodeConfig.get('rules.style', config.rules.style);
        config.autoAnalyzeOnSave = vscodeConfig.get('autoAnalyzeOnSave', config.autoAnalyzeOnSave);
        config.showStatusBar = vscodeConfig.get('showStatusBar', config.showStatusBar);

        // Load from .cleanguardrc file if it exists
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
            const configFile = path.join(workspaceFolder.uri.fsPath, '.cleanguardrc');
            if (fs.existsSync(configFile)) {
                try {
                    const fileContent = fs.readFileSync(configFile, 'utf8');
                    const fileConfig = JSON.parse(fileContent);
                    Object.assign(config, fileConfig);
                } catch (error) {
                    console.error('Failed to parse .cleanguardrc:', error);
                }
            }
        }

        return config;
    }

    async saveConfig(config: CleanGuardConfig): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return;
        }

        const configFile = path.join(workspaceFolder.uri.fsPath, '.cleanguardrc');
        
        try {
            fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
        } catch (error) {
            console.error('Failed to save .cleanguardrc:', error);
        }
    }

    async createDefaultConfigFile(): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return;
        }

        const configFile = path.join(workspaceFolder.uri.fsPath, '.cleanguardrc');
        
        if (!fs.existsSync(configFile)) {
            try {
                fs.writeFileSync(configFile, JSON.stringify(this.defaultConfig, null, 2));
                vscode.window.showInformationMessage('Created .cleanguardrc configuration file');
            } catch (error) {
                vscode.window.showErrorMessage('Failed to create .cleanguardrc file');
            }
        }
    }

    isFileExcluded(filePath: string, config: CleanGuardConfig): boolean {
        const relativePath = path.relative(
            vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
            filePath
        );

        return config.excludePatterns.some(pattern => {
            const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
            return regex.test(relativePath);
        });
    }

    isFileTooLarge(filePath: string, config: CleanGuardConfig): boolean {
        try {
            const stats = fs.statSync(filePath);
            const fileSizeKB = stats.size / 1024;
            return fileSizeKB > config.maxFileSize;
        } catch (error) {
            return false;
        }
    }

    getRuleCategories(config: CleanGuardConfig): string[] {
        const categories: string[] = [];
        
        if (config.rules.security) categories.push('security');
        if (config.rules.performance) categories.push('performance');
        if (config.rules.style) categories.push('style');
        
        return categories;
    }
}
