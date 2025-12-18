import { cosmiconfig } from 'cosmiconfig';
import type { Config } from '../types/index.js';
import logger from '../utils/logger.js';

const MODULE_NAME = 'janitor';

/**
 * Load configuration from .janitorrc, .janitorrc.json, .janitorrc.yaml,
 * janitor.config.js, or package.json "janitor" key
 */
export async function loadConfig(configPath?: string): Promise<Config> {
    const explorer = cosmiconfig(MODULE_NAME, {
        searchPlaces: [
            'package.json',
            `.${MODULE_NAME}rc`,
            `.${MODULE_NAME}rc.json`,
            `.${MODULE_NAME}rc.yaml`,
            `.${MODULE_NAME}rc.yml`,
            `.${MODULE_NAME}rc.js`,
            `.${MODULE_NAME}rc.cjs`,
            `${MODULE_NAME}.config.js`,
            `${MODULE_NAME}.config.cjs`,
        ],
    });

    try {
        let result;
        if (configPath) {
            result = await explorer.load(configPath);
        } else {
            result = await explorer.search();
        }

        if (result && result.config) {
            logger.debug(`Loaded config from: ${result.filepath}`);
            return validateConfig(result.config);
        }
    } catch (error) {
        logger.debug(`Config load error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return getDefaultConfig();
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): Config {
    return {
        exclude: [],
        excludePattern: [],
        defaultOlderThan: undefined,
        defaultPath: undefined,
        defaultDepth: undefined,
        lang: 'en',
    };
}

/**
 * Validate and normalize config
 */
function validateConfig(config: unknown): Config {
    const defaultConfig = getDefaultConfig();

    if (typeof config !== 'object' || config === null) {
        return defaultConfig;
    }

    const cfg = config as Record<string, unknown>;

    return {
        exclude: Array.isArray(cfg.exclude) ? cfg.exclude.filter(s => typeof s === 'string') : defaultConfig.exclude,
        excludePattern: Array.isArray(cfg.excludePattern) ? cfg.excludePattern.filter(s => typeof s === 'string') : defaultConfig.excludePattern,
        defaultOlderThan: typeof cfg.defaultOlderThan === 'string' ? cfg.defaultOlderThan : defaultConfig.defaultOlderThan,
        defaultPath: typeof cfg.defaultPath === 'string' ? cfg.defaultPath : defaultConfig.defaultPath,
        defaultDepth: typeof cfg.defaultDepth === 'number' ? cfg.defaultDepth : defaultConfig.defaultDepth,
        lang: typeof cfg.lang === 'string' ? cfg.lang : defaultConfig.lang,
    };
}

/**
 * Merge CLI options with config file options (CLI takes precedence)
 */
export function mergeOptions(
    cliOptions: Record<string, unknown>,
    config: Config
): Record<string, unknown> {
    const merged = { ...cliOptions };

    // Apply config defaults only if CLI option is not provided
    if (!merged.path && config.defaultPath) {
        merged.path = config.defaultPath;
    }
    if (!merged.depth && config.defaultDepth) {
        merged.depth = config.defaultDepth;
    }
    if (!merged.olderThan && config.defaultOlderThan) {
        merged.olderThan = config.defaultOlderThan;
    }
    if (!merged.lang && config.lang) {
        merged.lang = config.lang;
    }

    // Merge exclude patterns
    if (config.exclude && config.exclude.length > 0) {
        const cliExclude = (merged.exclude as string) || '';
        const cliPatterns = cliExclude ? cliExclude.split(',').map(s => s.trim()) : [];
        const allPatterns = [...new Set([...cliPatterns, ...config.exclude])];
        merged.exclude = allPatterns.join(',');
    }

    return merged;
}

export default {
    loadConfig,
    getDefaultConfig,
    mergeOptions,
};
