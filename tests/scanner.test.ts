import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
    scanNodeModules,
    filterByAge,
    filterBySize,
    filterWithLockfile,
    calculateTotals,
} from '../src/core/scanner.js';
import type { NodeModulesInfo } from '../src/types/index.js';

describe('scanner', () => {
    let testDir: string;

    beforeEach(async () => {
        // Create a temporary test directory with mock node_modules
        testDir = path.join(os.tmpdir(), `node-janitor-scanner-test-${Date.now()}`);
        await fs.ensureDir(testDir);
    });

    afterEach(async () => {
        await fs.remove(testDir);
    });

    describe('scanNodeModules', () => {
        it('should find node_modules in directory', async () => {
            // Create a mock project with node_modules
            const projectDir = path.join(testDir, 'test-project');
            const nodeModulesDir = path.join(projectDir, 'node_modules');
            await fs.ensureDir(nodeModulesDir);
            await fs.writeFile(path.join(projectDir, 'package.json'), '{}');
            await fs.writeFile(path.join(projectDir, 'package-lock.json'), '{}');

            // Add a mock package
            await fs.ensureDir(path.join(nodeModulesDir, 'lodash'));
            await fs.writeFile(path.join(nodeModulesDir, 'lodash', 'index.js'), 'module.exports = {}');

            const results = await scanNodeModules({ path: testDir, quick: true });

            expect(results.length).toBe(1);
            expect(results[0].path).toBe(nodeModulesDir);
            expect(results[0].projectPath).toBe(projectDir);
            expect(results[0].hasPackageLock).toBe(true);
        });

        it('should respect depth limit', async () => {
            // Create nested projects
            const project1 = path.join(testDir, 'project1', 'node_modules');
            const project2 = path.join(testDir, 'level1', 'level2', 'level3', 'node_modules');
            await fs.ensureDir(project1);
            await fs.ensureDir(project2);

            // Depth 1 should only find project1
            const results = await scanNodeModules({ path: testDir, depth: 1, quick: true });
            expect(results.length).toBe(1);
        });

        it('should skip hidden folders', async () => {
            // Create node_modules in hidden folder
            const hiddenDir = path.join(testDir, '.hidden', 'node_modules');
            const visibleDir = path.join(testDir, 'visible', 'node_modules');
            await fs.ensureDir(hiddenDir);
            await fs.ensureDir(visibleDir);

            const results = await scanNodeModules({ path: testDir, quick: true });
            expect(results.length).toBe(1);
            expect(results[0].path).toBe(visibleDir);
        });

        it('should detect lockfile types', async () => {
            // npm project
            const npmProject = path.join(testDir, 'npm-project');
            await fs.ensureDir(path.join(npmProject, 'node_modules'));
            await fs.writeFile(path.join(npmProject, 'package-lock.json'), '{}');

            // yarn project
            const yarnProject = path.join(testDir, 'yarn-project');
            await fs.ensureDir(path.join(yarnProject, 'node_modules'));
            await fs.writeFile(path.join(yarnProject, 'yarn.lock'), '');

            // pnpm project
            const pnpmProject = path.join(testDir, 'pnpm-project');
            await fs.ensureDir(path.join(pnpmProject, 'node_modules'));
            await fs.writeFile(path.join(pnpmProject, 'pnpm-lock.yaml'), '');

            const results = await scanNodeModules({ path: testDir, quick: true });
            expect(results.length).toBe(3);

            const npm = results.find(r => r.projectPath.includes('npm-project'));
            const yarn = results.find(r => r.projectPath.includes('yarn-project'));
            const pnpm = results.find(r => r.projectPath.includes('pnpm-project'));

            expect(npm?.hasPackageLock).toBe(true);
            expect(yarn?.hasYarnLock).toBe(true);
            expect(pnpm?.hasPnpmLock).toBe(true);
        });
    });

    describe('filterByAge', () => {
        const mockFolders: NodeModulesInfo[] = [
            { path: '/a', projectPath: '/a', size: 100, lastModified: new Date(), packageCount: 10, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 10 },
            { path: '/b', projectPath: '/b', size: 200, lastModified: new Date(), packageCount: 20, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 50 },
            { path: '/c', projectPath: '/c', size: 300, lastModified: new Date(), packageCount: 30, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 100 },
        ];

        it('should filter by minimum age', () => {
            const result = filterByAge(mockFolders, 30);
            expect(result.length).toBe(2);
            expect(result[0].ageDays).toBe(50);
            expect(result[1].ageDays).toBe(100);
        });

        it('should filter by maximum age', () => {
            const result = filterByAge(mockFolders, undefined, 60);
            expect(result.length).toBe(2);
            expect(result[0].ageDays).toBe(10);
            expect(result[1].ageDays).toBe(50);
        });

        it('should filter by age range', () => {
            const result = filterByAge(mockFolders, 30, 80);
            expect(result.length).toBe(1);
            expect(result[0].ageDays).toBe(50);
        });

        it('should return all if no filter', () => {
            const result = filterByAge(mockFolders);
            expect(result.length).toBe(3);
        });
    });

    describe('filterBySize', () => {
        const mockFolders: NodeModulesInfo[] = [
            { path: '/a', projectPath: '/a', size: 100, lastModified: new Date(), packageCount: 10, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 10 },
            { path: '/b', projectPath: '/b', size: 500, lastModified: new Date(), packageCount: 20, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 50 },
            { path: '/c', projectPath: '/c', size: 1000, lastModified: new Date(), packageCount: 30, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 100 },
        ];

        it('should filter by minimum size', () => {
            const result = filterBySize(mockFolders, 200);
            expect(result.length).toBe(2);
        });

        it('should filter by maximum size', () => {
            const result = filterBySize(mockFolders, undefined, 600);
            expect(result.length).toBe(2);
        });

        it('should filter by size range', () => {
            const result = filterBySize(mockFolders, 200, 800);
            expect(result.length).toBe(1);
            expect(result[0].size).toBe(500);
        });
    });

    describe('filterWithLockfile', () => {
        const mockFolders: NodeModulesInfo[] = [
            { path: '/a', projectPath: '/a', size: 100, lastModified: new Date(), packageCount: 10, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 10 },
            { path: '/b', projectPath: '/b', size: 200, lastModified: new Date(), packageCount: 20, hasPackageLock: false, hasYarnLock: false, hasPnpmLock: false, ageDays: 50 },
            { path: '/c', projectPath: '/c', size: 300, lastModified: new Date(), packageCount: 30, hasPackageLock: false, hasYarnLock: true, hasPnpmLock: false, ageDays: 100 },
        ];

        it('should filter folders with lockfile', () => {
            const result = filterWithLockfile(mockFolders);
            expect(result.length).toBe(2);
            expect(result[0].hasPackageLock || result[0].hasYarnLock || result[0].hasPnpmLock).toBe(true);
        });
    });

    describe('calculateTotals', () => {
        const mockFolders: NodeModulesInfo[] = [
            { path: '/a', projectPath: '/a', size: 100, lastModified: new Date(), packageCount: 10, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 10 },
            { path: '/b', projectPath: '/b', size: 200, lastModified: new Date(), packageCount: 20, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 50 },
            { path: '/c', projectPath: '/c', size: 300, lastModified: new Date(), packageCount: 30, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 100 },
        ];

        it('should calculate correct totals', () => {
            const result = calculateTotals(mockFolders);
            expect(result.totalFolders).toBe(3);
            expect(result.totalSize).toBe(600);
            expect(result.oldestAge).toBe(100);
            expect(result.newestAge).toBe(10);
        });

        it('should handle empty array', () => {
            const result = calculateTotals([]);
            expect(result.totalFolders).toBe(0);
            expect(result.totalSize).toBe(0);
            expect(result.oldestAge).toBe(0);
            expect(result.newestAge).toBe(0);
        });
    });
});
