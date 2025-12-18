import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import type { GitStatus } from '../types/index.js';

const execAsync = promisify(exec);

/**
 * Check if a directory is inside a git repository
 */
export async function isGitRepo(dir: string): Promise<boolean> {
    try {
        await execAsync('git rev-parse --is-inside-work-tree', { cwd: dir });
        return true;
    } catch {
        return false;
    }
}

/**
 * Get the root of the git repository
 */
export async function getGitRoot(dir: string): Promise<string | null> {
    try {
        const { stdout } = await execAsync('git rev-parse --show-toplevel', { cwd: dir });
        return stdout.trim();
    } catch {
        return null;
    }
}

/**
 * Check if there are uncommitted changes in the repository
 */
export async function isDirty(dir: string): Promise<boolean> {
    try {
        const { stdout } = await execAsync('git status --porcelain', { cwd: dir });
        return stdout.trim().length > 0;
    } catch {
        return false;
    }
}

/**
 * Get the current branch name
 */
export async function getCurrentBranch(dir: string): Promise<string | null> {
    try {
        const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: dir });
        return stdout.trim();
    } catch {
        return null;
    }
}

/**
 * Check if the current branch is merged into main/master
 */
export async function isMergedToMain(dir: string): Promise<boolean> {
    try {
        const branch = await getCurrentBranch(dir);
        if (!branch || branch === 'main' || branch === 'master') {
            return true;
        }

        // Try to check if merged into main or master
        const mainBranches = ['main', 'master'];
        for (const mainBranch of mainBranches) {
            try {
                const { stdout } = await execAsync(
                    `git branch --merged ${mainBranch} 2>/dev/null | grep -E "^\\s*${branch}$"`,
                    { cwd: dir }
                );
                if (stdout.trim()) {
                    return true;
                }
            } catch {
                continue;
            }
        }
        return false;
    } catch {
        return false;
    }
}

/**
 * Get full git status for a project directory
 */
export async function getGitStatus(projectPath: string): Promise<GitStatus | undefined> {
    const isRepo = await isGitRepo(projectPath);
    if (!isRepo) {
        return undefined;
    }

    const [dirty, branch] = await Promise.all([
        isDirty(projectPath),
        getCurrentBranch(projectPath),
    ]);

    return {
        isGitRepo: true,
        isDirty: dirty,
        branch: branch || undefined,
    };
}

/**
 * Check if node_modules is in gitignore
 */
export async function isNodeModulesIgnored(projectPath: string): Promise<boolean> {
    try {
        const nodeModulesPath = path.join(projectPath, 'node_modules');
        const { stdout } = await execAsync(
            `git check-ignore -q "${nodeModulesPath}" && echo "ignored" || echo "tracked"`,
            { cwd: projectPath }
        );
        return stdout.trim() === 'ignored';
    } catch {
        // If git command fails, assume it's ignored (safe default)
        return true;
    }
}

export default {
    isGitRepo,
    getGitRoot,
    isDirty,
    getCurrentBranch,
    isMergedToMain,
    getGitStatus,
    isNodeModulesIgnored,
};
