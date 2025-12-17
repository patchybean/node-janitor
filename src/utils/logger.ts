import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

interface LoggerOptions {
    verbose?: boolean;
    debug?: boolean;
    silent?: boolean;
}

class Logger {
    private options: LoggerOptions = {};

    configure(options: LoggerOptions): void {
        this.options = { ...this.options, ...options };
    }

    private shouldLog(level: LogLevel): boolean {
        if (this.options.silent) return false;
        if (level === 'debug' && !this.options.debug) return false;
        return true;
    }

    debug(message: string, ...args: unknown[]): void {
        if (!this.shouldLog('debug')) return;
        console.log(chalk.gray(`[DEBUG] ${message}`), ...args);
    }

    info(message: string, ...args: unknown[]): void {
        if (!this.shouldLog('info')) return;
        console.log(chalk.blue('ℹ'), message, ...args);
    }

    success(message: string, ...args: unknown[]): void {
        if (!this.shouldLog('success')) return;
        console.log(chalk.green('✅'), message, ...args);
    }

    warn(message: string, ...args: unknown[]): void {
        if (!this.shouldLog('warn')) return;
        console.log(chalk.yellow('⚠️'), message, ...args);
    }

    error(message: string, ...args: unknown[]): void {
        if (!this.shouldLog('error')) return;
        console.error(chalk.red('❌'), message, ...args);
    }

    // Special formatting methods
    title(message: string): void {
        if (this.options.silent) return;
        console.log();
        console.log(chalk.bold.cyan(`🧹 ${message}`));
        console.log(chalk.gray('─'.repeat(50)));
    }

    divider(): void {
        if (this.options.silent) return;
        console.log(chalk.gray('─'.repeat(50)));
    }

    blank(): void {
        if (this.options.silent) return;
        console.log();
    }

    // Colored text helpers
    path(p: string): string {
        return chalk.cyan(p);
    }

    size(s: string): string {
        return chalk.yellow(s);
    }

    count(n: number): string {
        return chalk.magenta(n.toString());
    }

    age(days: number): string {
        if (days < 30) return chalk.green(`${days}d`);
        if (days < 90) return chalk.yellow(`${days}d`);
        return chalk.red(`${days}d`);
    }
}

export const logger = new Logger();
export default logger;
