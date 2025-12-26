import { execSync } from 'child_process';
import path from 'path';
import pLimit from 'p-limit';
import type { NodeModulesInfo, ScanOptions } from '../types/index.js';
import {
    getFolderSizeFast,
    getLastModified,
    countPackages,
    fileExists,
} from '../utils/fs-utils.js';
import { getAgeDays } from '../utils/formatter.js';
import logger from '../utils/logger.js';

/**
 * Ultra-fast scanner using native OS commands
 * Uses `find` on Unix for blazing fast directory discovery
 */
export async function scanNodeModulesFast(
    options: ScanOptions,
    onProgress?: (current: number, found: number, path: string) => void
): Promise<NodeModulesInfo[]> {
    const startPath = path.resolve(options.path);
    logger.debug(`Fast scan starting from: ${startPath}`);

    // Use native find command for discovery
    const nodeModulesPaths = findNodeModulesNative(startPath, options.depth);
    logger.debug(`Found ${nodeModulesPaths.length} node_modules via native find`);

    if (nodeModulesPaths.length === 0) {
        return [];
    }

    // Apply exclusion patterns and skip hidden/system folders
    let filteredPaths = nodeModulesPaths.filter(p => {
        // Skip paths containing hidden folders (starting with .)
        const parts = p.split(path.sep);
        const hasHidden = parts.some(part =>
            part.startsWith('.') && part !== '.' && part !== '..'
        );
        if (hasHidden) return false;

        // Skip system folders
        const skipFolders = ['Library', 'Applications', '.Trash', '.npm', '.yarn', '.pnpm-store'];
        const hasSystemFolder = parts.some(part => skipFolders.includes(part));
        if (hasSystemFolder) return false;

        return true;
    });

    // Apply user exclusion patterns
    if (options.excludePatterns && options.excludePatterns.length > 0) {
        filteredPaths = filteredPaths.filter(p => {
            return !options.excludePatterns!.some(pattern => {
                if (pattern.includes('*')) {
                    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                    return regex.test(p);
                }
                return p.includes(pattern);
            });
        });
    }

    // Collect metadata in parallel
    const limit = pLimit(10); // 10 concurrent operations
    const results: NodeModulesInfo[] = [];
    let completed = 0;

    const promises = filteredPaths.map(nodeModulesPath =>
        limit(async () => {
            const projectPath = path.dirname(nodeModulesPath);
            const info = await getNodeModulesInfoFast(nodeModulesPath, projectPath, options.quick);
            completed++;
            onProgress?.(completed, filteredPaths.length, projectPath);
            return info;
        })
    );

    const collected = await Promise.all(promises);
    results.push(...collected);

    // Apply include pattern filter
    let finalResults = results;
    if (options.includePatterns && options.includePatterns.length > 0) {
        finalResults = results.filter(folder => {
            return options.includePatterns!.some(pattern => {
                if (pattern.includes('*')) {
                    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                    return regex.test(folder.projectPath) || regex.test(folder.path);
                }
                return folder.projectPath.includes(pattern) || folder.path.includes(pattern);
            });
        });
    }

    // Sort by size descending
    finalResults.sort((a, b) => b.size - a.size);

    return finalResults;
}

/**
 * Use native find command for blazing fast discovery
 */
function findNodeModulesNative(startPath: string, maxDepth?: number): string[] {
    try {
        // Build find command
        let cmd: string;
        const depthArg = maxDepth !== undefined ? `-maxdepth ${maxDepth + 1}` : '';

        if (process.platform === 'win32') {
            // Windows: use dir command
            cmd = `dir /s /b /ad "${startPath}" 2>nul | findstr /i "\\\\node_modules$"`;
        } else {
            // Unix: use find with prune for efficiency
            cmd = `find "${startPath}" ${depthArg} -type d -name "node_modules" -prune 2>/dev/null`;
        }

        const output = execSync(cmd, {
            encoding: 'utf-8',
            maxBuffer: 100 * 1024 * 1024, // 100MB buffer
            timeout: 60000, // 60s timeout
        });

        return output
            .trim()
            .split('\n')
            .filter(line => line.length > 0);
    } catch (error) {
        logger.debug(`Native find failed, falling back to JS: ${error}`);
        return [];
    }
}

/**
 * Get folder info with optimized parallel operations
 */
async function getNodeModulesInfoFast(
    nodeModulesPath: string,
    projectPath: string,
    quick = false
): Promise<NodeModulesInfo> {
    // Run independent operations in parallel
    const [
        lastModified,
        hasPackageLock,
        hasYarnLock,
        hasPnpmLock,
    ] = await Promise.all([
        getLastModified(nodeModulesPath),
        fileExists(path.join(projectPath, 'package-lock.json')),
        fileExists(path.join(projectPath, 'yarn.lock')),
        fileExists(path.join(projectPath, 'pnpm-lock.yaml')),
    ]);

    const ageDays = getAgeDays(lastModified);

    // Size and package count - only if needed
    let size = 0;
    let packageCount = 0;

    if (!quick) {
        // Run size and package count in parallel
        [size, packageCount] = await Promise.all([
            getFolderSizeFast(nodeModulesPath),
            countPackages(nodeModulesPath),
        ]);
    } else {
        // Quick mode: only get package count (fast)
        packageCount = await countPackages(nodeModulesPath);
    }

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
        // Skip git status in fast mode - it's expensive
    };
}

export default {
    scanNodeModulesFast,
    findNodeModulesNative,
};
