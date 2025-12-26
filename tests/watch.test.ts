import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Mock dependencies
vi.mock('../src/core/scanner.js', () => ({
    scanNodeModules: vi.fn(),
    calculateTotals: vi.fn(),
}));

vi.mock('../src/core/cleaner.js', () => ({
    cleanNodeModules: vi.fn(),
}));

vi.mock('chalk', () => ({
    default: {
        cyan: (s: string) => s,
        gray: (s: string) => s,
        green: (s: string) => s,
        yellow: (s: string) => s,
        red: (s: string) => s,
    },
}));

import { scanNodeModules, calculateTotals } from '../src/core/scanner.js';
import { cleanNodeModules } from '../src/core/cleaner.js';
import {
    createInitialWatchState,
    parseWatchInterval,
    parseOlderThanDays,
    performScan,
    performAutoClean,
    type WatchState,
    type WatchOptions,
} from '../src/commands/watch.js';
import type { NodeModulesInfo } from '../src/types/index.js';

describe('watch command', () => {
    let testDir: string;
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let stdoutWriteSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
        testDir = path.join(os.tmpdir(), `watch-test-${Date.now()}`);
        await fs.ensureDir(testDir);
        vi.clearAllMocks();
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
        stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    });

    afterEach(async () => {
        await fs.remove(testDir);
        consoleLogSpy.mockRestore();
        stdoutWriteSpy.mockRestore();
    });

    describe('createInitialWatchState', () => {
        it('should create initial state with isWatching true', () => {
            const state = createInitialWatchState();
            expect(state.isWatching).toBe(true);
            expect(state.lastScan).toBeNull();
            expect(state.foldersFound).toBe(0);
            expect(state.totalCleaned).toBe(0);
            expect(state.totalFreed).toBe(0);
        });
    });

    describe('parseWatchInterval', () => {
        it('should return default 60000ms for undefined', () => {
            expect(parseWatchInterval(undefined)).toBe(60000);
        });

        it('should return provided interval', () => {
            expect(parseWatchInterval(30000)).toBe(30000);
        });

        it('should return default for 0', () => {
            expect(parseWatchInterval(0)).toBe(60000);
        });
    });

    describe('parseOlderThanDays', () => {
        it('should return undefined for undefined input', () => {
            expect(parseOlderThanDays(undefined)).toBeUndefined();
        });

        it('should parse 30d format', () => {
            expect(parseOlderThanDays('30d')).toBe(30);
        });

        it('should parse 2w format to days', () => {
            expect(parseOlderThanDays('2w')).toBe(14);
        });
    });

    describe('performScan', () => {
        const mockFolders: NodeModulesInfo[] = [
            {
                path: '/test/project1/node_modules',
                projectPath: '/test/project1',
                size: 100000,
                lastModified: new Date(),
                packageCount: 50,
                hasPackageLock: true,
                hasYarnLock: false,
                hasPnpmLock: false,
                ageDays: 45,
            },
            {
                path: '/test/project2/node_modules',
                projectPath: '/test/project2',
                size: 200000,
                lastModified: new Date(),
                packageCount: 100,
                hasPackageLock: false,
                hasYarnLock: true,
                hasPnpmLock: false,
                ageDays: 60,
            },
        ];

        it('should return zeros when no folders found', async () => {
            vi.mocked(scanNodeModules).mockResolvedValue([]);

            const state = createInitialWatchState();
            const options: WatchOptions = { path: testDir };

            const result = await performScan(testDir, options, undefined, state);

            expect(result).toEqual({ found: 0, cleaned: 0, freed: 0 });
            expect(state.foldersFound).toBe(0);
            expect(state.lastScan).toBeInstanceOf(Date);
        });

        it('should find folders without cleaning (onClean false)', async () => {
            vi.mocked(scanNodeModules).mockResolvedValue(mockFolders);
            vi.mocked(calculateTotals).mockReturnValue({ totalSize: 300000, count: 2, averageSize: 150000 });

            const state = createInitialWatchState();
            const options: WatchOptions = { path: testDir, onClean: false };

            const result = await performScan(testDir, options, undefined, state);

            expect(result.found).toBe(2);
            expect(result.cleaned).toBe(0);
            expect(cleanNodeModules).not.toHaveBeenCalled();
        });

        it('should auto-clean when onClean is true', async () => {
            vi.mocked(scanNodeModules).mockResolvedValue(mockFolders);
            vi.mocked(calculateTotals).mockReturnValue({ totalSize: 300000, count: 2, averageSize: 150000 });
            vi.mocked(cleanNodeModules).mockResolvedValue({
                deletedCount: 2,
                freedBytes: 300000,
                deletedPaths: ['/test/project1/node_modules', '/test/project2/node_modules'],
                errors: [],
            });

            const state = createInitialWatchState();
            const options: WatchOptions = { path: testDir, onClean: true };

            const result = await performScan(testDir, options, undefined, state);

            expect(result.found).toBe(2);
            expect(result.cleaned).toBe(2);
            expect(result.freed).toBe(300000);
            expect(state.totalCleaned).toBe(2);
            expect(state.totalFreed).toBe(300000);
        });

        it('should not clean in dry run mode even with onClean', async () => {
            vi.mocked(scanNodeModules).mockResolvedValue(mockFolders);
            vi.mocked(calculateTotals).mockReturnValue({ totalSize: 300000, count: 2, averageSize: 150000 });

            const state = createInitialWatchState();
            const options: WatchOptions = { path: testDir, onClean: true, dryRun: true };

            const result = await performScan(testDir, options, undefined, state);

            expect(result.found).toBe(2);
            expect(result.cleaned).toBe(0);
            expect(cleanNodeModules).not.toHaveBeenCalled();
        });

        it('should apply age filter', async () => {
            vi.mocked(scanNodeModules).mockResolvedValue(mockFolders);
            vi.mocked(calculateTotals).mockReturnValue({ totalSize: 200000, count: 1, averageSize: 200000 });

            const state = createInitialWatchState();
            const options: WatchOptions = { path: testDir };

            // Filter to only include folders older than 50 days (only project2)
            const result = await performScan(testDir, options, 50, state);

            expect(result.found).toBe(1); // Only project2 with 60 days
        });

        it('should handle scan errors gracefully', async () => {
            vi.mocked(scanNodeModules).mockRejectedValue(new Error('Scan failed'));

            const state = createInitialWatchState();
            const options: WatchOptions = { path: testDir };

            const result = await performScan(testDir, options, undefined, state);

            expect(result).toEqual({ found: 0, cleaned: 0, freed: 0 });
        });

        it('should update lastScan timestamp', async () => {
            vi.mocked(scanNodeModules).mockResolvedValue(mockFolders);
            vi.mocked(calculateTotals).mockReturnValue({ totalSize: 300000, count: 2, averageSize: 150000 });

            const state = createInitialWatchState();
            const before = new Date();

            await performScan(testDir, { path: testDir }, undefined, state);

            const after = new Date();
            expect(state.lastScan).toBeInstanceOf(Date);
            expect(state.lastScan!.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(state.lastScan!.getTime()).toBeLessThanOrEqual(after.getTime());
        });
    });

    describe('performAutoClean', () => {
        const mockFolders: NodeModulesInfo[] = [
            {
                path: '/test/project1/node_modules',
                projectPath: '/test/project1',
                size: 100000,
                lastModified: new Date(),
                packageCount: 50,
                hasPackageLock: true,
                hasYarnLock: false,
                hasPnpmLock: false,
                ageDays: 45,
            },
        ];

        it('should clean folders and return result', async () => {
            vi.mocked(cleanNodeModules).mockResolvedValue({
                deletedCount: 1,
                freedBytes: 100000,
                deletedPaths: ['/test/project1/node_modules'],
                errors: [],
            });

            const state = createInitialWatchState();
            const result = await performAutoClean(mockFolders, state);

            expect(result.cleaned).toBe(1);
            expect(result.freed).toBe(100000);
            expect(state.totalCleaned).toBe(1);
            expect(state.totalFreed).toBe(100000);
        });

        it('should accumulate stats across multiple cleanups', async () => {
            vi.mocked(cleanNodeModules).mockResolvedValue({
                deletedCount: 1,
                freedBytes: 100000,
                deletedPaths: ['/test/project1/node_modules'],
                errors: [],
            });

            const state = createInitialWatchState();

            await performAutoClean(mockFolders, state);
            await performAutoClean(mockFolders, state);

            expect(state.totalCleaned).toBe(2);
            expect(state.totalFreed).toBe(200000);
        });

        it('should handle clean errors gracefully', async () => {
            vi.mocked(cleanNodeModules).mockRejectedValue(new Error('Clean failed'));

            const state = createInitialWatchState();
            const result = await performAutoClean(mockFolders, state);

            expect(result).toEqual({ cleaned: 0, freed: 0 });
        });
    });
});
