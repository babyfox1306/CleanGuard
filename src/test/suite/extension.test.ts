import * as assert from 'assert';
import * as vscode from 'vscode';

suite('CleanGuard Extension Test Suite', () => {
    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('cleanguard.cleanguard'));
    });

    test('Extension should activate', async () => {
        const extension = vscode.extensions.getExtension('cleanguard.cleanguard');
        if (extension) {
            await extension.activate();
            assert.ok(extension.isActive);
        }
    });

    test('Commands should be registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        const cleanguardCommands = commands.filter(cmd => cmd.startsWith('cleanguard.'));
        
        assert.ok(cleanguardCommands.includes('cleanguard.reviewFile'));
        assert.ok(cleanguardCommands.includes('cleanguard.reviewWorkspace'));
        assert.ok(cleanguardCommands.includes('cleanguard.showTimeline'));
        assert.ok(cleanguardCommands.includes('cleanguard.exportCSV'));
        assert.ok(cleanguardCommands.includes('cleanguard.exportJSON'));
        assert.ok(cleanguardCommands.includes('cleanguard.exportReport'));
    });
});
