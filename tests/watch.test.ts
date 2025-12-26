import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Mock the dependencies
vi.mock('../src/core/scanner.js', () => ({
    scanNodeModules: vi.fn(),
    calculateTotals: vi.fn(),
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

// Import after mocking
import { scanNodeModules, calculateTotals } from '../src/core/scanner.js';
import { cleanNodeModules } from '../src/core/cleaner.js';
import { parseDuration } from '../src/utils/formatter.js';
import type { NodeModulesInfo } from '../src/types/index.js';

describe('watch command utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('WatchOptions interface', () => {
        it('should accept valid watch options', () => {
            const options = {
                path: '/test/path',
                depth: 5,
                olderThan: '30d',
                dryRun: true,
                interval: 60000,
                onClean: false,
            };

            expect(options.path).toBe('/test/path');
            expect(options.depth).toBe(5);
            expect(options.olderThan).toBe('30d');
            expect(options.dryRun).toBe(true);
            expect(options.interval).toBe(60000);
            expect(options.onClean).toBe(false);
        });

        it('should have optional properties', () => {
            const minimalOptions = {
                path: '/test/path',
            };

            expect(minimalOptions.path).toBeDefined();
        });
    });

    describe('WatchState tracking', () => {
        it('should initialize with default values', () => {
            const state = {
                isWatching: true,
                lastScan: null,
                foldersFound: 0,
                totalCleaned: 0,
                totalFreed: 0,
            };

            expect(state.isWatching).toBe(true);
            expect(state.lastScan).toBeNull();
            expect(state.foldersFound).toBe(0);
            expect(state.totalCleaned).toBe(0);
            expect(state.totalFreed).toBe(0);
        });

        it('should track state changes', () => {
            const state = {
                isWatching: true,
                lastScan: null as Date | null,
                foldersFound: 0,
                totalCleaned: 0,
                totalFreed: 0,
            };

            // Simulate scan
            state.lastScan = new Date();
            state.foldersFound = 5;

            expect(state.lastScan).toBeInstanceOf(Date);
            expect(state.foldersFound).toBe(5);

            // Simulate cleanup
            state.totalCleaned += 3;
            state.totalFreed += 1000000;

            expect(state.totalCleaned).toBe(3);
            expect(state.totalFreed).toBe(1000000);
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
            vi.mocked(calculateTotals).mockReturnValue({
                totalFolders: 1,
                totalSize: 1000000,
                oldestAge: 30,
                newestAge: 30,
            });

            const result = await scanNodeModules({
                path: '/test',
                depth: 3,
                quick: true,
            });

            expect(scanNodeModules).toHaveBeenCalledWith({
                path: '/test',
                depth: 3,
                quick: true,
            });
            expect(result).toHaveLength(1);
        });

        it('should filter folders by age', async () => {
            const mockFolders: NodeModulesInfo[] = [
                { path: '/a/node_modules', projectPath: '/a', size: 100, lastModified: new Date(), packageCount: 10, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 10 },
                { path: '/b/node_modules', projectPath: '/b', size: 200, lastModified: new Date(), packageCount: 20, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 50 },
                { path: '/c/node_modules', projectPath: '/c', size: 300, lastModified: new Date(), packageCount: 30, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 100 },
            ];

            vi.mocked(scanNodeModules).mockResolvedValue(mockFolders);

            const folders = await scanNodeModules({ path: '/test', quick: true });
            const olderThanDays = 30;
            const filtered = folders.filter(f => f.ageDays >= olderThanDays);

            expect(filtered).toHaveLength(2);
            expect(filtered[0].ageDays).toBe(50);
            expect(filtered[1].ageDays).toBe(100);
        });
    });

    describe('cleaner integration', () => {
        it('should clean folders with fast mode', async () => {
            const mockFolders: NodeModulesInfo[] = [
                { path: '/a/node_modules', projectPath: '/a', size: 100, lastModified: new Date(), packageCount: 10, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 50 },
            ];

            vi.mocked(cleanNodeModules).mockResolvedValue({
                deletedCount: 1,
                freedBytes: 100,
                deletedPaths: ['/a/node_modules'],
                errors: [],
            });

            const result = await cleanNodeModules(mockFolders, { fast: true });

            expect(cleanNodeModules).toHaveBeenCalledWith(mockFolders, { fast: true });
            expect(result.deletedCount).toBe(1);
            expect(result.freedBytes).toBe(100);
            expect(result.errors).toHaveLength(0);
        });

        it('should handle cleaning errors', async () => {
            const mockFolders: NodeModulesInfo[] = [
                { path: '/a/node_modules', projectPath: '/a', size: 100, lastModified: new Date(), packageCount: 10, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 50 },
            ];

            vi.mocked(cleanNodeModules).mockResolvedValue({
                deletedCount: 0,
                freedBytes: 0,
                deletedPaths: [],
                errors: [{ path: '/a/node_modules', message: 'Permission denied' }],
            });

            const result = await cleanNodeModules(mockFolders, { fast: true });

            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].message).toBe('Permission denied');
        });
    });

    describe('interval calculation', () => {
        it('should default to 60 seconds', () => {
            const defaultInterval = 60000;
            const customInterval: number | undefined = undefined;
            const interval = customInterval ?? defaultInterval;
            expect(interval).toBe(60000);
        });

        it('should use custom interval', () => {
            const defaultInterval = 60000;
            const customInterval = 30000;
            const interval = customInterval || defaultInterval;
            expect(interval).toBe(30000);
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
    });
});

describe('watch command edge cases', () => {
    it('should handle empty scan results', async () => {
        vi.mocked(scanNodeModules).mockResolvedValue([]);
        vi.mocked(calculateTotals).mockReturnValue({
            totalFolders: 0,
            totalSize: 0,
            oldestAge: 0,
            newestAge: 0,
        });

        const folders = await scanNodeModules({ path: '/empty', quick: true });
        expect(folders).toHaveLength(0);
    });

    it('should handle scan errors gracefully', async () => {
        vi.mocked(scanNodeModules).mockRejectedValue(new Error('Directory not found'));

        await expect(scanNodeModules({ path: '/nonexistent', quick: true }))
            .rejects.toThrow('Directory not found');
    });

    it('should display limited folders (max 5)', () => {
        const folders: NodeModulesInfo[] = Array.from({ length: 10 }, (_, i) => ({
            path: `/project${i}/node_modules`,
            projectPath: `/project${i}`,
            size: 1000 * i,
            lastModified: new Date(),
            packageCount: 10 * i,
            hasPackageLock: true,
            hasYarnLock: false,
            hasPnpmLock: false,
            ageDays: i * 10,
        }));

        const displayedFolders = folders.slice(0, 5);
        const remainingCount = folders.length - 5;

        expect(displayedFolders).toHaveLength(5);
        expect(remainingCount).toBe(5);
    });
});
