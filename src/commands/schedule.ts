import { CronJob } from 'cron';
import chalk from 'chalk';
import { scanNodeModules, calculateTotals, filterByAge } from '../core/scanner.js';
import { cleanNodeModules } from '../core/cleaner.js';
import { formatBytes, parseDuration } from '../utils/formatter.js';
import logger from '../utils/logger.js';

export interface ScheduleOptions {
    path: string;
    cron: string; // Cron expression
    olderThan?: string;
    dryRun?: boolean;
    depth?: number;
}

interface ScheduleStats {
    lastRun: Date | null;
    totalRuns: number;
    totalCleaned: number;
    totalFreed: number;
}

/**
 * Start a scheduled cleanup job
 */
export function startSchedule(options: ScheduleOptions): void {
    const stats: ScheduleStats = {
        lastRun: null,
        totalRuns: 0,
        totalCleaned: 0,
        totalFreed: 0,
    };

    const olderThanDays = options.olderThan ? parseDuration(options.olderThan) : undefined;

    console.log(chalk.cyan('📅 Scheduled Cleanup Started'));
    console.log(chalk.gray(`Path: ${options.path}`));
    console.log(chalk.gray(`Schedule: ${options.cron}`));
    if (olderThanDays) {
        console.log(chalk.gray(`Age filter: >${olderThanDays} days`));
    }
    if (options.dryRun) {
        console.log(chalk.yellow('⚠️  Dry run mode enabled'));
    }
    console.log(chalk.gray('Press Ctrl+C to stop\n'));

    // Create cron job
    const job = new CronJob(
        options.cron,
        async () => {
            await runScheduledCleanup(options, olderThanDays, stats);
        },
        null, // onComplete
        true, // start now
        undefined, // timezone
        null, // context
        false // runOnInit
    );

    // Show next run time
    const nextRun = job.nextDate();
    console.log(chalk.gray(`Next run: ${nextRun.toLocaleString()}`));

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        job.stop();
        console.log();
        logger.success('Scheduled cleanup stopped');
        console.log(chalk.gray(`Total runs: ${stats.totalRuns}`));
        console.log(chalk.gray(`Total cleaned: ${stats.totalCleaned} folders`));
        console.log(chalk.gray(`Total freed: ${formatBytes(stats.totalFreed)}`));
        process.exit(0);
    });
}

/**
 * Run the scheduled cleanup task
 */
async function runScheduledCleanup(
    options: ScheduleOptions,
    olderThanDays: number | undefined,
    stats: ScheduleStats
): Promise<void> {
    const timestamp = new Date().toLocaleString();
    console.log(chalk.cyan(`\n[${timestamp}] Running scheduled cleanup...`));

    try {
        let folders = await scanNodeModules({
            path: options.path,
            depth: options.depth,
            quick: false,
        });

        // Apply age filter
        if (olderThanDays !== undefined) {
            folders = filterByAge(folders, olderThanDays);
        }

        stats.lastRun = new Date();
        stats.totalRuns++;

        if (folders.length === 0) {
            console.log(chalk.green('✓ No folders to clean'));
            return;
        }

        const totals = calculateTotals(folders);
        console.log(chalk.yellow(`Found ${folders.length} folders (${formatBytes(totals.totalSize)})`));

        if (options.dryRun) {
            console.log(chalk.gray('Dry run - no files deleted'));
            folders.slice(0, 5).forEach(f => {
                console.log(chalk.gray(`  → ${f.projectPath} (${f.ageDays}d)`));
            });
            return;
        }

        // Perform cleanup
        const result = await cleanNodeModules(folders, { fast: true });
        stats.totalCleaned += result.deletedCount;
        stats.totalFreed += result.freedBytes;

        console.log(chalk.green(`✓ Cleaned ${result.deletedCount} folders`));
        console.log(chalk.green(`✓ Freed ${formatBytes(result.freedBytes)}`));

        if (result.errors.length > 0) {
            console.log(chalk.red(`✗ ${result.errors.length} errors`));
        }
    } catch (error) {
        console.log(chalk.red('✗ Cleanup failed'));
        logger.debug(error instanceof Error ? error.message : String(error));
    }
}

/**
 * Run cleanup once (for manual/immediate trigger)
 */
export async function runOnce(options: Omit<ScheduleOptions, 'cron'>): Promise<void> {
    const stats: ScheduleStats = {
        lastRun: null,
        totalRuns: 0,
        totalCleaned: 0,
        totalFreed: 0,
    };

    const olderThanDays = options.olderThan ? parseDuration(options.olderThan) : undefined;
    await runScheduledCleanup({ ...options, cron: '' }, olderThanDays, stats);
}

// Common cron presets
export const cronPresets = {
    daily: '0 0 * * *',        // Every day at midnight
    weekly: '0 0 * * 0',       // Every Sunday at midnight
    monthly: '0 0 1 * *',      // First day of month at midnight
    hourly: '0 * * * *',       // Every hour
    every6hours: '0 */6 * * *', // Every 6 hours
};

export default {
    startSchedule,
    runOnce,
    cronPresets,
};
