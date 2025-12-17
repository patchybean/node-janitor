import pLimit from 'p-limit';
import type { NodeModulesInfo, CleanOptions, CleanResult, BackupData } from '../types/index.js';
import { deleteFolder, deleteFolderFast, ensureDir, writeJson, getBackupsDir } from '../utils/fs-utils.js';
import { parseDuration, parseDurationRange, parseSize } from '../utils/formatter.js';
import { filterByAge, filterBySize, filterWithLockfile } from './scanner.js';
import logger from '../utils/logger.js';
import dayjs from 'dayjs';

/**
 * Clean node_modules folders
 */
export async function cleanNodeModules(
    folders: NodeModulesInfo[],
    options: CleanOptions,
    onProgress?: (current: number, total: number, path: string) => void
): Promise<CleanResult> {
    const result: CleanResult = {
        deletedCount: 0,
        freedBytes: 0,
        deletedPaths: [],
        errors: [],
    };

    // Apply filters
    let filteredFolders = [...folders];

    // Filter by age
    if (options.olderThan) {
        const days = parseDuration(options.olderThan);
        filteredFolders = filterByAge(filteredFolders, days);
        logger.debug(`After olderThan filter: ${filteredFolders.length} folders`);
    }

    if (options.between) {
        const { min, max } = parseDurationRange(options.between);
        filteredFolders = filterByAge(filteredFolders, min, max);
        logger.debug(`After between filter: ${filteredFolders.length} folders`);
    }

    // Filter by size
    if (options.minSize) {
        const minBytes = parseSize(options.minSize);
        filteredFolders = filterBySize(filteredFolders, minBytes);
        logger.debug(`After minSize filter: ${filteredFolders.length} folders`);
    }

    if (options.maxSize) {
        const maxBytes = parseSize(options.maxSize);
        filteredFolders = filterBySize(filteredFolders, undefined, maxBytes);
        logger.debug(`After maxSize filter: ${filteredFolders.length} folders`);
    }

    // Filter by lockfile
    if (options.lockCheck) {
        filteredFolders = filterWithLockfile(filteredFolders);
        logger.debug(`After lockCheck filter: ${filteredFolders.length} folders`);
    }

    // Dry run - just return what would be deleted
    if (options.dryRun) {
        return {
            deletedCount: filteredFolders.length,
            freedBytes: filteredFolders.reduce((sum, f) => sum + f.size, 0),
            deletedPaths: filteredFolders.map(f => f.path),
            errors: [],
        };
    }

    // Create backup if requested
    if (options.backup) {
        result.backupPath = await createBackup(filteredFolders);
        logger.debug(`Backup created at: ${result.backupPath}`);
    }

    // Delete folders
    const deleteFunc = options.fast ? deleteFolderFast : deleteFolder;
    const parallelLimit = options.parallel || 1;
    const limit = pLimit(parallelLimit);

    const deletePromises = filteredFolders.map((folder, index) =>
        limit(async () => {
            try {
                onProgress?.(index + 1, filteredFolders.length, folder.path);
                await deleteFunc(folder.path);
                result.deletedCount++;
                result.freedBytes += folder.size;
                result.deletedPaths.push(folder.path);
            } catch (error) {
                result.errors.push({
                    path: folder.path,
                    message: error instanceof Error ? error.message : String(error),
                });
            }
        })
    );

    await Promise.all(deletePromises);

    return result;
}

/**
 * Create a backup of folder info before deletion
 */
async function createBackup(folders: NodeModulesInfo[]): Promise<string> {
    const backupsDir = getBackupsDir();
    await ensureDir(backupsDir);

    const timestamp = dayjs().format('YYYY_MM_DD_HHmmss');
    const filename = `backup_${timestamp}.json`;
    const filepath = `${backupsDir}/${filename}`;

    const backupData: BackupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        folders: folders.map(f => ({
            path: f.path,
            size: f.size,
            packageJsonPath: `${f.projectPath}/package.json`,
            lockfileType: f.hasPackageLock ? 'npm' : f.hasYarnLock ? 'yarn' : f.hasPnpmLock ? 'pnpm' : undefined,
        })),
        totalSize: folders.reduce((sum, f) => sum + f.size, 0),
        totalFolders: folders.length,
    };

    await writeJson(filepath, backupData);

    return filepath;
}

export default { cleanNodeModules };
