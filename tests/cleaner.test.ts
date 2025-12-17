import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { cleanNodeModules } from '../src/core/cleaner.js';
import type { NodeModulesInfo } from '../src/types/index.js';

describe('cleaner', () => {
    let testDir: string;

    beforeEach(async () => {
        testDir = path.join(os.tmpdir(), `node-janitor-cleaner-test-${Date.now()}`);
        await fs.ensureDir(testDir);
    });

    afterEach(async () => {
        await fs.remove(testDir);
    });

    describe('cleanNodeModules', () => {
        it('should delete folders in normal mode', async () => {
            // Create mock node_modules
            const nodeModulesPath = path.join(testDir, 'project', 'node_modules');
            await fs.ensureDir(nodeModulesPath);
            await fs.writeFile(path.join(nodeModulesPath, 'test.txt'), 'test');

            const folders: NodeModulesInfo[] = [
                {
                    path: nodeModulesPath,
                    projectPath: path.join(testDir, 'project'),
                    size: 100,
                    lastModified: new Date(),
                    packageCount: 1,
                    hasPackageLock: true,
                    hasYarnLock: false,
                    hasPnpmLock: false,
                    ageDays: 100,
                },
            ];

            const result = await cleanNodeModules(folders, {});

            expect(result.deletedCount).toBe(1);
            expect(result.deletedPaths).toContain(nodeModulesPath);
            expect(await fs.pathExists(nodeModulesPath)).toBe(false);
        });

        it('should not delete in dry-run mode', async () => {
            const nodeModulesPath = path.join(testDir, 'project', 'node_modules');
            await fs.ensureDir(nodeModulesPath);

            const folders: NodeModulesInfo[] = [
                {
                    path: nodeModulesPath,
                    projectPath: path.join(testDir, 'project'),
                    size: 100,
                    lastModified: new Date(),
                    packageCount: 1,
                    hasPackageLock: true,
                    hasYarnLock: false,
                    hasPnpmLock: false,
                    ageDays: 100,
                },
            ];

            const result = await cleanNodeModules(folders, { dryRun: true });

            expect(result.deletedCount).toBe(1);
            expect(result.deletedPaths).toContain(nodeModulesPath);
            expect(await fs.pathExists(nodeModulesPath)).toBe(true); // Still exists
        });

        it('should filter by olderThan option', async () => {
            const folders: NodeModulesInfo[] = [
                { path: '/a', projectPath: '/a', size: 100, lastModified: new Date(), packageCount: 1, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 10 },
                { path: '/b', projectPath: '/b', size: 100, lastModified: new Date(), packageCount: 1, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 50 },
            ];

            const result = await cleanNodeModules(folders, { olderThan: '30d', dryRun: true });

            expect(result.deletedCount).toBe(1);
            expect(result.deletedPaths).toContain('/b');
            expect(result.deletedPaths).not.toContain('/a');
        });

        it('should filter by between option', async () => {
            const folders: NodeModulesInfo[] = [
                { path: '/a', projectPath: '/a', size: 100, lastModified: new Date(), packageCount: 1, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 10 },
                { path: '/b', projectPath: '/b', size: 100, lastModified: new Date(), packageCount: 1, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 50 },
                { path: '/c', projectPath: '/c', size: 100, lastModified: new Date(), packageCount: 1, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 100 },
            ];

            const result = await cleanNodeModules(folders, { between: '30d-80d', dryRun: true });

            expect(result.deletedCount).toBe(1);
            expect(result.deletedPaths).toContain('/b');
        });

        it('should filter by minSize option', async () => {
            const folders: NodeModulesInfo[] = [
                { path: '/a', projectPath: '/a', size: 100, lastModified: new Date(), packageCount: 1, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 10 },
                { path: '/b', projectPath: '/b', size: 1000000, lastModified: new Date(), packageCount: 1, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 50 },
            ];

            const result = await cleanNodeModules(folders, { minSize: '500KB', dryRun: true });

            expect(result.deletedCount).toBe(1);
            expect(result.deletedPaths).toContain('/b');
        });

        it('should filter by lockCheck option', async () => {
            const folders: NodeModulesInfo[] = [
                { path: '/a', projectPath: '/a', size: 100, lastModified: new Date(), packageCount: 1, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 10 },
                { path: '/b', projectPath: '/b', size: 100, lastModified: new Date(), packageCount: 1, hasPackageLock: false, hasYarnLock: false, hasPnpmLock: false, ageDays: 50 },
            ];

            const result = await cleanNodeModules(folders, { lockCheck: true, dryRun: true });

            expect(result.deletedCount).toBe(1);
            expect(result.deletedPaths).toContain('/a');
            expect(result.deletedPaths).not.toContain('/b');
        });

        it('should create backup when backup option is true', async () => {
            const nodeModulesPath = path.join(testDir, 'project', 'node_modules');
            await fs.ensureDir(nodeModulesPath);

            const folders: NodeModulesInfo[] = [
                {
                    path: nodeModulesPath,
                    projectPath: path.join(testDir, 'project'),
                    size: 100,
                    lastModified: new Date(),
                    packageCount: 1,
                    hasPackageLock: true,
                    hasYarnLock: false,
                    hasPnpmLock: false,
                    ageDays: 100,
                },
            ];

            const result = await cleanNodeModules(folders, { backup: true });

            expect(result.backupPath).toBeDefined();
            expect(result.backupPath).toContain('.node-janitor/backups');
            expect(await fs.pathExists(result.backupPath!)).toBe(true);

            // Clean up backup
            await fs.remove(result.backupPath!);
        });
    });
});
