import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Mock dependencies
vi.mock('../src/core/scanner.js', () => ({
    scanNodeModules: vi.fn(),
    calculateTotals: vi.fn(),
    filterByAge: vi.fn(),
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

import { scanNodeModules, calculateTotals, filterByAge } from '../src/core/scanner.js';
import { cleanNodeModules } from '../src/core/cleaner.js';
import {
    createInitialStats,
    parseOlderThanDays,
    runScheduledCleanup,
    cronPresets,
    type ScheduleStats,
    type ScheduleOptions,
} from '../src/commands/schedule.js';
import type { NodeModulesInfo, CleanResult } from '../src/types/index.js';

describe('schedule command', () => {
    let testDir: string;
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
        testDir = path.join(os.tmpdir(), `schedule-test-${Date.now()}`);
        await fs.ensureDir(testDir);
        vi.clearAllMocks();
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
    });

    afterEach(async () => {
        await fs.remove(testDir);
        consoleLogSpy.mockRestore();
    });

    describe('createInitialStats', () => {
        it('should create initial stats with null lastRun', () => {
            const stats = createInitialStats();
            expect(stats.lastRun).toBeNull();
            expect(stats.totalRuns).toBe(0);
            expect(stats.totalCleaned).toBe(0);
            expect(stats.totalFreed).toBe(0);
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

        it('should parse 1m format to days', () => {
            expect(parseOlderThanDays('1m')).toBe(30);
        });
    });

    describe('cronPresets', () => {
        it('should have correct daily preset', () => {
            expect(cronPresets.daily).toBe('0 0 * * *');
        });

        it('should have correct weekly preset', () => {
            expect(cronPresets.weekly).toBe('0 0 * * 0');
        });

        it('should have correct monthly preset', () => {
            expect(cronPresets.monthly).toBe('0 0 1 * *');
        });

        it('should have correct hourly preset', () => {
            expect(cronPresets.hourly).toBe('0 * * * *');
        });

        it('should have correct every6hours preset', () => {
            expect(cronPresets.every6hours).toBe('0 */6 * * *');
        });
    });

    describe('runScheduledCleanup', () => {
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

            const stats = createInitialStats();
            const options: ScheduleOptions = { path: testDir, cron: '0 0 * * *' };

            const result = await runScheduledCleanup(options, undefined, stats);

            expect(result).toEqual({ cleaned: 0, freed: 0, errors: 0 });
            expect(stats.totalRuns).toBe(1);
            expect(stats.lastRun).toBeInstanceOf(Date);
        });

        it('should clean folders and update stats', async () => {
            vi.mocked(scanNodeModules).mockResolvedValue(mockFolders);
            vi.mocked(calculateTotals).mockReturnValue({ totalSize: 300000, count: 2, averageSize: 150000 });
            vi.mocked(cleanNodeModules).mockResolvedValue({
                deletedCount: 2,
                freedBytes: 300000,
                deletedPaths: ['/test/project1/node_modules', '/test/project2/node_modules'],
                errors: [],
            });

            const stats = createInitialStats();
            const options: ScheduleOptions = { path: testDir, cron: '0 0 * * *' };

            const result = await runScheduledCleanup(options, undefined, stats);

            expect(result.cleaned).toBe(2);
            expect(result.freed).toBe(300000);
            expect(result.errors).toBe(0);
            expect(stats.totalCleaned).toBe(2);
            expect(stats.totalFreed).toBe(300000);
        });

        it('should apply age filter', async () => {
            vi.mocked(scanNodeModules).mockResolvedValue(mockFolders);
            vi.mocked(filterByAge).mockReturnValue([mockFolders[1]]); // Only 60-day old folder
            vi.mocked(calculateTotals).mockReturnValue({ totalSize: 200000, count: 1, averageSize: 200000 });
            vi.mocked(cleanNodeModules).mockResolvedValue({
                deletedCount: 1,
                freedBytes: 200000,
                deletedPaths: ['/test/project2/node_modules'],
                errors: [],
            });

            const stats = createInitialStats();
            const options: ScheduleOptions = { path: testDir, cron: '0 0 * * *' };

            const result = await runScheduledCleanup(options, 50, stats);

            expect(filterByAge).toHaveBeenCalledWith(mockFolders, 50);
            expect(result.cleaned).toBe(1);
        });

        it('should not clean in dry run mode', async () => {
            vi.mocked(scanNodeModules).mockResolvedValue(mockFolders);
            vi.mocked(calculateTotals).mockReturnValue({ totalSize: 300000, count: 2, averageSize: 150000 });

            const stats = createInitialStats();
            const options: ScheduleOptions = { path: testDir, cron: '0 0 * * *', dryRun: true };

            const result = await runScheduledCleanup(options, undefined, stats);

            expect(cleanNodeModules).not.toHaveBeenCalled();
            expect(result).toEqual({ cleaned: 0, freed: 0, errors: 0 });
        });

        it('should report errors', async () => {
            vi.mocked(scanNodeModules).mockResolvedValue(mockFolders);
            vi.mocked(calculateTotals).mockReturnValue({ totalSize: 300000, count: 2, averageSize: 150000 });
            vi.mocked(cleanNodeModules).mockResolvedValue({
                deletedCount: 1,
                freedBytes: 100000,
                deletedPaths: ['/test/project1/node_modules'],
                errors: [{ path: '/test/project2/node_modules', message: 'Permission denied' }],
            });

            const stats = createInitialStats();
            const options: ScheduleOptions = { path: testDir, cron: '0 0 * * *' };

            const result = await runScheduledCleanup(options, undefined, stats);

            expect(result.errors).toBe(1);
        });

        it('should handle scan errors gracefully', async () => {
            vi.mocked(scanNodeModules).mockRejectedValue(new Error('Scan failed'));

            const stats = createInitialStats();
            const options: ScheduleOptions = { path: testDir, cron: '0 0 * * *' };

            const result = await runScheduledCleanup(options, undefined, stats);

            expect(result).toEqual({ cleaned: 0, freed: 0, errors: 1 });
        });

        it('should accumulate stats across multiple runs', async () => {
            vi.mocked(scanNodeModules).mockResolvedValue([mockFolders[0]]);
            vi.mocked(calculateTotals).mockReturnValue({ totalSize: 100000, count: 1, averageSize: 100000 });
            vi.mocked(cleanNodeModules).mockResolvedValue({
                deletedCount: 1,
                freedBytes: 100000,
                deletedPaths: ['/test/project1/node_modules'],
                errors: [],
            });

            const stats = createInitialStats();
            const options: ScheduleOptions = { path: testDir, cron: '0 0 * * *' };

            await runScheduledCleanup(options, undefined, stats);
            await runScheduledCleanup(options, undefined, stats);

            expect(stats.totalRuns).toBe(2);
            expect(stats.totalCleaned).toBe(2);
            expect(stats.totalFreed).toBe(200000);
        });
    });
});
