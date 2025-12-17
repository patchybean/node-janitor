import Table from 'cli-table3';
import chalk from 'chalk';
import type { NodeModulesInfo } from '../types/index.js';
import { formatBytes } from '../utils/formatter.js';

/**
 * Create a table showing node_modules folders
 */
export function createFoldersTable(folders: NodeModulesInfo[]): string {
    const table = new Table({
        head: [
            chalk.cyan('#'),
            chalk.cyan('Path'),
            chalk.cyan('Size'),
            chalk.cyan('Age'),
            chalk.cyan('Packages'),
            chalk.cyan('Lock'),
        ],
        style: {
            head: [],
            border: ['gray'],
        },
        colWidths: [5, 50, 12, 15, 10, 8],
        wordWrap: true,
    });

    folders.forEach((folder, index) => {
        const ageColor = getAgeColor(folder.ageDays);
        const lockType = folder.hasPackageLock ? 'npm' :
            folder.hasYarnLock ? 'yarn' :
                folder.hasPnpmLock ? 'pnpm' : '-';

        table.push([
            chalk.gray((index + 1).toString()),
            chalk.white(shortenPath(folder.projectPath)),
            chalk.yellow(formatBytes(folder.size)),
            ageColor(`${folder.ageDays}d`),
            chalk.magenta(folder.packageCount.toString()),
            chalk.gray(lockType),
        ]);
    });

    return table.toString();
}

/**
 * Create a summary table
 */
export function createSummaryTable(data: {
    totalFolders: number;
    totalSize: number;
    oldestAge: number;
    newestAge: number;
}): string {
    const table = new Table({
        style: {
            head: [],
            border: ['gray'],
        },
    });

    table.push(
        [chalk.cyan('Total Folders'), chalk.white(data.totalFolders.toString())],
        [chalk.cyan('Total Size'), chalk.yellow(formatBytes(data.totalSize))],
        [chalk.cyan('Oldest'), chalk.red(`${data.oldestAge} days`)],
        [chalk.cyan('Newest'), chalk.green(`${data.newestAge} days`)],
    );

    return table.toString();
}

/**
 * Create a report breakdown table
 */
export function createBreakdownTable(data: {
    recent: { count: number; size: number };
    medium: { count: number; size: number };
    old: { count: number; size: number };
}): string {
    const table = new Table({
        head: [
            chalk.cyan('Age Range'),
            chalk.cyan('Count'),
            chalk.cyan('Size'),
            chalk.cyan('% of Total'),
        ],
        style: {
            head: [],
            border: ['gray'],
        },
    });

    const total = data.recent.size + data.medium.size + data.old.size;

    table.push(
        [
            chalk.green('0-30 days'),
            data.recent.count.toString(),
            formatBytes(data.recent.size),
            `${((data.recent.size / total) * 100).toFixed(1)}%`,
        ],
        [
            chalk.yellow('30-90 days'),
            data.medium.count.toString(),
            formatBytes(data.medium.size),
            `${((data.medium.size / total) * 100).toFixed(1)}%`,
        ],
        [
            chalk.red('90+ days'),
            data.old.count.toString(),
            formatBytes(data.old.size),
            `${((data.old.size / total) * 100).toFixed(1)}%`,
        ],
    );

    return table.toString();
}

/**
 * Get color based on age
 */
function getAgeColor(days: number): (text: string) => string {
    if (days < 30) return chalk.green;
    if (days < 90) return chalk.yellow;
    return chalk.red;
}

/**
 * Shorten path for display
 */
function shortenPath(p: string, maxLength = 45): string {
    if (p.length <= maxLength) return p;

    const home = process.env.HOME || process.env.USERPROFILE || '';
    let shortened = p.replace(home, '~');

    if (shortened.length <= maxLength) return shortened;

    // Truncate from the middle
    const half = Math.floor((maxLength - 3) / 2);
    return shortened.slice(0, half) + '...' + shortened.slice(-half);
}

export default {
    createFoldersTable,
    createSummaryTable,
    createBreakdownTable,
};
