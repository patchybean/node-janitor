import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
    getFolderSize,
    getFolderSizeFast,
    getLastModified,
    countPackages,
    fileExists,
    getHomeDir,
    getDataDir,
    getBackupsDir,
} from '../src/utils/fs-utils.js';

describe('fs-utils', () => {
    let testDir: string;

    beforeEach(async () => {
        // Create a temporary test directory
        testDir = path.join(os.tmpdir(), `node-janitor-test-${Date.now()}`);
        await fs.ensureDir(testDir);
    });

    afterEach(async () => {
        // Clean up test directory
        await fs.remove(testDir);
    });

    describe('getFolderSize', () => {
        it('should return 0 for empty folder', async () => {
            const size = await getFolderSize(testDir);
            expect(size).toBe(0);
        });

        it('should calculate size of files', async () => {
            const testFile = path.join(testDir, 'test.txt');
            await fs.writeFile(testFile, 'Hello World'); // 11 bytes
            const size = await getFolderSize(testDir);
            expect(size).toBe(11);
        });

        it('should calculate size recursively', async () => {
            const subDir = path.join(testDir, 'subdir');
            await fs.ensureDir(subDir);
            await fs.writeFile(path.join(testDir, 'file1.txt'), 'AAAA'); // 4 bytes
            await fs.writeFile(path.join(subDir, 'file2.txt'), 'BBBBBB'); // 6 bytes
            const size = await getFolderSize(testDir);
            expect(size).toBe(10);
        });
    });

    describe('getFolderSizeFast', () => {
        it('should return size for folder with files', async () => {
            await fs.writeFile(path.join(testDir, 'test.txt'), 'Hello World');
            const size = await getFolderSizeFast(testDir);
            expect(size).toBeGreaterThan(0);
        });
    });

    describe('getLastModified', () => {
        it('should return a Date object', async () => {
            const mtime = await getLastModified(testDir);
            expect(mtime).toBeInstanceOf(Date);
        });

        it('should return recent date for new folder', async () => {
            const mtime = await getLastModified(testDir);
            const now = new Date();
            const diffMs = now.getTime() - mtime.getTime();
            expect(diffMs).toBeLessThan(60000); // Within 1 minute
        });
    });

    describe('countPackages', () => {
        it('should return 0 for empty folder', async () => {
            const count = await countPackages(testDir);
            expect(count).toBe(0);
        });

        it('should count top-level packages', async () => {
            await fs.ensureDir(path.join(testDir, 'lodash'));
            await fs.ensureDir(path.join(testDir, 'express'));
            await fs.ensureDir(path.join(testDir, 'chalk'));
            const count = await countPackages(testDir);
            expect(count).toBe(3);
        });

        it('should count scoped packages', async () => {
            await fs.ensureDir(path.join(testDir, '@types', 'node'));
            await fs.ensureDir(path.join(testDir, '@types', 'express'));
            await fs.ensureDir(path.join(testDir, 'lodash'));
            const count = await countPackages(testDir);
            expect(count).toBe(3); // 2 scoped + 1 regular
        });

        it('should ignore hidden files', async () => {
            await fs.ensureDir(path.join(testDir, '.bin'));
            await fs.ensureDir(path.join(testDir, 'lodash'));
            const count = await countPackages(testDir);
            expect(count).toBe(1);
        });
    });

    describe('fileExists', () => {
        it('should return true for existing file', async () => {
            const testFile = path.join(testDir, 'exists.txt');
            await fs.writeFile(testFile, 'test');
            expect(await fileExists(testFile)).toBe(true);
        });

        it('should return false for non-existing file', async () => {
            const testFile = path.join(testDir, 'does-not-exist.txt');
            expect(await fileExists(testFile)).toBe(false);
        });

        it('should return true for existing directory', async () => {
            expect(await fileExists(testDir)).toBe(true);
        });
    });

    describe('getHomeDir', () => {
        it('should return a non-empty string', () => {
            const home = getHomeDir();
            expect(home).toBeTruthy();
            expect(typeof home).toBe('string');
        });
    });

    describe('getDataDir', () => {
        it('should return path including .node-janitor', () => {
            const dataDir = getDataDir();
            expect(dataDir).toContain('.node-janitor');
        });
    });

    describe('getBackupsDir', () => {
        it('should return path including backups', () => {
            const backupsDir = getBackupsDir();
            expect(backupsDir).toContain('backups');
            expect(backupsDir).toContain('.node-janitor');
        });
    });
});
