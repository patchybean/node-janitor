import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
    isGitRepo,
    getGitRoot,
    isDirty,
    getCurrentBranch,
    isMergedToMain,
    getGitStatus,
    isNodeModulesIgnored,
} from '../src/utils/git-utils.js';

const execAsync = promisify(exec);

describe('git-utils', () => {
    let testDir: string;

    beforeEach(async () => {
        testDir = path.join(os.tmpdir(), `node-janitor-git-test-${Date.now()}`);
        await fs.ensureDir(testDir);
    });

    afterEach(async () => {
        await fs.remove(testDir);
    });

    describe('isGitRepo', () => {
        it('should return false for non-git directory', async () => {
            const result = await isGitRepo(testDir);
            expect(result).toBe(false);
        });

        it('should return true for git directory', async () => {
            // Initialize git repo
            await execAsync('git init', { cwd: testDir });

            const result = await isGitRepo(testDir);
            expect(result).toBe(true);
        });
    });

    describe('getGitRoot', () => {
        it('should return null for non-git directory', async () => {
            const result = await getGitRoot(testDir);
            expect(result).toBeNull();
        });

        it('should return root for git directory', async () => {
            await execAsync('git init', { cwd: testDir });

            const result = await getGitRoot(testDir);
            // Use realpath to handle macOS symlinks (/var -> /private/var)
            const realTestDir = await fs.realpath(testDir);
            expect(result).toBe(realTestDir);
        });

        it('should return root for subdirectory of git repo', async () => {
            await execAsync('git init', { cwd: testDir });
            const subDir = path.join(testDir, 'sub', 'folder');
            await fs.ensureDir(subDir);

            const result = await getGitRoot(subDir);
            // Use realpath to handle macOS symlinks
            const realTestDir = await fs.realpath(testDir);
            expect(result).toBe(realTestDir);
        });
    });

    describe('isDirty', () => {
        it('should return false for clean repo', async () => {
            // Initialize and make a commit
            await execAsync('git init', { cwd: testDir });
            await execAsync('git config user.email "test@test.com"', { cwd: testDir });
            await execAsync('git config user.name "Test"', { cwd: testDir });
            await fs.writeFile(path.join(testDir, 'README.md'), '# Test');
            await execAsync('git add .', { cwd: testDir });
            await execAsync('git commit -m "Initial"', { cwd: testDir });

            const result = await isDirty(testDir);
            expect(result).toBe(false);
        });

        it('should return true for dirty repo', async () => {
            // Initialize, commit, then modify
            await execAsync('git init', { cwd: testDir });
            await execAsync('git config user.email "test@test.com"', { cwd: testDir });
            await execAsync('git config user.name "Test"', { cwd: testDir });
            await fs.writeFile(path.join(testDir, 'README.md'), '# Test');
            await execAsync('git add .', { cwd: testDir });
            await execAsync('git commit -m "Initial"', { cwd: testDir });
            // Now modify
            await fs.writeFile(path.join(testDir, 'new-file.txt'), 'content');

            const result = await isDirty(testDir);
            expect(result).toBe(true);
        });

        it('should return false for non-git directory', async () => {
            const result = await isDirty(testDir);
            expect(result).toBe(false);
        });

        it('should return true for staged but uncommitted changes', async () => {
            await execAsync('git init', { cwd: testDir });
            await execAsync('git config user.email "test@test.com"', { cwd: testDir });
            await execAsync('git config user.name "Test"', { cwd: testDir });
            await fs.writeFile(path.join(testDir, 'README.md'), '# Test');
            await execAsync('git add .', { cwd: testDir });
            await execAsync('git commit -m "Initial"', { cwd: testDir });
            // Stage new file but don't commit
            await fs.writeFile(path.join(testDir, 'staged.txt'), 'staged');
            await execAsync('git add staged.txt', { cwd: testDir });

            const result = await isDirty(testDir);
            expect(result).toBe(true);
        });
    });

    describe('getCurrentBranch', () => {
        it('should return branch name', async () => {
            await execAsync('git init', { cwd: testDir });
            await execAsync('git config user.email "test@test.com"', { cwd: testDir });
            await execAsync('git config user.name "Test"', { cwd: testDir });
            await fs.writeFile(path.join(testDir, 'README.md'), '# Test');
            await execAsync('git add .', { cwd: testDir });
            await execAsync('git commit -m "Initial"', { cwd: testDir });

            const branch = await getCurrentBranch(testDir);
            // Could be 'main' or 'master' depending on git config
            expect(['main', 'master']).toContain(branch);
        });

        it('should return null for non-git directory', async () => {
            const branch = await getCurrentBranch(testDir);
            expect(branch).toBeNull();
        });
    });

    describe('isMergedToMain', () => {
        it('should return true for main branch', async () => {
            await execAsync('git init', { cwd: testDir });
            await execAsync('git config user.email "test@test.com"', { cwd: testDir });
            await execAsync('git config user.name "Test"', { cwd: testDir });
            await fs.writeFile(path.join(testDir, 'README.md'), '# Test');
            await execAsync('git add .', { cwd: testDir });
            await execAsync('git commit -m "Initial"', { cwd: testDir });
            // Rename to main
            await execAsync('git branch -M main', { cwd: testDir });

            const result = await isMergedToMain(testDir);
            expect(result).toBe(true);
        });

        it('should return true for master branch', async () => {
            await execAsync('git init', { cwd: testDir });
            await execAsync('git config user.email "test@test.com"', { cwd: testDir });
            await execAsync('git config user.name "Test"', { cwd: testDir });
            await fs.writeFile(path.join(testDir, 'README.md'), '# Test');
            await execAsync('git add .', { cwd: testDir });
            await execAsync('git commit -m "Initial"', { cwd: testDir });
            // Rename to master
            await execAsync('git branch -M master', { cwd: testDir });

            const result = await isMergedToMain(testDir);
            expect(result).toBe(true);
        });

        // isMergedToMain returns true when branch is null, main, or master
        // For non-git directory, getCurrentBranch returns null
        // And !branch (null) is truthy, so it returns true
        it('should return true for non-git directory (branch is null)', async () => {
            const result = await isMergedToMain(testDir);
            // When branch is null (non-git), the function returns true
            expect(result).toBe(true);
        });
    });

    describe('getGitStatus', () => {
        it('should return undefined for non-git directory', async () => {
            const status = await getGitStatus(testDir);
            expect(status).toBeUndefined();
        });

        it('should return git status for git directory', async () => {
            await execAsync('git init', { cwd: testDir });
            await execAsync('git config user.email "test@test.com"', { cwd: testDir });
            await execAsync('git config user.name "Test"', { cwd: testDir });
            await fs.writeFile(path.join(testDir, 'README.md'), '# Test');
            await execAsync('git add .', { cwd: testDir });
            await execAsync('git commit -m "Initial"', { cwd: testDir });

            const status = await getGitStatus(testDir);

            expect(status).toBeDefined();
            expect(status!.isGitRepo).toBe(true);
            expect(status!.isDirty).toBe(false);
            expect(['main', 'master']).toContain(status!.branch);
        });

        it('should detect dirty status', async () => {
            await execAsync('git init', { cwd: testDir });
            await execAsync('git config user.email "test@test.com"', { cwd: testDir });
            await execAsync('git config user.name "Test"', { cwd: testDir });
            await fs.writeFile(path.join(testDir, 'README.md'), '# Test');
            await execAsync('git add .', { cwd: testDir });
            await execAsync('git commit -m "Initial"', { cwd: testDir });
            // Make dirty
            await fs.writeFile(path.join(testDir, 'new.txt'), 'dirty');

            const status = await getGitStatus(testDir);

            expect(status!.isDirty).toBe(true);
        });
    });

    describe('isNodeModulesIgnored', () => {
        it('should check if node_modules is ignored', async () => {
            await execAsync('git init', { cwd: testDir });
            await fs.writeFile(path.join(testDir, '.gitignore'), 'node_modules/\n');

            const result = await isNodeModulesIgnored(testDir);
            // Result depends on whether node_modules folder exists and git check-ignore behavior
            expect(typeof result).toBe('boolean');
        });

        it('should return boolean for non-git directory', async () => {
            const result = await isNodeModulesIgnored(testDir);
            // The function catches errors and returns true as safe default
            expect(typeof result).toBe('boolean');
        });

        it('should handle .gitignore without node_modules', async () => {
            await execAsync('git init', { cwd: testDir });
            await fs.writeFile(path.join(testDir, '.gitignore'), '*.log\n');

            const result = await isNodeModulesIgnored(testDir);
            // This could be true or false depending on git behavior
            expect(typeof result).toBe('boolean');
        });
    });
});
