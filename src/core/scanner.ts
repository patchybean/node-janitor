import fs from 'fs-extra';
import path from 'path';
import type { NodeModulesInfo, ScanOptions } from '../types/index.js';
import {
    getFolderSizeFast,
    getLastModified,
    countPackages,
    fileExists,
} from '../utils/fs-utils.js';
import { getAgeDays } from '../utils/formatter.js';
import { getGitStatus } from '../utils/git-utils.js';
import logger from '../utils/logger.js';
import { scanNodeModulesFast } from './fast-scanner.js';

// Folders to skip when scanning
const SKIP_FOLDERS = new Set([
    '.git',
    '.svn',
    '.hg',
    '.cache',
    '.npm',
    '.yarn',
    '.pnpm-store',
    'Library',
    'Applications',
    '.Trash',
]);

/**
 * Scan for node_modules folders
 * Uses fast native scanner by default, falls back to JS scanner on error
 */
export async function scanNodeModules(
    options: ScanOptions,
    onProgress?: (current: number, found: number, path: string) => void
): Promise<NodeModulesInfo[]> {
    // Try fast scanner first (uses native find command)
    try {
        const fastResults = await scanNodeModulesFast(options, onProgress);
        if (fastResults.length > 0 || options.quick) {
            return fastResults;
        }
        // If no results, try JS scanner as fallback
        logger.debug('Fast scanner returned 0 results, trying JS scanner');
    } catch (error) {
        logger.debug(`Fast scanner failed, using JS fallback: ${error}`);
    }

    // Fallback to JS scanner
    return scanNodeModulesJS(options, onProgress);
}

/**
 * Original JS-based scanner (fallback)
 */
async function scanNodeModulesJS(
    options: ScanOptions,
    onProgress?: (current: number, found: number, path: string) => void
): Promise<NodeModulesInfo[]> {
    const results: NodeModulesInfo[] = [];
    let scannedCount = 0;

    async function scan(dir: string, depth: number): Promise<void> {
        if (options.depth !== undefined && depth > options.depth) {
            return;
        }

        let items: string[];
        try {
            items = await fs.readdir(dir);
        } catch {
            // Permission denied or other error
            return;
        }

        for (const item of items) {
            // Skip hidden and system folders
            if (item.startsWith('.') || SKIP_FOLDERS.has(item)) {
                continue;
            }

            const itemPath = path.join(dir, item);

            // Check exclusion patterns
            if (options.excludePatterns?.some(pattern => {
                if (pattern.includes('*')) {
                    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                    return regex.test(itemPath);
                }
                return itemPath.includes(pattern);
            })) {
                continue;
            }

            let stats;
            try {
                stats = await fs.stat(itemPath);
            } catch {
                continue;
            }

            if (!stats.isDirectory()) {
                continue;
            }

            if (item === 'node_modules') {
                scannedCount++;
                const projectPath = dir;

                // Report progress
                onProgress?.(scannedCount, results.length, projectPath);

                // Get folder info
                const info = await getNodeModulesInfo(itemPath, projectPath, options.quick);
                results.push(info);

                // Don't scan inside node_modules
                continue;
            }

            // Recursively scan subdirectories
            await scan(itemPath, depth + 1);
        }
    }

    const startPath = path.resolve(options.path);
    logger.debug(`Starting scan from: ${startPath} `);

    await scan(startPath, 0);

    // Apply include pattern filter (whitelist)
    let filteredResults = results;
    if (options.includePatterns && options.includePatterns.length > 0) {
        filteredResults = results.filter(folder => {
            return options.includePatterns!.some(pattern => {
                if (pattern.includes('*')) {
                    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                    return regex.test(folder.projectPath) || regex.test(folder.path);
                }
                return folder.projectPath.includes(pattern) || folder.path.includes(pattern);
            });
        });
        logger.debug(`Include filter: ${results.length} -> ${filteredResults.length} folders`);
    }

    // Sort by size descending
    filteredResults.sort((a, b) => b.size - a.size);

    return filteredResults;
}

/**
 * Get detailed info about a node_modules folder
 */
async function getNodeModulesInfo(
    nodeModulesPath: string,
    projectPath: string,
    quick = false
): Promise<NodeModulesInfo> {
    // Get basic info
    const lastModified = await getLastModified(nodeModulesPath);
    const ageDays = getAgeDays(lastModified);

    // Get size (optional for quick mode)
    let size = 0;
    if (!quick) {
        size = await getFolderSizeFast(nodeModulesPath);
    }

    // Get package count
    const packageCount = await countPackages(nodeModulesPath);

    // Check for lockfiles
    const [hasPackageLock, hasYarnLock, hasPnpmLock] = await Promise.all([
        fileExists(path.join(projectPath, 'package-lock.json')),
        fileExists(path.join(projectPath, 'yarn.lock')),
        fileExists(path.join(projectPath, 'pnpm-lock.yaml')),
    ]);

    // Get git status
    const gitStatus = await getGitStatus(projectPath);

    return {
        path: nodeModulesPath,
        projectPath,
        size,
        lastModified,
        packageCount,
        hasPackageLock,
        hasYarnLock,
        hasPnpmLock,
        ageDays,
        gitStatus,
    };
}

/**
 * Filter folders by age
 */
export function filterByAge(
    folders: NodeModulesInfo[],
    minAgeDays?: number,
    maxAgeDays?: number
): NodeModulesInfo[] {
    return folders.filter(folder => {
        if (minAgeDays !== undefined && folder.ageDays < minAgeDays) {
            return false;
        }
        if (maxAgeDays !== undefined && folder.ageDays > maxAgeDays) {
            return false;
        }
        return true;
    });
}

/**
 * Filter folders by size
 */
export function filterBySize(
    folders: NodeModulesInfo[],
    minSize?: number,
    maxSize?: number
): NodeModulesInfo[] {
    return folders.filter(folder => {
        if (minSize !== undefined && folder.size < minSize) {
            return false;
        }
        if (maxSize !== undefined && folder.size > maxSize) {
            return false;
        }
        return true;
    });
}

/**
 * Filter folders that have lockfile
 */
export function filterWithLockfile(folders: NodeModulesInfo[]): NodeModulesInfo[] {
    return folders.filter(
        folder => folder.hasPackageLock || folder.hasYarnLock || folder.hasPnpmLock
    );
}

/**
 * Filter folders by git status (skip dirty repos)
 */
export function filterByGitStatus(
    folders: NodeModulesInfo[],
    skipDirty = false,
    onlyInGitRepo = false
): NodeModulesInfo[] {
    return folders.filter(folder => {
        if (onlyInGitRepo && !folder.gitStatus?.isGitRepo) {
            return false;
        }
        if (skipDirty && folder.gitStatus?.isDirty) {
            return false;
        }
        return true;
    });
}

/**
 * Calculate totals
 */
export function calculateTotals(folders: NodeModulesInfo[]): {
    totalFolders: number;
    totalSize: number;
    oldestAge: number;
    newestAge: number;
} {
    if (folders.length === 0) {
        return { totalFolders: 0, totalSize: 0, oldestAge: 0, newestAge: 0 };
    }

    const totalFolders = folders.length;
    const totalSize = folders.reduce((sum, f) => sum + f.size, 0);
    const ages = folders.map(f => f.ageDays);
    const oldestAge = Math.max(...ages);
    const newestAge = Math.min(...ages);

    return { totalFolders, totalSize, oldestAge, newestAge };
}

export default {
    scanNodeModules,
    filterByAge,
    filterBySize,
    filterByGitStatus,
    filterWithLockfile,
    calculateTotals,
};
