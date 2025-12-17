import { describe, it, expect } from 'vitest';
import {
    formatBytes,
    parseSize,
    parseDuration,
    parseDurationRange,
    getAgeDays,
    formatNumber,
    formatDuration,
} from '../src/utils/formatter.js';

describe('formatBytes', () => {
    it('should format 0 bytes', () => {
        expect(formatBytes(0)).toBe('0 B');
    });

    it('should format bytes', () => {
        expect(formatBytes(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
        expect(formatBytes(1024)).toBe('1 KB');
        expect(formatBytes(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
        expect(formatBytes(1048576)).toBe('1 MB');
        expect(formatBytes(1572864)).toBe('1.5 MB');
    });

    it('should format gigabytes', () => {
        expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('should format terabytes', () => {
        expect(formatBytes(1099511627776)).toBe('1 TB');
    });
});

describe('parseSize', () => {
    it('should parse bytes', () => {
        expect(parseSize('100B')).toBe(100);
        expect(parseSize('100')).toBe(100);
    });

    it('should parse kilobytes', () => {
        expect(parseSize('1KB')).toBe(1024);
        expect(parseSize('1.5KB')).toBe(1536);
    });

    it('should parse megabytes', () => {
        expect(parseSize('1MB')).toBe(1048576);
        expect(parseSize('500MB')).toBe(524288000);
    });

    it('should parse gigabytes', () => {
        expect(parseSize('1GB')).toBe(1073741824);
    });

    it('should throw on invalid format', () => {
        expect(() => parseSize('invalid')).toThrow('Invalid size format');
    });
});

describe('parseDuration', () => {
    it('should parse days', () => {
        expect(parseDuration('30d')).toBe(30);
        expect(parseDuration('7d')).toBe(7);
    });

    it('should parse weeks', () => {
        expect(parseDuration('1w')).toBe(7);
        expect(parseDuration('4w')).toBe(28);
    });

    it('should parse months', () => {
        expect(parseDuration('1m')).toBe(30);
        expect(parseDuration('3m')).toBe(90);
    });

    it('should parse years', () => {
        expect(parseDuration('1y')).toBe(365);
        expect(parseDuration('2y')).toBe(730);
    });

    it('should throw on invalid format', () => {
        expect(() => parseDuration('invalid')).toThrow('Invalid duration format');
        expect(() => parseDuration('30')).toThrow('Invalid duration format');
    });
});

describe('parseDurationRange', () => {
    it('should parse valid range', () => {
        const result = parseDurationRange('30d-90d');
        expect(result.min).toBe(30);
        expect(result.max).toBe(90);
    });

    it('should parse mixed units', () => {
        const result = parseDurationRange('1m-1y');
        expect(result.min).toBe(30);
        expect(result.max).toBe(365);
    });

    it('should throw on invalid format', () => {
        expect(() => parseDurationRange('30d')).toThrow('Invalid range format');
        expect(() => parseDurationRange('30d-90d-120d')).toThrow('Invalid range format');
    });
});

describe('getAgeDays', () => {
    it('should return 0 for today', () => {
        const today = new Date();
        expect(getAgeDays(today)).toBe(0);
    });

    it('should return correct days for past dates', () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        expect(getAgeDays(thirtyDaysAgo)).toBe(30);
    });
});

describe('formatNumber', () => {
    it('should format small numbers', () => {
        expect(formatNumber(123)).toBe('123');
    });

    it('should format large numbers with commas', () => {
        expect(formatNumber(1234567)).toMatch(/1[,.]?234[,.]?567/);
    });
});

describe('formatDuration', () => {
    it('should format milliseconds', () => {
        expect(formatDuration(500)).toBe('500ms');
    });

    it('should format seconds', () => {
        expect(formatDuration(1500)).toBe('1.5s');
        expect(formatDuration(30000)).toBe('30.0s');
    });

    it('should format minutes', () => {
        expect(formatDuration(90000)).toBe('1.5m');
    });

    it('should format hours', () => {
        expect(formatDuration(7200000)).toBe('2.0h');
    });
});
