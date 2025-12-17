import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { deepClean } from '../src/core/deep-cleaner.js';

describe('deep-cleaner', () => {
    let testDir: string;
    let nodeModulesDir: string;

    beforeEach(async () => {
        testDir = path.join(os.tmpdir(), `node-janitor-deep-clean-test-${Date.now()}`);
        nodeModulesDir = path.join(testDir, 'node_modules');

        // Create mock node_modules with various files
        const packageDir = path.join(nodeModulesDir, 'test-package');
        await fs.ensureDir(packageDir);

        // Create files that should be deleted
        await fs.writeFile(path.join(packageDir, 'README.md'), '# Test Package');
        await fs.writeFile(path.join(packageDir, 'LICENSE'), 'MIT');
        await fs.writeFile(path.join(packageDir, 'CHANGELOG.md'), '# Changelog');
        await fs.writeFile(path.join(packageDir, 'index.js.map'), '{}');
        await fs.ensureDir(path.join(packageDir, 'test'));
        await fs.writeFile(path.join(packageDir, 'test', 'test.js'), 'test()');
        await fs.ensureDir(path.join(packageDir, 'docs'));
        await fs.writeFile(path.join(packageDir, 'docs', 'api.md'), '# API');

        // Create files that should be kept
        await fs.writeFile(path.join(packageDir, 'index.js'), 'module.exports = {}');
        await fs.writeFile(path.join(packageDir, 'package.json'), '{}');
    });

    afterEach(async () => {
        await fs.remove(testDir);
    });

    describe('deepClean', () => {
        it('should remove documentation files', async () => {
            const result = await deepClean(nodeModulesDir);

            expect(result.deletedFileCount).toBeGreaterThan(0);
            expect(await fs.pathExists(path.join(nodeModulesDir, 'test-package', 'README.md'))).toBe(false);
            expect(await fs.pathExists(path.join(nodeModulesDir, 'test-package', 'LICENSE'))).toBe(false);
        });

        it('should remove source map files', async () => {
            await deepClean(nodeModulesDir);

            expect(await fs.pathExists(path.join(nodeModulesDir, 'test-package', 'index.js.map'))).toBe(false);
        });

        it('should remove test directories', async () => {
            await deepClean(nodeModulesDir);

            expect(await fs.pathExists(path.join(nodeModulesDir, 'test-package', 'test'))).toBe(false);
        });

        it('should remove docs directories', async () => {
            await deepClean(nodeModulesDir);

            expect(await fs.pathExists(path.join(nodeModulesDir, 'test-package', 'docs'))).toBe(false);
        });

        it('should keep essential files', async () => {
            await deepClean(nodeModulesDir);

            expect(await fs.pathExists(path.join(nodeModulesDir, 'test-package', 'index.js'))).toBe(true);
            expect(await fs.pathExists(path.join(nodeModulesDir, 'test-package', 'package.json'))).toBe(true);
        });

        it('should report freed bytes', async () => {
            const result = await deepClean(nodeModulesDir);

            expect(result.freedBytes).toBeGreaterThan(0);
        });

        it('should work in dry-run mode without deleting', async () => {
            const result = await deepClean(nodeModulesDir, { dryRun: true });

            expect(result.deletedFileCount).toBeGreaterThan(0);
            // Files should still exist
            expect(await fs.pathExists(path.join(nodeModulesDir, 'test-package', 'README.md'))).toBe(true);
            expect(await fs.pathExists(path.join(nodeModulesDir, 'test-package', 'LICENSE'))).toBe(true);
        });

        it('should list deleted files in verbose mode', async () => {
            const result = await deepClean(nodeModulesDir, { verbose: true });

            expect(result.deletedFiles).toBeDefined();
            expect(result.deletedFiles!.length).toBeGreaterThan(0);
        });

        it('should handle scoped packages', async () => {
            // Create scoped package
            const scopedPackageDir = path.join(nodeModulesDir, '@test', 'package');
            await fs.ensureDir(scopedPackageDir);
            await fs.writeFile(path.join(scopedPackageDir, 'README.md'), '# Scoped');
            await fs.writeFile(path.join(scopedPackageDir, 'index.js'), 'module.exports = {}');

            const result = await deepClean(nodeModulesDir);

            expect(await fs.pathExists(path.join(scopedPackageDir, 'README.md'))).toBe(false);
            expect(await fs.pathExists(path.join(scopedPackageDir, 'index.js'))).toBe(true);
        });
    });
});
