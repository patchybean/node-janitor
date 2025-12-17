import cliProgress from 'cli-progress';
import chalk from 'chalk';

/**
 * Create a progress bar for scanning/deleting operations
 */
export function createProgressBar(total: number, label = 'Progress'): cliProgress.SingleBar {
    const bar = new cliProgress.SingleBar({
        format: `${chalk.cyan(label)} |${chalk.cyan('{bar}')}| {percentage}% | {value}/{total} | {status}`,
        barCompleteChar: '█',
        barIncompleteChar: '░',
        hideCursor: true,
    });

    bar.start(total, 0, { status: 'Starting...' });
    return bar;
}

/**
 * Update progress bar with status
 */
export function updateProgress(
    bar: cliProgress.SingleBar,
    value: number,
    status: string
): void {
    bar.update(value, { status });
}

/**
 * Stop and clean up progress bar
 */
export function stopProgress(bar: cliProgress.SingleBar): void {
    bar.stop();
}

export default { createProgressBar, updateProgress, stopProgress };
