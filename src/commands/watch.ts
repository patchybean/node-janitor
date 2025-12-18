import path from 'path';
import { scanNodeModules, calculateTotals } from '../core/scanner.js';
import { cleanNodeModules } from '../core/cleaner.js';
import { formatBytes, parseDuration } from '../utils/formatter.js';
import logger from '../utils/logger.js';
import chalk from 'chalk';
import type { NodeModulesInfo } from '../types/index.js';

export interface WatchOptions {
    path: string;
    depth?: number;
    olderThan?: string;
    dryRun?: boolean;
    interval?: number; // in milliseconds
    onClean?: boolean; // auto-clean when found
}

interface WatchState {
    isWatching: boolean;
    lastScan: Date | null;
    foldersFound: number;
    totalCleaned: number;
    totalFreed: number;
}

/**
 * Start watching a directory for node_modules folders
 */
export async function startWatch(options: WatchOptions): Promise<void> {
    const watchPath = path.resolve(options.path);
    const interval = options.interval || 60000; // Default 1 minute
    const olderThanDays = options.olderThan ? parseDuration(options.olderThan) : undefined;

    const state: WatchState = {
        isWatching: true,
        lastScan: null,
        foldersFound: 0,
        totalCleaned: 0,
        totalFreed: 0,
    };

    console.log(chalk.cyan('🔄 Watch Mode Started'));
    console.log(chalk.gray(`Watching: ${watchPath}`));
    console.log(chalk.gray(`Interval: ${interval / 1000}s`));
    if (olderThanDays) {
        console.log(chalk.gray(`Age filter: >${olderThanDays} days`));
    }
    if (options.onClean) {
        console.log(chalk.yellow('⚠️  Auto-clean enabled'));
    }
    console.log(chalk.gray('Press Ctrl+C to stop\n'));

    // Initial scan
    await performScan(watchPath, options, olderThanDays, state);

    // Set up interval for periodic scanning
    const intervalId = setInterval(async () => {
        await performScan(watchPath, options, olderThanDays, state);
    }, interval);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        clearInterval(intervalId);
        console.log();
        logger.success('Watch mode stopped');
        console.log(chalk.gray(`Total cleaned: ${state.totalCleaned} folders`));
        console.log(chalk.gray(`Total freed: ${formatBytes(state.totalFreed)}`));
        process.exit(0);
    });

    // Keep the process running
    await new Promise(() => { }); // Never resolves, wait for SIGINT
}

/**
 * Perform a scan and optionally clean
 */
async function performScan(
    watchPath: string,
    options: WatchOptions,
    olderThanDays: number | undefined,
    state: WatchState
): Promise<void> {
    const timestamp = new Date().toLocaleTimeString();
    process.stdout.write(chalk.gray(`[${timestamp}] Scanning... `));

    try {
        let folders = await scanNodeModules({
            path: watchPath,
            depth: options.depth,
            quick: true, // Use quick mode for watching
        });

        // Apply age filter
        if (olderThanDays !== undefined) {
            folders = folders.filter(f => f.ageDays >= olderThanDays);
        }

        state.lastScan = new Date();
        state.foldersFound = folders.length;

        if (folders.length === 0) {
            console.log(chalk.green('✓ No matching folders'));
            return;
        }

        const totals = calculateTotals(folders);
        console.log(chalk.yellow(`Found ${folders.length} folders (${formatBytes(totals.totalSize)})`));

        // Auto-clean if enabled
        if (options.onClean && !options.dryRun) {
            await performAutoClean(folders, state);
        } else {
            // Just list folders
            folders.slice(0, 5).forEach(f => {
                console.log(chalk.gray(`  → ${f.projectPath} (${f.ageDays}d)`));
            });
            if (folders.length > 5) {
                console.log(chalk.gray(`  ... and ${folders.length - 5} more`));
            }
        }
    } catch (error) {
        console.log(chalk.red('✗ Scan failed'));
        logger.debug(error instanceof Error ? error.message : String(error));
    }
}

/**
 * Auto-clean found folders
 */
async function performAutoClean(
    folders: NodeModulesInfo[],
    state: WatchState
): Promise<void> {
    try {
        const result = await cleanNodeModules(folders, { fast: true });
        state.totalCleaned += result.deletedCount;
        state.totalFreed += result.freedBytes;

        console.log(chalk.green(`  ✓ Cleaned ${result.deletedCount} folders (${formatBytes(result.freedBytes)})`));
    } catch (error) {
        console.log(chalk.red('  ✗ Clean failed'));
        logger.debug(error instanceof Error ? error.message : String(error));
    }
}

export default {
    startWatch,
};
