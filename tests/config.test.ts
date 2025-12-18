import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { loadConfig, getDefaultConfig, mergeOptions } from '../src/core/config.js';

describe('config', () => {
    let testDir: string;

    beforeEach(async () => {
        testDir = path.join(os.tmpdir(), `node-janitor-config-test-${Date.now()}`);
        await fs.ensureDir(testDir);
        process.chdir(testDir);
    });

    afterEach(async () => {
        process.chdir(os.tmpdir());
        await fs.remove(testDir);
    });

    describe('getDefaultConfig', () => {
        it('should return default config values', () => {
            const config = getDefaultConfig();

            expect(config.exclude).toEqual([]);
            expect(config.excludePattern).toEqual([]);
            expect(config.defaultOlderThan).toBeUndefined();
            expect(config.defaultPath).toBeUndefined();
            expect(config.defaultDepth).toBeUndefined();
            expect(config.lang).toBe('en');
        });
    });

    describe('loadConfig', () => {
        it('should return default config when no config file exists', async () => {
            const config = await loadConfig();

            expect(config).toEqual(getDefaultConfig());
        });

        it('should load config from .janitorrc file', async () => {
            const configContent = {
                exclude: ['important-project'],
                defaultOlderThan: '30d',
                lang: 'vi',
            };
            await fs.writeJson(path.join(testDir, '.janitorrc'), configContent);

            const config = await loadConfig();

            expect(config.exclude).toEqual(['important-project']);
            expect(config.defaultOlderThan).toBe('30d');
            expect(config.lang).toBe('vi');
        });

        it('should load config from .janitorrc.json file', async () => {
            const configContent = {
                defaultDepth: 5,
                defaultPath: '/projects',
            };
            await fs.writeJson(path.join(testDir, '.janitorrc.json'), configContent);

            const config = await loadConfig();

            expect(config.defaultDepth).toBe(5);
            expect(config.defaultPath).toBe('/projects');
        });

        it('should load config from specified path', async () => {
            const customConfigPath = path.join(testDir, 'custom-config.json');
            await fs.writeJson(customConfigPath, { lang: 'zh' });

            const config = await loadConfig(customConfigPath);

            expect(config.lang).toBe('zh');
        });

        it('should validate and normalize invalid config', async () => {
            // Write invalid config
            await fs.writeJson(path.join(testDir, '.janitorrc'), {
                exclude: 'not-an-array', // Should be array
                defaultDepth: 'not-a-number', // Should be number
            });

            const config = await loadConfig();

            expect(config.exclude).toEqual([]); // Falls back to default
            expect(config.defaultDepth).toBeUndefined(); // Falls back to default
        });
    });

    describe('mergeOptions', () => {
        it('should prefer CLI options over config', () => {
            const cliOptions = { path: '/cli-path', depth: 3 };
            const config = getDefaultConfig();
            config.defaultPath = '/config-path';
            config.defaultDepth = 5;

            const merged = mergeOptions(cliOptions, config);

            expect(merged.path).toBe('/cli-path');
            expect(merged.depth).toBe(3);
        });

        it('should use config defaults when CLI options are not provided', () => {
            const cliOptions = {};
            const config = getDefaultConfig();
            config.defaultPath = '/config-path';
            config.defaultDepth = 5;
            config.defaultOlderThan = '60d';

            const merged = mergeOptions(cliOptions, config);

            expect(merged.path).toBe('/config-path');
            expect(merged.depth).toBe(5);
            expect(merged.olderThan).toBe('60d');
        });

        it('should merge exclude patterns from CLI and config', () => {
            const cliOptions = { exclude: 'cli-pattern' };
            const config = getDefaultConfig();
            config.exclude = ['config-pattern1', 'config-pattern2'];

            const merged = mergeOptions(cliOptions, config);

            // Should contain both CLI and config patterns
            expect(merged.exclude).toContain('cli-pattern');
            expect(merged.exclude).toContain('config-pattern1');
        });

        it('should set language from config', () => {
            const cliOptions = {};
            const config = getDefaultConfig();
            config.lang = 'ja';

            const merged = mergeOptions(cliOptions, config);

            expect(merged.lang).toBe('ja');
        });
    });
});
