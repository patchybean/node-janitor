import fs from 'fs-extra';
import path from 'path';
import type { DeepCleanOptions, DeepCleanResult } from '../types/index.js';
import logger from '../utils/logger.js';

// Patterns for files/folders to delete in deep clean mode
const DEEP_CLEAN_PATTERNS = {
    // Documentation files
    files: [
        'README.md',
        'README.markdown',
        'README.txt',
        'readme.md',
        'readme.txt',
        'CHANGELOG.md',
        'CHANGELOG.txt',
        'CHANGES.md',
        'HISTORY.md',
        'LICENSE',
        'LICENSE.md',
        'LICENSE.txt',
        'license',
        'LICENCE',
        'LICENCE.md',
        'COPYING',
        'AUTHORS',
        'CONTRIBUTORS',
        '.npmignore',
        '.gitignore',
        '.eslintrc',
        '.eslintrc.js',
        '.eslintrc.json',
        '.prettierrc',
        '.prettierrc.js',
        '.prettierrc.json',
        '.babelrc',
        '.editorconfig',
        'tsconfig.json',
        'tslint.json',
        '.travis.yml',
        'appveyor.yml',
        'Makefile',
        'Gulpfile.js',
        'Gruntfile.js',
        'rollup.config.js',
        'webpack.config.js',
    ],
    // File extensions to remove
    extensions: [
        '.md',
        '.markdown',
        '.map',
        '.ts.map',
        '.js.map',
        '.min.map',
    ],
    // Directories to remove
    directories: [
        'test',
        'tests',
        '__tests__',
        'spec',
        'specs',
        'example',
        'examples',
        'doc',
        'docs',
        'documentation',
        'coverage',
        '.nyc_output',
        '.github',
        '.vscode',
        '.idea',
        'benchmark',
        'benchmarks',
        'fixtures',
        '__fixtures__',
        '__mocks__',
    ],
};

/**
 * Deep clean a node_modules folder by removing unnecessary files
 */
export async function deepClean(
    nodeModulesPath: string,
    options: DeepCleanOptions = {},
    onProgress?: (packageName: string) => void
): Promise<DeepCleanResult> {
    const result: DeepCleanResult = {
        deletedFileCount: 0,
        processedFolders: 0,
        freedBytes: 0,
        deletedFiles: options.verbose ? [] : undefined,
    };

    // Get all package directories
    const packages = await getPackageDirectories(nodeModulesPath);
    result.processedFolders = packages.length;

    for (const packagePath of packages) {
        const packageName = path.basename(packagePath);
        onProgress?.(packageName);

        // Clean files
        for (const filename of DEEP_CLEAN_PATTERNS.files) {
            const filePath = path.join(packagePath, filename);
            const freed = await safeDelete(filePath, options.dryRun);
            if (freed > 0) {
                result.deletedFileCount++;
                result.freedBytes += freed;
                result.deletedFiles?.push(filePath);
            }
        }

        // Clean by extension
        await cleanByExtension(packagePath, DEEP_CLEAN_PATTERNS.extensions, result, options);

        // Clean directories
        for (const dirName of DEEP_CLEAN_PATTERNS.directories) {
            const dirPath = path.join(packagePath, dirName);
            const freed = await safeDeleteDir(dirPath, options.dryRun);
            if (freed > 0) {
                result.deletedFileCount++;
                result.freedBytes += freed;
                result.deletedFiles?.push(dirPath);
            }
        }
    }

    return result;
}

/**
 * Get all package directories (including scoped packages)
 */
async function getPackageDirectories(nodeModulesPath: string): Promise<string[]> {
    const packages: string[] = [];

    try {
        const items = await fs.readdir(nodeModulesPath);

        for (const item of items) {
            if (item.startsWith('.')) continue;

            const itemPath = path.join(nodeModulesPath, item);
            const stats = await fs.stat(itemPath);

            if (!stats.isDirectory()) continue;

            if (item.startsWith('@')) {
                // Scoped package - get subpackages
                const scopedItems = await fs.readdir(itemPath);
                for (const scopedItem of scopedItems) {
                    packages.push(path.join(itemPath, scopedItem));
                }
            } else {
                packages.push(itemPath);
            }
        }
    } catch {
        logger.debug(`Error reading ${nodeModulesPath}`);
    }

    return packages;
}

/**
 * Clean files by extension in a directory
 */
async function cleanByExtension(
    dirPath: string,
    extensions: string[],
    result: DeepCleanResult,
    options: DeepCleanOptions
): Promise<void> {
    try {
        const items = await fs.readdir(dirPath);

        for (const item of items) {
            for (const ext of extensions) {
                if (item.endsWith(ext)) {
                    const filePath = path.join(dirPath, item);
                    const freed = await safeDelete(filePath, options.dryRun);
                    if (freed > 0) {
                        result.deletedFileCount++;
                        result.freedBytes += freed;
                        result.deletedFiles?.push(filePath);
                    }
                    break;
                }
            }
        }
    } catch {
        // Ignore errors
    }
}

/**
 * Safely delete a file and return its size
 */
async function safeDelete(filePath: string, dryRun = false): Promise<number> {
    try {
        const stats = await fs.stat(filePath);
        if (!stats.isFile()) return 0;

        const size = stats.size;

        if (!dryRun) {
            await fs.remove(filePath);
        }

        return size;
    } catch {
        return 0;
    }
}

/**
 * Safely delete a directory and return its size
 */
async function safeDeleteDir(dirPath: string, dryRun = false): Promise<number> {
    try {
        const stats = await fs.stat(dirPath);
        if (!stats.isDirectory()) return 0;

        // Calculate size
        let size = 0;
        const calculateSize = async (dir: string): Promise<void> => {
            const items = await fs.readdir(dir);
            for (const item of items) {
                const itemPath = path.join(dir, item);
                const itemStats = await fs.stat(itemPath);
                if (itemStats.isDirectory()) {
                    await calculateSize(itemPath);
                } else {
                    size += itemStats.size;
                }
            }
        };
        await calculateSize(dirPath);

        if (!dryRun) {
            await fs.remove(dirPath);
        }

        return size;
    } catch {
        return 0;
    }
}

export default { deepClean };
