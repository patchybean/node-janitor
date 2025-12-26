#!/usr/bin/env node
/**
 * Fair Comparison Benchmark: node-janitor vs npkill
 * 
 * Creates identical test environments and times both tools
 */

import { performance } from 'perf_hooks';
import { execSync, spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
};

function log(message: string, color = COLORS.reset): void {
    console.log(`${color}${message}${COLORS.reset}`);
}

function formatTime(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

async function createTestEnvironment(folderCount: number): Promise<string> {
    const testDir = path.join(os.tmpdir(), `benchmark-compare-${Date.now()}`);
    await fs.ensureDir(testDir);

    log(`\n📁 Creating ${folderCount} test projects...`, COLORS.cyan);

    for (let i = 0; i < folderCount; i++) {
        const projectDir = path.join(testDir, `project-${i}`);
        const nodeModulesDir = path.join(projectDir, 'node_modules');
        await fs.ensureDir(nodeModulesDir);

        // Create mock packages
        for (let j = 0; j < 5; j++) {
            const packageDir = path.join(nodeModulesDir, `pkg-${j}`);
            await fs.ensureDir(packageDir);
            await fs.writeFile(path.join(packageDir, 'index.js'), `// pkg ${j}\n`.repeat(500));
        }

        await fs.writeFile(path.join(projectDir, 'package.json'), '{}');
    }

    // Get actual size
    let totalSize = 0;
    try {
        const output = execSync(`du -sk "${testDir}"`, { encoding: 'utf-8' });
        totalSize = parseInt(output.split('\t')[0], 10) * 1024;
    } catch {
        // Ignore
    }

    log(`   Created ${folderCount} projects (~${(totalSize / 1024 / 1024).toFixed(1)} MB)`, COLORS.green);
    return testDir;
}

async function benchmarkNodeJanitor(testDir: string): Promise<number> {
    log('\n⏱️  Testing node-janitor...', COLORS.cyan);

    const start = performance.now();

    try {
        execSync(
            `node ${path.join(process.cwd(), 'dist/index.js')} --path "${testDir}" --dry-run --silent`,
            { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 }
        );
    } catch {
        // May exit with error if nothing to clean
    }

    const time = performance.now() - start;
    log(`   node-janitor scan: ${formatTime(time)}`, COLORS.green);
    return time;
}

async function benchmarkNpkill(testDir: string): Promise<number | null> {
    log('\n⏱️  Testing npkill...', COLORS.cyan);

    // Check if npkill is available
    try {
        execSync('npx npkill --version', { encoding: 'utf-8', timeout: 10000 });
    } catch {
        log('   npkill not available (skipping)', COLORS.yellow);
        return null;
    }

    const start = performance.now();

    try {
        // Run npkill in non-interactive mode with timeout
        // npkill doesn't have a true non-interactive scan mode,
        // so we measure initial scan time
        const proc = spawn('npx', ['npkill', '-d', testDir], {
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        await new Promise<void>((resolve) => {
            // Wait for first output (scan complete)
            proc.stdout.on('data', () => {
                proc.kill();
                resolve();
            });

            // Timeout after 30s
            setTimeout(() => {
                proc.kill();
                resolve();
            }, 30000);
        });
    } catch {
        // Ignore kill errors
    }

    const time = performance.now() - start;
    log(`   npkill scan: ${formatTime(time)}`, COLORS.green);
    return time;
}

async function benchmarkFind(testDir: string): Promise<number> {
    log('\n⏱️  Testing find + du (baseline)...', COLORS.cyan);

    const start = performance.now();

    try {
        execSync(
            `find "${testDir}" -name "node_modules" -type d -prune -exec du -sk {} \\;`,
            { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 }
        );
    } catch {
        // Ignore
    }

    const time = performance.now() - start;
    log(`   find + du: ${formatTime(time)}`, COLORS.green);
    return time;
}

async function runComparison(): Promise<void> {
    log('\n' + '='.repeat(60), COLORS.bright);
    log('📊 NODE-JANITOR vs NPKILL - FAIR COMPARISON', COLORS.bright);
    log('='.repeat(60), COLORS.bright);

    const folderCounts = [10, 25, 50];
    const results: Array<{
        folders: number;
        nodeJanitor: number;
        npkill: number | null;
        find: number;
    }> = [];

    for (const count of folderCounts) {
        const testDir = await createTestEnvironment(count);

        try {
            const nodeJanitorTime = await benchmarkNodeJanitor(testDir);
            const npkillTime = await benchmarkNpkill(testDir);
            const findTime = await benchmarkFind(testDir);

            results.push({
                folders: count,
                nodeJanitor: nodeJanitorTime,
                npkill: npkillTime,
                find: findTime,
            });
        } finally {
            await fs.remove(testDir);
        }
    }

    // Print results
    log('\n' + '='.repeat(60), COLORS.bright);
    log('📋 RESULTS', COLORS.bright);
    log('='.repeat(60), COLORS.bright);

    console.log('\n| Folders | node-janitor | npkill | find+du (baseline) |');
    console.log('|---------|--------------|--------|-------------------|');

    for (const r of results) {
        const npkillStr = r.npkill !== null ? formatTime(r.npkill) : 'N/A';
        console.log(`| ${r.folders} | ${formatTime(r.nodeJanitor)} | ${npkillStr} | ${formatTime(r.find)} |`);
    }

    log('\n⚠️  Note: npkill is interactive and timing includes TUI startup', COLORS.yellow);
    log('   This comparison measures time to first output (scan complete)', COLORS.yellow);

    log('\n✅ Comparison complete!', COLORS.green);
}

runComparison().catch(console.error);
