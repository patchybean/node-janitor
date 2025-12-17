import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';

dayjs.extend(relativeTime);

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Parse size string to bytes (e.g., "500MB" -> 524288000)
 */
export function parseSize(sizeStr: string): number {
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)?$/i);
    if (!match) {
        throw new Error(`Invalid size format: ${sizeStr}`);
    }

    const value = parseFloat(match[1]);
    const unit = (match[2] || 'B').toUpperCase();

    const multipliers: Record<string, number> = {
        'B': 1,
        'KB': 1024,
        'MB': 1024 ** 2,
        'GB': 1024 ** 3,
        'TB': 1024 ** 4,
    };

    return Math.floor(value * multipliers[unit]);
}

/**
 * Parse duration string to days (e.g., "30d" -> 30, "3m" -> 90, "1y" -> 365)
 */
export function parseDuration(durationStr: string): number {
    const match = durationStr.match(/^(\d+)(d|w|m|y)$/i);
    if (!match) {
        throw new Error(`Invalid duration format: ${durationStr}. Use format like 30d, 4w, 3m, 1y`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    const multipliers: Record<string, number> = {
        'd': 1,
        'w': 7,
        'm': 30,
        'y': 365,
    };

    return value * multipliers[unit];
}

/**
 * Parse duration range (e.g., "30d-90d" -> { min: 30, max: 90 })
 */
export function parseDurationRange(rangeStr: string): { min: number; max: number } {
    const parts = rangeStr.split('-');
    if (parts.length !== 2) {
        throw new Error(`Invalid range format: ${rangeStr}. Use format like 30d-90d`);
    }

    return {
        min: parseDuration(parts[0]),
        max: parseDuration(parts[1]),
    };
}

/**
 * Format date relative to now
 */
export function formatRelativeTime(date: Date): string {
    return dayjs(date).fromNow();
}

/**
 * Format date as string
 */
export function formatDate(date: Date): string {
    return dayjs(date).format('YYYY-MM-DD HH:mm');
}

/**
 * Get age in days from a date
 */
export function getAgeDays(date: Date): number {
    const now = dayjs();
    const target = dayjs(date);
    return now.diff(target, 'day');
}

/**
 * Format duration in human readable format
 */
export function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
    return num.toLocaleString();
}
