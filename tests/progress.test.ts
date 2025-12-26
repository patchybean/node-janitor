import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock cli-progress
vi.mock('cli-progress', () => {
    const mockBar = {
        start: vi.fn(),
        update: vi.fn(),
        stop: vi.fn(),
    };
    return {
        default: {
            SingleBar: vi.fn().mockImplementation(() => mockBar),
        },
    };
});

// Mock chalk
vi.mock('chalk', () => ({
    default: {
        cyan: (s: string) => s,
    },
}));

import cliProgress from 'cli-progress';
import { createProgressBar, updateProgress, stopProgress } from '../src/ui/progress.js';

describe('progress UI', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createProgressBar', () => {
        it('should create a progress bar with total and default label', () => {
            const bar = createProgressBar(100);

            expect(cliProgress.SingleBar).toHaveBeenCalled();
            expect(bar.start).toHaveBeenCalledWith(100, 0, { status: 'Starting...' });
        });

        it('should create a progress bar with custom label', () => {
            const bar = createProgressBar(50, 'Scanning');

            expect(cliProgress.SingleBar).toHaveBeenCalled();
            expect(bar.start).toHaveBeenCalledWith(50, 0, { status: 'Starting...' });
        });

        it('should return the progress bar instance', () => {
            const bar = createProgressBar(100);

            expect(bar).toBeDefined();
            expect(bar.start).toBeDefined();
            expect(bar.update).toBeDefined();
            expect(bar.stop).toBeDefined();
        });
    });

    describe('updateProgress', () => {
        it('should update progress bar value and status', () => {
            const bar = createProgressBar(100);

            updateProgress(bar, 25, 'Processing...');

            expect(bar.update).toHaveBeenCalledWith(25, { status: 'Processing...' });
        });

        it('should handle different progress values', () => {
            const bar = createProgressBar(100);

            updateProgress(bar, 0, 'Starting');
            expect(bar.update).toHaveBeenCalledWith(0, { status: 'Starting' });

            updateProgress(bar, 50, 'Halfway');
            expect(bar.update).toHaveBeenCalledWith(50, { status: 'Halfway' });

            updateProgress(bar, 100, 'Complete');
            expect(bar.update).toHaveBeenCalledWith(100, { status: 'Complete' });
        });
    });

    describe('stopProgress', () => {
        it('should stop the progress bar', () => {
            const bar = createProgressBar(100);

            stopProgress(bar);

            expect(bar.stop).toHaveBeenCalled();
        });
    });
});
