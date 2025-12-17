/**
 * Type definitions for node-janitor
 */

export interface NodeModulesInfo {
    /** Full path to node_modules folder */
    path: string;
    /** Path to parent project folder */
    projectPath: string;
    /** Size in bytes */
    size: number;
    /** Last modified date */
    lastModified: Date;
    /** Number of packages inside */
    packageCount: number;
    /** Whether package-lock.json exists */
    hasPackageLock: boolean;
    /** Whether yarn.lock exists */
    hasYarnLock: boolean;
    /** Whether pnpm-lock.yaml exists */
    hasPnpmLock: boolean;
    /** Age in days */
    ageDays: number;
    /** Git status if available */
    gitStatus?: GitStatus;
}

export interface GitStatus {
    /** Whether the folder is in a git repo */
    isGitRepo: boolean;
    /** Whether there are uncommitted changes */
    isDirty: boolean;
    /** Current branch name */
    branch?: string;
}

export interface ScanOptions {
    /** Directory to scan */
    path: string;
    /** Maximum depth to scan */
    depth?: number;
    /** Skip size calculation for speed */
    quick?: boolean;
    /** Patterns to exclude */
    excludePatterns?: string[];
    /** Include patterns */
    includePatterns?: string[];
}

export interface CleanOptions {
    /** Delete folders older than (e.g., "30d", "3m", "1y") */
    olderThan?: string;
    /** Delete folders in age range (e.g., "30d-90d") */
    between?: string;
    /** Only delete folders larger than this */
    minSize?: string;
    /** Only delete folders smaller than this */
    maxSize?: string;
    /** Preview only, don't delete */
    dryRun?: boolean;
    /** Use native OS commands for faster deletion */
    fast?: boolean;
    /** Number of parallel deletions */
    parallel?: number;
    /** Create backup before deletion */
    backup?: boolean;
    /** Only delete if lockfile exists */
    lockCheck?: boolean;
    /** Skip folders with uncommitted git changes */
    skipDirtyGit?: boolean;
}

export interface DeepCleanOptions {
    /** Preview only, don't delete */
    dryRun?: boolean;
    /** Show detailed output */
    verbose?: boolean;
}

export interface CleanResult {
    /** Number of folders deleted */
    deletedCount: number;
    /** Total bytes freed */
    freedBytes: number;
    /** List of deleted paths */
    deletedPaths: string[];
    /** List of failed deletions */
    errors: CleanError[];
    /** Backup file path if created */
    backupPath?: string;
}

export interface DeepCleanResult {
    /** Number of files deleted */
    deletedFileCount: number;
    /** Number of folders processed */
    processedFolders: number;
    /** Total bytes freed */
    freedBytes: number;
    /** Detailed file list if verbose */
    deletedFiles?: string[];
}

export interface CleanError {
    /** Path that failed to delete */
    path: string;
    /** Error message */
    message: string;
}

export interface BackupInfo {
    /** Backup file name */
    filename: string;
    /** Full path to backup file */
    path: string;
    /** Timestamp of backup */
    timestamp: Date;
    /** Number of folders backed up */
    folderCount: number;
    /** Total size of backed up folders */
    totalSize: number;
}

export interface BackupData {
    /** Backup creation timestamp */
    timestamp: string;
    /** Tool version */
    version: string;
    /** List of backed up folders */
    folders: BackupFolderInfo[];
    /** Total size in bytes */
    totalSize: number;
    /** Total folder count */
    totalFolders: number;
}

export interface BackupFolderInfo {
    /** Path to node_modules */
    path: string;
    /** Size in bytes */
    size: number;
    /** Path to package.json */
    packageJsonPath: string;
    /** Lockfile type if exists */
    lockfileType?: 'npm' | 'yarn' | 'pnpm';
}

export interface ReportData {
    /** Scan timestamp */
    timestamp: Date;
    /** Total folders found */
    totalFolders: number;
    /** Total size in bytes */
    totalSize: number;
    /** Breakdown by age */
    byAge: {
        recent: NodeModulesInfo[];    // 0-30 days
        medium: NodeModulesInfo[];    // 30-90 days
        old: NodeModulesInfo[];       // 90+ days
    };
    /** Top 10 largest folders */
    topBySize: NodeModulesInfo[];
    /** Top 10 oldest folders */
    topByAge: NodeModulesInfo[];
}

export interface Config {
    /** Paths to always exclude */
    exclude?: string[];
    /** Glob patterns to exclude */
    excludePattern?: string[];
    /** Default older than value */
    defaultOlderThan?: string;
    /** Default scan path */
    defaultPath?: string;
    /** Default scan depth */
    defaultDepth?: number;
    /** Language preference */
    lang?: string;
}

export type OutputFormat = 'table' | 'json' | 'csv';

export interface GlobalOptions {
    /** Verbose output */
    verbose?: boolean;
    /** Debug mode */
    debug?: boolean;
    /** Output format */
    format?: OutputFormat;
    /** Language */
    lang?: string;
    /** Config file path */
    config?: string;
    /** Log file path */
    logFile?: string;
}
