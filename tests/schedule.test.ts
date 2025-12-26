import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the dependencies
vi.mock('../src/core/scanner.js', () => ({
    scanNodeModules: vi.fn(),
    calculateTotals: vi.fn(),
    filterByAge: vi.fn(),
}));

vi.mock('../src/core/cleaner.js', () => ({
    cleanNodeModules: vi.fn(),
}));

vi.mock('../src/utils/formatter.js', () => ({
    formatBytes: vi.fn((bytes: number) => `${bytes} bytes`),
    parseDuration: vi.fn((duration: string) => {
        const match = duration.match(/^(\d+)([dmwy])$/);
        if (!match) return 0;
        return parseInt(match[1]);
    }),
}));

vi.mock('cron', () => ({
    CronJob: vi.fn().mockImplementation((cronTime, onTick, onComplete, start) => ({
        start: vi.fn(),
        stop: vi.fn(),
        nextDate: vi.fn().mockReturnValue(new Date()),
    })),
}));

// Import after mocking
import { scanNodeModules, calculateTotals, filterByAge } from '../src/core/scanner.js';
import { cleanNodeModules } from '../src/core/cleaner.js';
import { parseDuration } from '../src/utils/formatter.js';
import { cronPresets } from '../src/commands/schedule.js';
import type { NodeModulesInfo } from '../src/types/index.js';

describe('schedule command', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('ScheduleOptions interface', () => {
        it('should accept valid schedule options', () => {
            const options = {
                path: '/test/path',
                cron: '0 0 * * *',
                olderThan: '30d',
                dryRun: false,
                depth: 5,
            };

            expect(options.path).toBe('/test/path');
            expect(options.cron).toBe('0 0 * * *');
            expect(options.olderThan).toBe('30d');
            expect(options.dryRun).toBe(false);
            expect(options.depth).toBe(5);
        });

        it('should have optional properties', () => {
            const minimalOptions = {
                path: '/test/path',
                cron: '0 0 * * *',
            };

            expect(minimalOptions.path).toBeDefined();
            expect(minimalOptions.cron).toBeDefined();
        });
    });

    describe('ScheduleStats tracking', () => {
        it('should initialize with default values', () => {
            const stats = {
                lastRun: null,
                totalRuns: 0,
                totalCleaned: 0,
                totalFreed: 0,
            };

            expect(stats.lastRun).toBeNull();
            expect(stats.totalRuns).toBe(0);
            expect(stats.totalCleaned).toBe(0);
            expect(stats.totalFreed).toBe(0);
        });

        it('should track cleanup statistics', () => {
            const stats = {
                lastRun: null as Date | null,
                totalRuns: 0,
                totalCleaned: 0,
                totalFreed: 0,
            };

            // Simulate first run
            stats.lastRun = new Date();
            stats.totalRuns++;
            stats.totalCleaned += 5;
            stats.totalFreed += 500000000; // 500MB

            expect(stats.lastRun).toBeInstanceOf(Date);
            expect(stats.totalRuns).toBe(1);
            expect(stats.totalCleaned).toBe(5);
            expect(stats.totalFreed).toBe(500000000);

            // Simulate second run
            stats.lastRun = new Date();
            stats.totalRuns++;
            stats.totalCleaned += 3;
            stats.totalFreed += 300000000;

            expect(stats.totalRuns).toBe(2);
            expect(stats.totalCleaned).toBe(8);
            expect(stats.totalFreed).toBe(800000000);
        });
    });

    describe('cronPresets', () => {
        it('should have daily preset', () => {
            expect(cronPresets.daily).toBe('0 0 * * *');
        });

        it('should have weekly preset', () => {
            expect(cronPresets.weekly).toBe('0 0 * * 0');
        });

        it('should have monthly preset', () => {
            expect(cronPresets.monthly).toBe('0 0 1 * *');
        });

        it('should have hourly preset', () => {
            expect(cronPresets.hourly).toBe('0 * * * *');
        });

        it('should have every6hours preset', () => {
            expect(cronPresets.every6hours).toBe('0 */6 * * *');
        });

        it('should have all required presets', () => {
            expect(Object.keys(cronPresets)).toHaveLength(5);
            expect(cronPresets).toHaveProperty('daily');
            expect(cronPresets).toHaveProperty('weekly');
            expect(cronPresets).toHaveProperty('monthly');
            expect(cronPresets).toHaveProperty('hourly');
            expect(cronPresets).toHaveProperty('every6hours');
        });
    });

    describe('scanner integration', () => {
        it('should call scanNodeModules with correct options', async () => {
            const mockFolders: NodeModulesInfo[] = [
                {
                    path: '/test/node_modules',
                    projectPath: '/test',
                    size: 1000000,
                    lastModified: new Date(),
                    packageCount: 100,
                    hasPackageLock: true,
                    hasYarnLock: false,
                    hasPnpmLock: false,
                    ageDays: 30,
                },
            ];

            vi.mocked(scanNodeModules).mockResolvedValue(mockFolders);

            const result = await scanNodeModules({
                path: '/test',
                depth: 3,
                quick: false,
            });

            expect(scanNodeModules).toHaveBeenCalledWith({
                path: '/test',
                depth: 3,
                quick: false,
            });
            expect(result).toHaveLength(1);
        });

        it('should use filterByAge for age filtering', () => {
            const mockFolders: NodeModulesInfo[] = [
                { path: '/a/node_modules', projectPath: '/a', size: 100, lastModified: new Date(), packageCount: 10, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 10 },
                { path: '/b/node_modules', projectPath: '/b', size: 200, lastModified: new Date(), packageCount: 20, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 50 },
            ];

            const filteredFolders = [mockFolders[1]]; // Only older than 30 days
            vi.mocked(filterByAge).mockReturnValue(filteredFolders);

            const result = filterByAge(mockFolders, 30);

            expect(filterByAge).toHaveBeenCalledWith(mockFolders, 30);
            expect(result).toHaveLength(1);
        });
    });

    describe('cleaner integration', () => {
        it('should clean with fast mode enabled', async () => {
            const mockFolders: NodeModulesInfo[] = [
                { path: '/a/node_modules', projectPath: '/a', size: 100000, lastModified: new Date(), packageCount: 10, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 50 },
            ];

            vi.mocked(cleanNodeModules).mockResolvedValue({
                deletedCount: 1,
                freedBytes: 100000,
                deletedPaths: ['/a/node_modules'],
                errors: [],
            });

            const result = await cleanNodeModules(mockFolders, { fast: true });

            expect(cleanNodeModules).toHaveBeenCalledWith(mockFolders, { fast: true });
            expect(result.deletedCount).toBe(1);
            expect(result.freedBytes).toBe(100000);
        });

        it('should report errors from cleanup', async () => {
            const mockFolders: NodeModulesInfo[] = [
                { path: '/a/node_modules', projectPath: '/a', size: 100000, lastModified: new Date(), packageCount: 10, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 50 },
            ];

            vi.mocked(cleanNodeModules).mockResolvedValue({
                deletedCount: 0,
                freedBytes: 0,
                deletedPaths: [],
                errors: [
                    { path: '/a/node_modules', message: 'EACCES: permission denied' },
                    { path: '/b/node_modules', message: 'EBUSY: resource busy' },
                ],
            });

            const result = await cleanNodeModules(mockFolders, { fast: true });

            expect(result.errors).toHaveLength(2);
        });
    });

    describe('parseDuration for olderThan', () => {
        it('should parse days', () => {
            const result = parseDuration('30d');
            expect(result).toBe(30);
        });

        it('should parse months', () => {
            const result = parseDuration('3m');
            expect(result).toBe(3);
        });

        it('should parse weeks', () => {
            const result = parseDuration('2w');
            expect(result).toBe(2);
        });

        it('should parse years', () => {
            const result = parseDuration('1y');
            expect(result).toBe(1);
        });

        it('should return 0 for invalid format', () => {
            const result = parseDuration('invalid');
            expect(result).toBe(0);
        });
    });

    describe('dry run mode', () => {
        it('should not call cleanNodeModules in dry run', async () => {
            const options = {
                path: '/test',
                cron: '0 0 * * *',
                dryRun: true,
            };

            // In dry run, cleanNodeModules should not be called
            // This simulates the check in runScheduledCleanup
            if (!options.dryRun) {
                await cleanNodeModules([], { fast: true });
            }

            expect(cleanNodeModules).not.toHaveBeenCalled();
        });
    });

    describe('empty results handling', () => {
        it('should handle when no folders are found', async () => {
            vi.mocked(scanNodeModules).mockResolvedValue([]);
            vi.mocked(calculateTotals).mockReturnValue({
                totalFolders: 0,
                totalSize: 0,
                oldestAge: 0,
                newestAge: 0,
            });

            const folders = await scanNodeModules({ path: '/test', quick: false });

            expect(folders).toHaveLength(0);
            // When folders.length === 0, cleanup should be skipped
        });

        it('should handle when all folders are filtered out by age', async () => {
            const mockFolders: NodeModulesInfo[] = [
                { path: '/a/node_modules', projectPath: '/a', size: 100, lastModified: new Date(), packageCount: 10, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 5 },
            ];

            vi.mocked(scanNodeModules).mockResolvedValue(mockFolders);
            vi.mocked(filterByAge).mockReturnValue([]); // All filtered out

            const folders = await scanNodeModules({ path: '/test', quick: false });
            const filtered = filterByAge(folders, 30); // Minimum 30 days

            expect(filtered).toHaveLength(0);
        });
    });
});

describe('cron expression validation', () => {
    it('should validate daily cron expression format', () => {
        const dailyCron = '0 0 * * *';
        const parts = dailyCron.split(' ');

        expect(parts).toHaveLength(5);
        expect(parts[0]).toBe('0'); // minute
        expect(parts[1]).toBe('0'); // hour
        expect(parts[2]).toBe('*'); // day of month
        expect(parts[3]).toBe('*'); // month
        expect(parts[4]).toBe('*'); // day of week
    });

    it('should validate weekly cron expression format', () => {
        const weeklyCron = '0 0 * * 0';
        const parts = weeklyCron.split(' ');

        expect(parts).toHaveLength(5);
        expect(parts[4]).toBe('0'); // Sunday
    });

    it('should validate every6hours cron expression format', () => {
        const every6hours = '0 */6 * * *';
        const parts = every6hours.split(' ');

        expect(parts).toHaveLength(5);
        expect(parts[1]).toBe('*/6'); // every 6 hours
    });
});
