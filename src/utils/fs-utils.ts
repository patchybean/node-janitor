import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Get folder size recursively
 */
export async function getFolderSize(folderPath: string): Promise<number> {
    let totalSize = 0;

    try {
        const items = await fs.readdir(folderPath);

        for (const item of items) {
            const itemPath = path.join(folderPath, item);
            const stats = await fs.stat(itemPath);

            if (stats.isDirectory()) {
                totalSize += await getFolderSize(itemPath);
            } else {
                totalSize += stats.size;
            }
        }
    } catch {
        // Ignore permission errors
    }

    return totalSize;
}

/**
 * Get folder size using native commands (faster)
 */
export async function getFolderSizeFast(folderPath: string): Promise<number> {
    try {
        if (process.platform === 'win32') {
            // Windows: Use PowerShell
            const { stdout } = await execAsync(
                `powershell -command "(Get-ChildItem -Recurse '${folderPath}' | Measure-Object -Property Length -Sum).Sum"`,
                { timeout: 30000 }
            );
            return parseInt(stdout.trim(), 10) || 0;
        } else {
            // Unix: Use du
            const { stdout } = await execAsync(`du -sk "${folderPath}"`, { timeout: 30000 });
            const sizeKb = parseInt(stdout.split('\t')[0], 10);
            return sizeKb * 1024;
        }
    } catch {
        // Fallback to recursive method
        return getFolderSize(folderPath);
    }
}

/**
 * Get last modified time of a folder (based on node_modules folder itself)
 */
export async function getLastModified(folderPath: string): Promise<Date> {
    try {
        const stats = await fs.stat(folderPath);
        return stats.mtime;
    } catch {
        return new Date();
    }
}

/**
 * Count items in a folder (top-level only)
 */
export async function countPackages(nodeModulesPath: string): Promise<number> {
    try {
        const items = await fs.readdir(nodeModulesPath);
        // Filter out hidden files and scoped packages
        let count = 0;
        for (const item of items) {
            if (item.startsWith('.')) continue;
            if (item.startsWith('@')) {
                // Scoped package - count subpackages
                const scopePath = path.join(nodeModulesPath, item);
                const scopeItems = await fs.readdir(scopePath);
                count += scopeItems.filter(i => !i.startsWith('.')).length;
            } else {
                count++;
            }
        }
        return count;
    } catch {
        return 0;
    }
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Delete folder using native commands (faster)
 */
export async function deleteFolderFast(folderPath: string): Promise<void> {
    if (process.platform === 'win32') {
        await execAsync(`rd /s /q "${folderPath}"`, { timeout: 60000 });
    } else {
        await execAsync(`rm -rf "${folderPath}"`, { timeout: 60000 });
    }
}

/**
 * Delete folder using fs-extra (safer, cross-platform)
 */
export async function deleteFolder(folderPath: string): Promise<void> {
    await fs.remove(folderPath);
}

/**
 * Ensure directory exists
 */
export async function ensureDir(dirPath: string): Promise<void> {
    await fs.ensureDir(dirPath);
}

/**
 * Read JSON file
 */
export async function readJson<T>(filePath: string): Promise<T> {
    return fs.readJson(filePath);
}

/**
 * Write JSON file
 */
export async function writeJson(filePath: string, data: unknown): Promise<void> {
    await fs.writeJson(filePath, data, { spaces: 2 });
}

/**
 * Get home directory path
 */
export function getHomeDir(): string {
    return process.env.HOME || process.env.USERPROFILE || '~';
}

/**
 * Get node-janitor data directory
 */
export function getDataDir(): string {
    return path.join(getHomeDir(), '.node-janitor');
}

/**
 * Get backups directory
 */
export function getBackupsDir(): string {
    return path.join(getDataDir(), 'backups');
}
