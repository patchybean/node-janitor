import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ora
vi.mock('ora', () => {
    const mockSpinner = {
        start: vi.fn().mockReturnThis(),
        stop: vi.fn().mockReturnThis(),
        succeed: vi.fn().mockReturnThis(),
        fail: vi.fn().mockReturnThis(),
        text: '',
    };
    return {
        default: vi.fn().mockReturnValue(mockSpinner),
    };
});

// Mock chalk
vi.mock('chalk', () => ({
    default: {
        green: (s: string) => s,
        red: (s: string) => s,
    },
}));

import ora from 'ora';
import { createSpinner, withSpinner } from '../src/ui/spinner.js';

describe('spinner UI', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createSpinner', () => {
        it('should create a spinner with text', () => {
            const spinner = createSpinner('Loading...');

            expect(ora).toHaveBeenCalledWith({
                text: 'Loading...',
                spinner: 'dots',
                color: 'cyan',
            });
            expect(spinner).toBeDefined();
        });

        it('should create spinner with different text', () => {
            createSpinner('Processing files');

            expect(ora).toHaveBeenCalledWith({
                text: 'Processing files',
                spinner: 'dots',
                color: 'cyan',
            });
        });
    });

    describe('withSpinner', () => {
        it('should run async operation with spinner', async () => {
            const mockOperation = vi.fn().mockResolvedValue('result');

            const result = await withSpinner('Loading', mockOperation);

            expect(result).toBe('result');
            expect(mockOperation).toHaveBeenCalled();
        });

        it('should call succeed on successful operation', async () => {
            const mockOperation = vi.fn().mockResolvedValue('success');

            await withSpinner('Loading', mockOperation, 'Completed!');

            const spinner = (ora as unknown as ReturnType<typeof vi.fn>).mock.results[0].value;
            expect(spinner.start).toHaveBeenCalled();
            expect(spinner.succeed).toHaveBeenCalled();
        });

        it('should call fail on failed operation', async () => {
            const mockOperation = vi.fn().mockRejectedValue(new Error('Failed'));

            await expect(withSpinner('Loading', mockOperation, 'Done', 'Error!'))
                .rejects.toThrow('Failed');

            const spinner = (ora as unknown as ReturnType<typeof vi.fn>).mock.results[0].value;
            expect(spinner.start).toHaveBeenCalled();
            expect(spinner.fail).toHaveBeenCalled();
        });

        it('should use custom success text', async () => {
            const mockOperation = vi.fn().mockResolvedValue('result');

            await withSpinner('Loading', mockOperation, 'Custom success!');

            const spinner = (ora as unknown as ReturnType<typeof vi.fn>).mock.results[0].value;
            expect(spinner.succeed).toHaveBeenCalledWith('Custom success!');
        });

        it('should use custom fail text', async () => {
            const mockOperation = vi.fn().mockRejectedValue(new Error('oops'));

            await expect(withSpinner('Loading', mockOperation, undefined, 'Custom fail!'))
                .rejects.toThrow();

            const spinner = (ora as unknown as ReturnType<typeof vi.fn>).mock.results[0].value;
            expect(spinner.fail).toHaveBeenCalledWith('Custom fail!');
        });

        it('should use default texts when not provided', async () => {
            const mockOperation = vi.fn().mockResolvedValue('result');

            await withSpinner('Loading', mockOperation);

            const spinner = (ora as unknown as ReturnType<typeof vi.fn>).mock.results[0].value;
            expect(spinner.succeed).toHaveBeenCalledWith('Done');
        });

        it('should re-throw errors after failing', async () => {
            const error = new Error('Test error');
            const mockOperation = vi.fn().mockRejectedValue(error);

            await expect(withSpinner('Loading', mockOperation))
                .rejects.toThrow('Test error');
        });

        it('should return the correct type', async () => {
            const mockOperation = vi.fn().mockResolvedValue({ data: 'test' });

            const result = await withSpinner('Loading', mockOperation);

            expect(result).toEqual({ data: 'test' });
        });
    });
});
