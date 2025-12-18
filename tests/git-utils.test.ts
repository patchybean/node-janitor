import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { isGitRepo, isDirty, getCurrentBranch, getGitStatus } from '../src/utils/git-utils.js';

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
});
