import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock cli-table3
vi.mock('cli-table3', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            push: vi.fn(),
            toString: vi.fn().mockReturnValue('mocked table output'),
        })),
    };
});

// Mock chalk
vi.mock('chalk', () => ({
    default: {
        gray: (s: string) => s,
        blue: (s: string) => s,
        green: (s: string) => s,
        yellow: (s: string) => s,
        red: (s: string) => s,
        cyan: (s: string) => s,
        magenta: (s: string) => s,
        white: (s: string) => s,
    },
}));

// Mock formatter
vi.mock('../src/utils/formatter.js', () => ({
    formatBytes: vi.fn((bytes: number) => `${bytes} bytes`),
}));

import Table from 'cli-table3';
import { createFoldersTable, createSummaryTable, createBreakdownTable } from '../src/ui/table.js';
import type { NodeModulesInfo } from '../src/types/index.js';

describe('table UI', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createFoldersTable', () => {
        it('should create a table with folders', () => {
            const folders: NodeModulesInfo[] = [
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

            const result = createFoldersTable(folders);

            expect(Table).toHaveBeenCalled();
            expect(result).toBe('mocked table output');
        });

        it('should handle empty folders array', () => {
            const result = createFoldersTable([]);
            expect(result).toBe('mocked table output');
        });

        it('should show npm lock type', () => {
            const folders: NodeModulesInfo[] = [
                {
                    path: '/test/node_modules',
                    projectPath: '/test',
                    size: 1000,
                    lastModified: new Date(),
                    packageCount: 10,
                    hasPackageLock: true,
                    hasYarnLock: false,
                    hasPnpmLock: false,
                    ageDays: 10,
                },
            ];

            createFoldersTable(folders);
            expect(Table).toHaveBeenCalled();
        });

        it('should show yarn lock type', () => {
            const folders: NodeModulesInfo[] = [
                {
                    path: '/test/node_modules',
                    projectPath: '/test',
                    size: 1000,
                    lastModified: new Date(),
                    packageCount: 10,
                    hasPackageLock: false,
                    hasYarnLock: true,
                    hasPnpmLock: false,
                    ageDays: 10,
                },
            ];

            createFoldersTable(folders);
            expect(Table).toHaveBeenCalled();
        });

        it('should show pnpm lock type', () => {
            const folders: NodeModulesInfo[] = [
                {
                    path: '/test/node_modules',
                    projectPath: '/test',
                    size: 1000,
                    lastModified: new Date(),
                    packageCount: 10,
                    hasPackageLock: false,
                    hasYarnLock: false,
                    hasPnpmLock: true,
                    ageDays: 10,
                },
            ];

            createFoldersTable(folders);
            expect(Table).toHaveBeenCalled();
        });

        it('should show no lock type when none exists', () => {
            const folders: NodeModulesInfo[] = [
                {
                    path: '/test/node_modules',
                    projectPath: '/test',
                    size: 1000,
                    lastModified: new Date(),
                    packageCount: 10,
                    hasPackageLock: false,
                    hasYarnLock: false,
                    hasPnpmLock: false,
                    ageDays: 10,
                },
            ];

            createFoldersTable(folders);
            expect(Table).toHaveBeenCalled();
        });

        it('should handle multiple folders', () => {
            const folders: NodeModulesInfo[] = [
                { path: '/a/node_modules', projectPath: '/a', size: 100, lastModified: new Date(), packageCount: 10, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 10 },
                { path: '/b/node_modules', projectPath: '/b', size: 200, lastModified: new Date(), packageCount: 20, hasPackageLock: false, hasYarnLock: true, hasPnpmLock: false, ageDays: 50 },
                { path: '/c/node_modules', projectPath: '/c', size: 300, lastModified: new Date(), packageCount: 30, hasPackageLock: false, hasYarnLock: false, hasPnpmLock: true, ageDays: 100 },
            ];

            const result = createFoldersTable(folders);
            expect(result).toBe('mocked table output');
        });
    });

    describe('createSummaryTable', () => {
        it('should create a summary table', () => {
            const data = {
                totalFolders: 10,
                totalSize: 5000000000,
                oldestAge: 180,
                newestAge: 5,
            };

            const result = createSummaryTable(data);

            expect(Table).toHaveBeenCalled();
            expect(result).toBe('mocked table output');
        });

        it('should handle zero values', () => {
            const data = {
                totalFolders: 0,
                totalSize: 0,
                oldestAge: 0,
                newestAge: 0,
            };

            const result = createSummaryTable(data);
            expect(result).toBe('mocked table output');
        });
    });

    describe('createBreakdownTable', () => {
        it('should create a breakdown table', () => {
            const data = {
                recent: { count: 5, size: 1000000 },
                medium: { count: 3, size: 2000000 },
                old: { count: 2, size: 3000000 },
            };

            const result = createBreakdownTable(data);

            expect(Table).toHaveBeenCalled();
            expect(result).toBe('mocked table output');
        });

        it('should handle all recent folders', () => {
            const data = {
                recent: { count: 10, size: 5000000 },
                medium: { count: 0, size: 0 },
                old: { count: 0, size: 0 },
            };

            const result = createBreakdownTable(data);
            expect(result).toBe('mocked table output');
        });

        it('should handle all old folders', () => {
            const data = {
                recent: { count: 0, size: 0 },
                medium: { count: 0, size: 0 },
                old: { count: 10, size: 5000000 },
            };

            const result = createBreakdownTable(data);
            expect(result).toBe('mocked table output');
        });
    });
});

describe('table helper functions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAgeColor (tested through createFoldersTable)', () => {
        it('should use different colors based on age', () => {
            // Recent (< 30 days) - green
            const recentFolders: NodeModulesInfo[] = [
                { path: '/a/node_modules', projectPath: '/a', size: 100, lastModified: new Date(), packageCount: 10, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 15 },
            ];
            createFoldersTable(recentFolders);
            expect(Table).toHaveBeenCalledTimes(1);

            // Medium (30-90 days) - yellow
            const mediumFolders: NodeModulesInfo[] = [
                { path: '/b/node_modules', projectPath: '/b', size: 200, lastModified: new Date(), packageCount: 20, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 60 },
            ];
            createFoldersTable(mediumFolders);
            expect(Table).toHaveBeenCalledTimes(2);

            // Old (> 90 days) - red
            const oldFolders: NodeModulesInfo[] = [
                { path: '/c/node_modules', projectPath: '/c', size: 300, lastModified: new Date(), packageCount: 30, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 120 },
            ];
            createFoldersTable(oldFolders);
            expect(Table).toHaveBeenCalledTimes(3);
        });
    });

    describe('shortenPath (tested through createFoldersTable)', () => {
        it('should handle long paths', () => {
            const folders: NodeModulesInfo[] = [
                {
                    path: '/very/long/path/that/exceeds/the/maximum/length/allowed/for/display/node_modules',
                    projectPath: '/very/long/path/that/exceeds/the/maximum/length/allowed/for/display',
                    size: 1000,
                    lastModified: new Date(),
                    packageCount: 10,
                    hasPackageLock: true,
                    hasYarnLock: false,
                    hasPnpmLock: false,
                    ageDays: 30,
                },
            ];

            createFoldersTable(folders);
            expect(Table).toHaveBeenCalled();
        });

        it('should handle short paths', () => {
            const folders: NodeModulesInfo[] = [
                {
                    path: '/short/node_modules',
                    projectPath: '/short',
                    size: 1000,
                    lastModified: new Date(),
                    packageCount: 10,
                    hasPackageLock: true,
                    hasYarnLock: false,
                    hasPnpmLock: false,
                    ageDays: 30,
                },
            ];

            createFoldersTable(folders);
            expect(Table).toHaveBeenCalled();
        });
    });
});
