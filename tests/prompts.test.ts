import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock inquirer
vi.mock('inquirer', () => ({
    default: {
        prompt: vi.fn(),
    },
}));

// Mock formatter
vi.mock('../src/utils/formatter.js', () => ({
    formatBytes: vi.fn((bytes: number) => `${bytes} bytes`),
}));

import inquirer from 'inquirer';
import {
    promptPath,
    promptAge,
    promptConfirm,
    promptViewList,
    promptDelete,
    promptSelectFolders,
    promptAction,
} from '../src/ui/prompts.js';
import type { NodeModulesInfo } from '../src/types/index.js';

describe('prompts UI', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('promptPath', () => {
        it('should prompt for path with default', async () => {
            vi.mocked(inquirer.prompt).mockResolvedValue({ path: '/custom/path' });

            const result = await promptPath('/default/path');

            expect(inquirer.prompt).toHaveBeenCalled();
            expect(result).toBe('/custom/path');
        });

        it('should return the entered path', async () => {
            vi.mocked(inquirer.prompt).mockResolvedValue({ path: '~/projects' });

            const result = await promptPath('/home');

            expect(result).toBe('~/projects');
        });
    });

    describe('promptAge', () => {
        it('should return age in days format', async () => {
            vi.mocked(inquirer.prompt).mockResolvedValue({ age: '30' });

            const result = await promptAge();

            expect(result).toBe('30d');
        });

        it('should return undefined for empty input', async () => {
            vi.mocked(inquirer.prompt).mockResolvedValue({ age: '' });

            const result = await promptAge();

            expect(result).toBeUndefined();
        });
    });

    describe('promptConfirm', () => {
        it('should return true when confirmed', async () => {
            vi.mocked(inquirer.prompt).mockResolvedValue({ confirmed: true });

            const result = await promptConfirm('Continue?');

            expect(result).toBe(true);
        });

        it('should return false when not confirmed', async () => {
            vi.mocked(inquirer.prompt).mockResolvedValue({ confirmed: false });

            const result = await promptConfirm('Continue?');

            expect(result).toBe(false);
        });

        it('should use default value', async () => {
            vi.mocked(inquirer.prompt).mockResolvedValue({ confirmed: true });

            await promptConfirm('Continue?', true);

            expect(inquirer.prompt).toHaveBeenCalledWith([
                expect.objectContaining({ default: true }),
            ]);
        });
    });

    describe('promptViewList', () => {
        it('should prompt to view list', async () => {
            vi.mocked(inquirer.prompt).mockResolvedValue({ confirmed: true });

            const result = await promptViewList();

            expect(result).toBe(true);
        });
    });

    describe('promptDelete', () => {
        it('should prompt for deletion confirmation', async () => {
            vi.mocked(inquirer.prompt).mockResolvedValue({ confirmed: true });

            const result = await promptDelete(5, 1000000);

            expect(result).toBe(true);
        });

        it('should return false when not confirmed', async () => {
            vi.mocked(inquirer.prompt).mockResolvedValue({ confirmed: false });

            const result = await promptDelete(5, 1000000);

            expect(result).toBe(false);
        });
    });

    describe('promptSelectFolders', () => {
        it('should return selected folders', async () => {
            const folders: NodeModulesInfo[] = [
                { path: '/a/node_modules', projectPath: '/a', size: 100, lastModified: new Date(), packageCount: 10, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 10 },
                { path: '/b/node_modules', projectPath: '/b', size: 200, lastModified: new Date(), packageCount: 20, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 20 },
            ];

            vi.mocked(inquirer.prompt).mockResolvedValue({ selected: [0, 1] });

            const result = await promptSelectFolders(folders);

            expect(result).toHaveLength(2);
            expect(result[0].projectPath).toBe('/a');
            expect(result[1].projectPath).toBe('/b');
        });

        it('should return only selected folders', async () => {
            const folders: NodeModulesInfo[] = [
                { path: '/a/node_modules', projectPath: '/a', size: 100, lastModified: new Date(), packageCount: 10, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 10 },
                { path: '/b/node_modules', projectPath: '/b', size: 200, lastModified: new Date(), packageCount: 20, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 20 },
            ];

            vi.mocked(inquirer.prompt).mockResolvedValue({ selected: [1] });

            const result = await promptSelectFolders(folders);

            expect(result).toHaveLength(1);
            expect(result[0].projectPath).toBe('/b');
        });

        it('should return empty array when none selected', async () => {
            const folders: NodeModulesInfo[] = [
                { path: '/a/node_modules', projectPath: '/a', size: 100, lastModified: new Date(), packageCount: 10, hasPackageLock: true, hasYarnLock: false, hasPnpmLock: false, ageDays: 10 },
            ];

            vi.mocked(inquirer.prompt).mockResolvedValue({ selected: [] });

            const result = await promptSelectFolders(folders);

            expect(result).toHaveLength(0);
        });
    });

    describe('promptAction', () => {
        it('should return scan action', async () => {
            vi.mocked(inquirer.prompt).mockResolvedValue({ action: 'scan' });

            const result = await promptAction();

            expect(result).toBe('scan');
        });

        it('should return clean action', async () => {
            vi.mocked(inquirer.prompt).mockResolvedValue({ action: 'clean' });

            const result = await promptAction();

            expect(result).toBe('clean');
        });

        it('should return deep-clean action', async () => {
            vi.mocked(inquirer.prompt).mockResolvedValue({ action: 'deep-clean' });

            const result = await promptAction();

            expect(result).toBe('deep-clean');
        });

        it('should return report action', async () => {
            vi.mocked(inquirer.prompt).mockResolvedValue({ action: 'report' });

            const result = await promptAction();

            expect(result).toBe('report');
        });

        it('should return exit action', async () => {
            vi.mocked(inquirer.prompt).mockResolvedValue({ action: 'exit' });

            const result = await promptAction();

            expect(result).toBe('exit');
        });
    });
});
