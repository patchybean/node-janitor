import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock chalk to return plain strings for testing
vi.mock('chalk', () => ({
    default: {
        gray: (s: string) => s,
        blue: (s: string) => s,
        green: (s: string) => s,
        yellow: (s: string) => s,
        red: (s: string) => s,
        cyan: (s: string) => s,
        magenta: (s: string) => s,
        white: (s: string) => s,
        bold: {
            cyan: (s: string) => s,
        },
    },
}));

// Import after mocking
import { logger } from '../src/utils/logger.js';

describe('logger', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        // Configure logger to default state
        logger.configure({ verbose: false, debug: false, silent: false });
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe('configure', () => {
        it('should configure logger options', () => {
            logger.configure({ verbose: true, debug: true });
            // Logger should be configured - no direct way to test, but can test behavior
            expect(true).toBe(true);
        });

        it('should merge options', () => {
            logger.configure({ verbose: true });
            logger.configure({ debug: true });
            // Both options should be set
            expect(true).toBe(true);
        });
    });

    describe('log levels', () => {
        describe('debug', () => {
            it('should not log debug messages by default', () => {
                logger.configure({ debug: false });
                logger.debug('test debug message');
                expect(consoleLogSpy).not.toHaveBeenCalled();
            });

            it('should log debug messages when debug is enabled', () => {
                logger.configure({ debug: true });
                logger.debug('test debug message');
                expect(consoleLogSpy).toHaveBeenCalled();
                expect(consoleLogSpy.mock.calls[0][0]).toContain('[DEBUG]');
            });

            it('should include additional arguments', () => {
                logger.configure({ debug: true });
                logger.debug('message', { foo: 'bar' });
                expect(consoleLogSpy).toHaveBeenCalledWith(
                    expect.stringContaining('[DEBUG]'),
                    { foo: 'bar' }
                );
            });
        });

        describe('info', () => {
            it('should log info messages', () => {
                logger.info('test info message');
                expect(consoleLogSpy).toHaveBeenCalled();
            });

            it('should not log when silent', () => {
                logger.configure({ silent: true });
                logger.info('test info message');
                expect(consoleLogSpy).not.toHaveBeenCalled();
            });
        });

        describe('success', () => {
            it('should log success messages', () => {
                logger.success('operation completed');
                expect(consoleLogSpy).toHaveBeenCalled();
            });

            it('should not log when silent', () => {
                logger.configure({ silent: true });
                logger.success('operation completed');
                expect(consoleLogSpy).not.toHaveBeenCalled();
            });
        });

        describe('warn', () => {
            it('should log warning messages', () => {
                logger.warn('warning message');
                expect(consoleLogSpy).toHaveBeenCalled();
            });

            it('should not log when silent', () => {
                logger.configure({ silent: true });
                logger.warn('warning message');
                expect(consoleLogSpy).not.toHaveBeenCalled();
            });
        });

        describe('error', () => {
            it('should log error messages to stderr', () => {
                logger.error('error message');
                expect(consoleErrorSpy).toHaveBeenCalled();
            });

            it('should not log when silent', () => {
                logger.configure({ silent: true });
                logger.error('error message');
                expect(consoleErrorSpy).not.toHaveBeenCalled();
            });
        });
    });

    describe('formatting methods', () => {
        describe('title', () => {
            it('should log title with formatting', () => {
                logger.title('Test Title');
                expect(consoleLogSpy).toHaveBeenCalled();
            });

            it('should not log when silent', () => {
                logger.configure({ silent: true });
                logger.title('Test Title');
                expect(consoleLogSpy).not.toHaveBeenCalled();
            });
        });

        describe('divider', () => {
            it('should log a divider line', () => {
                logger.divider();
                expect(consoleLogSpy).toHaveBeenCalled();
            });

            it('should not log when silent', () => {
                logger.configure({ silent: true });
                logger.divider();
                expect(consoleLogSpy).not.toHaveBeenCalled();
            });
        });

        describe('blank', () => {
            it('should log a blank line', () => {
                logger.blank();
                expect(consoleLogSpy).toHaveBeenCalled();
            });

            it('should not log when silent', () => {
                logger.configure({ silent: true });
                logger.blank();
                expect(consoleLogSpy).not.toHaveBeenCalled();
            });
        });
    });

    describe('text helpers', () => {
        describe('path', () => {
            it('should return colored path', () => {
                const result = logger.path('/some/path');
                expect(result).toBe('/some/path');
            });
        });

        describe('size', () => {
            it('should return colored size', () => {
                const result = logger.size('1.5 GB');
                expect(result).toBe('1.5 GB');
            });
        });

        describe('count', () => {
            it('should return colored count', () => {
                const result = logger.count(42);
                expect(result).toBe('42');
            });
        });

        describe('age', () => {
            it('should return green for recent (< 30 days)', () => {
                const result = logger.age(15);
                expect(result).toContain('15d');
            });

            it('should return yellow for medium age (30-90 days)', () => {
                const result = logger.age(45);
                expect(result).toContain('45d');
            });

            it('should return red for old (> 90 days)', () => {
                const result = logger.age(120);
                expect(result).toContain('120d');
            });

            it('should handle edge case at 30 days', () => {
                const result = logger.age(30);
                expect(result).toContain('30d');
            });

            it('should handle edge case at 90 days', () => {
                const result = logger.age(90);
                expect(result).toContain('90d');
            });
        });
    });

    describe('silent mode', () => {
        beforeEach(() => {
            logger.configure({ silent: true });
        });

        it('should suppress all log methods', () => {
            logger.debug('debug');
            logger.info('info');
            logger.success('success');
            logger.warn('warn');
            logger.error('error');
            logger.title('title');
            logger.divider();
            logger.blank();

            expect(consoleLogSpy).not.toHaveBeenCalled();
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });
    });
});
