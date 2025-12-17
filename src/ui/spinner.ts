import ora, { Ora } from 'ora';
import chalk from 'chalk';

/**
 * Create a spinner with consistent styling
 */
export function createSpinner(text: string): Ora {
    return ora({
        text,
        spinner: 'dots',
        color: 'cyan',
    });
}

/**
 * Run async operation with spinner
 */
export async function withSpinner<T>(
    text: string,
    operation: () => Promise<T>,
    successText?: string,
    failText?: string
): Promise<T> {
    const spinner = createSpinner(text);
    spinner.start();

    try {
        const result = await operation();
        spinner.succeed(successText || chalk.green('Done'));
        return result;
    } catch (error) {
        spinner.fail(failText || chalk.red('Failed'));
        throw error;
    }
}

export default { createSpinner, withSpinner };
