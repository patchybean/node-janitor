import { Command } from 'commander';
import chalk from 'chalk';
import { scanNodeModules, calculateTotals, filterByAge } from './core/scanner.js';
import { cleanNodeModules } from './core/cleaner.js';
import { deepClean } from './core/deep-cleaner.js';
import { createSpinner } from './ui/spinner.js';
import { createFoldersTable, createSummaryTable, createBreakdownTable } from './ui/table.js';
import { createProgressBar, updateProgress, stopProgress } from './ui/progress.js';
import {
    promptPath,
    promptAge,
    promptConfirm,
    promptViewList,
    promptDelete,
    promptAction,
    promptSelectFolders,
} from './ui/prompts.js';
import logger from './utils/logger.js';
import { formatBytes, parseDuration } from './utils/formatter.js';
import type { NodeModulesInfo, GlobalOptions } from './types/index.js';

const VERSION = '1.0.1';

// ASCII Art Banner
const BANNER = chalk.cyan(`
 ███╗   ██╗ ██████╗ ██████╗ ███████╗       ██╗ █████╗ ███╗   ██╗██╗████████╗ ██████╗ ██████╗ 
 ████╗  ██║██╔═══██╗██╔══██╗██╔════╝       ██║██╔══██╗████╗  ██║██║╚══██╔══╝██╔═══██╗██╔══██╗
 ██╔██╗ ██║██║   ██║██║  ██║█████╗         ██║███████║██╔██╗ ██║██║   ██║   ██║   ██║██████╔╝
 ██║╚██╗██║██║   ██║██║  ██║██╔══╝    ██   ██║██╔══██║██║╚██╗██║██║   ██║   ██║   ██║██╔══██╗
 ██║ ╚████║╚██████╔╝██████╔╝███████╗  ╚█████╔╝██║  ██║██║ ╚████║██║   ██║   ╚██████╔╝██║  ██║
 ╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚══════╝   ╚════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝
`);

export function createProgram(): Command {
    const program = new Command();

    program
        .name('node-janitor')
        .version(VERSION)
        .description('🧹 Smart CLI tool to clean up node_modules folders')
        .option('-p, --path <path>', 'Directory to scan', process.cwd())
        .option('-d, --depth <number>', 'Maximum depth to scan', parseInt)
        .option('--older-than <duration>', 'Only process folders older than (e.g., 30d, 3m, 1y)')
        .option('--between <range>', 'Only process folders in age range (e.g., 30d-90d)')
        .option('--min-size <size>', 'Only process folders larger than (e.g., 500MB)')
        .option('--max-size <size>', 'Only process folders smaller than (e.g., 10MB)')
        .option('--dry-run', 'Preview only, do not delete anything')
        .option('--deep-clean', 'Remove unnecessary files from node_modules')
        .option('--fast', 'Use native OS commands for faster deletion')
        .option('--parallel <number>', 'Number of parallel deletions', parseInt)
        .option('--backup', 'Create backup before deletion')
        .option('--lock-check', 'Only delete if lockfile exists')
        .option('--quick', 'Quick scan (skip size calculation)')
        .option('-i, --interactive', 'Interactive mode')
        .option('-v, --verbose', 'Verbose output')
        .option('--debug', 'Debug mode')
        .option('--silent', 'Silent mode (for CI/CD)')
        .option('--json', 'Output as JSON')
        .option('--exclude <patterns>', 'Exclude patterns (comma-separated)')
        .option('--include <patterns>', 'Include only matching patterns (comma-separated)')
        .action(async (options) => {
            await mainAction(options);
        });

    // Report sub-command
    program
        .command('report')
        .description('📊 Generate a detailed report')
        .option('-p, --path <path>', 'Directory to scan', process.cwd())
        .option('-d, --depth <number>', 'Maximum depth to scan', parseInt)
        .option('--detailed', 'Show detailed breakdown')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
            await reportAction(options);
        });

    return program;
}

/**
 * Main action handler
 */
async function mainAction(options: GlobalOptions & Record<string, unknown>): Promise<void> {
    // Configure logger
    logger.configure({
        verbose: options.verbose as boolean,
        debug: options.debug as boolean,
        silent: options.silent as boolean,
    });

    // Interactive mode
    if (options.interactive) {
        await interactiveMode();
        return;
    }

    // Show banner (unless silent/json)
    if (!options.silent && !options.json) {
        console.log(BANNER);
    }

    // Scan
    const scanPath = (options.path as string) || process.cwd();
    const excludePatterns = options.exclude
        ? (options.exclude as string).split(',').map(s => s.trim())
        : [];
    const includePatterns = options.include
        ? (options.include as string).split(',').map(s => s.trim())
        : [];

    const spinner = createSpinner(`🔍 Scanning ${scanPath}...`);
    spinner.start();

    let folders: NodeModulesInfo[];
    try {
        folders = await scanNodeModules({
            path: scanPath,
            depth: options.depth as number | undefined,
            quick: options.quick as boolean,
            excludePatterns,
            includePatterns,
        });
        spinner.succeed(`Found ${folders.length} node_modules folders`);
    } catch (error) {
        spinner.fail('Scan failed');
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    }

    if (folders.length === 0) {
        logger.info('No node_modules folders found.');
        return;
    }

    // Apply age filter for display
    let displayFolders = folders;
    if (options.olderThan) {
        const days = parseDuration(options.olderThan as string);
        displayFolders = filterByAge(folders, days);
    }

    // JSON output
    if (options.json) {
        const totals = calculateTotals(displayFolders);
        console.log(JSON.stringify({
            folders: displayFolders,
            ...totals,
        }, null, 2));
        return;
    }

    // Show results
    if (displayFolders.length > 0) {
        console.log();
        console.log(createFoldersTable(displayFolders.slice(0, 20)));

        if (displayFolders.length > 20) {
            logger.info(`...and ${displayFolders.length - 20} more folders`);
        }

        const totals = calculateTotals(displayFolders);
        console.log();
        console.log(createSummaryTable(totals));
    }

    // Dry run
    if (options.dryRun) {
        logger.info('🔍 Dry run mode - no files will be deleted');
        return;
    }

    // Deep clean mode
    if (options.deepClean) {
        await performDeepClean(displayFolders, options);
        return;
    }

    // Normal clean - ask for confirmation if not in silent mode
    if (!options.silent) {
        const totals = calculateTotals(displayFolders);
        const confirmed = await promptConfirm(
            `🗑️  Delete ${displayFolders.length} folders (${formatBytes(totals.totalSize)})?`
        );
        if (!confirmed) {
            logger.info('Cancelled.');
            return;
        }
    }

    // Perform cleanup
    await performClean(displayFolders, options);
}

/**
 * Interactive mode
 */
async function interactiveMode(): Promise<void> {
    console.log(BANNER);
    console.log(chalk.gray('🎮 Interactive Mode'));
    console.log();

    while (true) {
        const action = await promptAction();

        if (action === 'exit') {
            logger.success('Goodbye! 👋');
            break;
        }

        if (action === 'scan' || action === 'clean') {
            const scanPath = await promptPath(process.cwd());
            const ageFilter = await promptAge();

            const spinner = createSpinner(`🔍 Scanning ${scanPath}...`);
            spinner.start();

            let folders = await scanNodeModules({ path: scanPath });
            spinner.succeed(`Found ${folders.length} node_modules folders`);

            if (ageFilter) {
                const days = parseDuration(ageFilter);
                folders = filterByAge(folders, days);
                logger.info(`After age filter: ${folders.length} folders`);
            }

            if (folders.length === 0) {
                logger.info('No matching folders found.');
                continue;
            }

            const totals = calculateTotals(folders);
            console.log();
            console.log(`📊 Found ${chalk.cyan(folders.length)} folders, total ${chalk.yellow(formatBytes(totals.totalSize))}`);

            if (await promptViewList()) {
                console.log();
                console.log(createFoldersTable(folders.slice(0, 20)));
            }

            if (action === 'clean') {
                const selectedFolders = await promptSelectFolders(folders);
                if (selectedFolders.length > 0) {
                    const selectedTotals = calculateTotals(selectedFolders);
                    if (await promptDelete(selectedFolders.length, selectedTotals.totalSize)) {
                        await performClean(selectedFolders, { backup: true });
                    }
                }
            }
        }

        if (action === 'deep-clean') {
            const scanPath = await promptPath(process.cwd());

            const spinner = createSpinner(`🔍 Scanning ${scanPath}...`);
            spinner.start();

            const folders = await scanNodeModules({ path: scanPath });
            spinner.succeed(`Found ${folders.length} node_modules folders`);

            if (folders.length === 0) {
                logger.info('No node_modules folders found.');
                continue;
            }

            if (await promptConfirm('🧼 Perform deep clean on all folders?')) {
                await performDeepClean(folders, { verbose: true });
            }
        }

        if (action === 'report') {
            const scanPath = await promptPath(process.cwd());
            await reportAction({ path: scanPath, detailed: true });
        }

        console.log();
    }
}

/**
 * Perform cleanup operation
 */
async function performClean(
    folders: NodeModulesInfo[],
    options: Record<string, unknown>
): Promise<void> {
    const bar = createProgressBar(folders.length, '🧹 Cleaning');

    const result = await cleanNodeModules(
        folders,
        {
            fast: options.fast as boolean,
            parallel: options.parallel as number,
            backup: options.backup as boolean,
        },
        (current, _total, path) => {
            updateProgress(bar, current, path.split('/').pop() || '');
        }
    );

    stopProgress(bar);

    console.log();
    logger.success(`Deleted ${result.deletedCount} folders`);
    logger.success(`Freed ${formatBytes(result.freedBytes)}`);

    if (result.backupPath) {
        logger.info(`Backup saved to: ${result.backupPath}`);
    }

    if (result.errors.length > 0) {
        logger.warn(`${result.errors.length} errors occurred:`);
        result.errors.forEach(e => logger.error(`  ${e.path}: ${e.message}`));
    }
}

/**
 * Perform deep clean operation
 */
async function performDeepClean(
    folders: NodeModulesInfo[],
    options: Record<string, unknown>
): Promise<void> {
    const bar = createProgressBar(folders.length, '🧼 Deep Cleaning');
    let totalFreed = 0;
    let totalFiles = 0;

    for (let i = 0; i < folders.length; i++) {
        const folder = folders[i];
        updateProgress(bar, i + 1, folder.projectPath.split('/').pop() || '');

        const result = await deepClean(folder.path, {
            dryRun: options.dryRun as boolean,
            verbose: options.verbose as boolean,
        });

        totalFreed += result.freedBytes;
        totalFiles += result.deletedFileCount;
    }

    stopProgress(bar);

    console.log();
    logger.success(`Processed ${folders.length} folders`);
    logger.success(`Removed ${totalFiles} files`);
    logger.success(`Freed ${formatBytes(totalFreed)}`);
}

/**
 * Report action handler
 */
async function reportAction(options: Record<string, unknown>): Promise<void> {
    const scanPath = (options.path as string) || process.cwd();

    const spinner = createSpinner(`🔍 Scanning ${scanPath}...`);
    spinner.start();

    const folders = await scanNodeModules({ path: scanPath });
    spinner.succeed(`Found ${folders.length} node_modules folders`);

    if (folders.length === 0) {
        logger.info('No node_modules folders found.');
        return;
    }

    const totals = calculateTotals(folders);

    // Calculate breakdown
    const recent = folders.filter(f => f.ageDays < 30);
    const medium = folders.filter(f => f.ageDays >= 30 && f.ageDays < 90);
    const old = folders.filter(f => f.ageDays >= 90);

    if (options.json) {
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            ...totals,
            breakdown: {
                recent: { count: recent.length, size: recent.reduce((s, f) => s + f.size, 0) },
                medium: { count: medium.length, size: medium.reduce((s, f) => s + f.size, 0) },
                old: { count: old.length, size: old.reduce((s, f) => s + f.size, 0) },
            },
            topBySize: folders.slice(0, 10),
            topByAge: [...folders].sort((a, b) => b.ageDays - a.ageDays).slice(0, 10),
        }, null, 2));
        return;
    }

    console.log();
    logger.title('📊 Node Modules Report');
    console.log();

    // Summary
    console.log(createSummaryTable(totals));
    console.log();

    // Breakdown by age
    console.log(chalk.bold('📅 Breakdown by Age:'));
    console.log(createBreakdownTable({
        recent: { count: recent.length, size: recent.reduce((s, f) => s + f.size, 0) },
        medium: { count: medium.length, size: medium.reduce((s, f) => s + f.size, 0) },
        old: { count: old.length, size: old.reduce((s, f) => s + f.size, 0) },
    }));
    console.log();

    // Top 10 by size
    if (options.detailed) {
        console.log(chalk.bold('📦 Top 10 Largest:'));
        console.log(createFoldersTable(folders.slice(0, 10)));
        console.log();

        // Top 10 oldest
        console.log(chalk.bold('🕰️  Top 10 Oldest:'));
        const oldestFolders = [...folders].sort((a, b) => b.ageDays - a.ageDays).slice(0, 10);
        console.log(createFoldersTable(oldestFolders));
    }

    // Recommendations
    console.log();
    logger.title('💡 Recommendations');

    if (old.length > 0) {
        const oldSize = old.reduce((s, f) => s + f.size, 0);
        console.log(chalk.yellow(`  → Run ${chalk.cyan('node-janitor --older-than 90d')} to free ${formatBytes(oldSize)}`));
    }

    if (totals.totalSize > 1024 * 1024 * 1024) { // > 1GB
        console.log(chalk.yellow(`  → Run ${chalk.cyan('node-janitor --deep-clean')} to save ~40% more space`));
    }
}
