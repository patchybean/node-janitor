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
    deleteFolder,
    deleteFolderFast,
    ensureDir,
    readJson,
    writeJson,
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

        it('should handle non-existent folder gracefully', async () => {
            const size = await getFolderSize('/non-existent-path-12345');
            expect(size).toBe(0);
        });
    });

    describe('getFolderSizeFast', () => {
        it('should return size for folder with files', async () => {
            await fs.writeFile(path.join(testDir, 'test.txt'), 'Hello World');
            const size = await getFolderSizeFast(testDir);
            expect(size).toBeGreaterThan(0);
        });

        it('should return size for empty folder', async () => {
            const size = await getFolderSizeFast(testDir);
            expect(size).toBeGreaterThanOrEqual(0);
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

        it('should return current date for non-existent path', async () => {
            const before = new Date();
            const mtime = await getLastModified('/non-existent-path-12345');
            const after = new Date();
            expect(mtime.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(mtime.getTime()).toBeLessThanOrEqual(after.getTime());
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

        it('should ignore hidden files in scoped packages', async () => {
            await fs.ensureDir(path.join(testDir, '@types', '.hidden'));
            await fs.ensureDir(path.join(testDir, '@types', 'node'));
            const count = await countPackages(testDir);
            expect(count).toBe(1);
        });

        it('should return 0 for non-existent folder', async () => {
            const count = await countPackages('/non-existent-path-12345');
            expect(count).toBe(0);
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

    describe('deleteFolder', () => {
        it('should delete folder and its contents', async () => {
            const folderToDelete = path.join(testDir, 'to-delete');
            await fs.ensureDir(folderToDelete);
            await fs.writeFile(path.join(folderToDelete, 'file.txt'), 'content');

            await deleteFolder(folderToDelete);

            expect(await fileExists(folderToDelete)).toBe(false);
        });

        it('should delete empty folder', async () => {
            const folderToDelete = path.join(testDir, 'empty-folder');
            await fs.ensureDir(folderToDelete);

            await deleteFolder(folderToDelete);

            expect(await fileExists(folderToDelete)).toBe(false);
        });

        it('should delete nested folders', async () => {
            const folderToDelete = path.join(testDir, 'nested');
            await fs.ensureDir(path.join(folderToDelete, 'level1', 'level2', 'level3'));
            await fs.writeFile(path.join(folderToDelete, 'level1', 'level2', 'level3', 'deep.txt'), 'deep');

            await deleteFolder(folderToDelete);

            expect(await fileExists(folderToDelete)).toBe(false);
        });
    });

    describe('deleteFolderFast', () => {
        it('should delete folder using native commands', async () => {
            const folderToDelete = path.join(testDir, 'fast-delete');
            await fs.ensureDir(folderToDelete);
            await fs.writeFile(path.join(folderToDelete, 'file.txt'), 'content');

            await deleteFolderFast(folderToDelete);

            expect(await fileExists(folderToDelete)).toBe(false);
        });

        it('should delete nested structure quickly', async () => {
            const folderToDelete = path.join(testDir, 'fast-nested');
            await fs.ensureDir(path.join(folderToDelete, 'a', 'b', 'c'));
            await fs.writeFile(path.join(folderToDelete, 'a', 'b', 'c', 'file.txt'), 'content');

            await deleteFolderFast(folderToDelete);

            expect(await fileExists(folderToDelete)).toBe(false);
        });
    });

    describe('ensureDir', () => {
        it('should create directory if not exists', async () => {
            const newDir = path.join(testDir, 'new-dir');
            expect(await fileExists(newDir)).toBe(false);

            await ensureDir(newDir);

            expect(await fileExists(newDir)).toBe(true);
        });

        it('should create nested directories', async () => {
            const nestedDir = path.join(testDir, 'level1', 'level2', 'level3');
            expect(await fileExists(nestedDir)).toBe(false);

            await ensureDir(nestedDir);

            expect(await fileExists(nestedDir)).toBe(true);
        });

        it('should not fail if directory already exists', async () => {
            await ensureDir(testDir);
            expect(await fileExists(testDir)).toBe(true);
        });
    });

    describe('readJson', () => {
        it('should read JSON file', async () => {
            const jsonFile = path.join(testDir, 'test.json');
            const data = { name: 'test', version: '1.0.0' };
            await fs.writeJson(jsonFile, data);

            const result = await readJson<{ name: string; version: string }>(jsonFile);

            expect(result).toEqual(data);
        });

        it('should read complex JSON structures', async () => {
            const jsonFile = path.join(testDir, 'complex.json');
            const data = {
                array: [1, 2, 3],
                nested: { a: { b: { c: 'deep' } } },
                boolean: true,
                null: null,
            };
            await fs.writeJson(jsonFile, data);

            const result = await readJson(jsonFile);

            expect(result).toEqual(data);
        });
    });

    describe('writeJson', () => {
        it('should write JSON file', async () => {
            const jsonFile = path.join(testDir, 'write.json');
            const data = { name: 'written', count: 42 };

            await writeJson(jsonFile, data);

            const content = await fs.readJson(jsonFile);
            expect(content).toEqual(data);
        });

        it('should format with 2 spaces', async () => {
            const jsonFile = path.join(testDir, 'formatted.json');
            const data = { a: 1, b: 2 };

            await writeJson(jsonFile, data);

            const raw = await fs.readFile(jsonFile, 'utf-8');
            expect(raw).toContain('  '); // Should have 2-space indentation
        });

        it('should create file if not exists', async () => {
            const jsonFile = path.join(testDir, 'new-file.json');
            expect(await fileExists(jsonFile)).toBe(false);

            await writeJson(jsonFile, { created: true });

            expect(await fileExists(jsonFile)).toBe(true);
        });

        it('should overwrite existing file', async () => {
            const jsonFile = path.join(testDir, 'overwrite.json');
            await writeJson(jsonFile, { original: true });
            await writeJson(jsonFile, { updated: true });

            const result = await readJson(jsonFile);
            expect(result).toEqual({ updated: true });
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
