#!/usr/bin/env node
/**
 * Run benchmark multiple times and calculate average
 */

import { performance } from 'perf_hooks';
import { execSync, spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

const ITERATIONS = 10;
const FOLDER_COUNTS = [10, 25, 50];

interface RunResult {
    nodeJanitor: number;
    npkill: number;
    findDu: number;
}

async function createTestEnvironment(folderCount: number): Promise<string> {
    const testDir = path.join(os.tmpdir(), `bench-avg-${Date.now()}`);
    await fs.ensureDir(testDir);

    for (let i = 0; i < folderCount; i++) {
        const projectDir = path.join(testDir, `project-${i}`);
        const nodeModulesDir = path.join(projectDir, 'node_modules');
        await fs.ensureDir(nodeModulesDir);

        for (let j = 0; j < 5; j++) {
            const packageDir = path.join(nodeModulesDir, `pkg-${j}`);
            await fs.ensureDir(packageDir);
            await fs.writeFile(path.join(packageDir, 'index.js'), `// pkg ${j}\n`.repeat(500));
        }
        await fs.writeFile(path.join(projectDir, 'package.json'), '{}');
    }

    return testDir;
}

async function benchmarkNodeJanitor(testDir: string): Promise<number> {
    const start = performance.now();
    try {
        execSync(
            `node ${path.join(process.cwd(), 'dist/index.js')} --path "${testDir}" --dry-run --silent`,
            { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 }
        );
    } catch { /* ignore */ }
    return performance.now() - start;
}

async function benchmarkNpkill(testDir: string): Promise<number> {
    const start = performance.now();
    try {
        const proc = spawn('npx', ['npkill', '-d', testDir], { stdio: ['pipe', 'pipe', 'pipe'] });
        await new Promise<void>((resolve) => {
            proc.stdout.on('data', () => { proc.kill(); resolve(); });
            setTimeout(() => { proc.kill(); resolve(); }, 30000);
        });
    } catch { /* ignore */ }
    return performance.now() - start;
}

async function benchmarkFind(testDir: string): Promise<number> {
    const start = performance.now();
    try {
        execSync(`find "${testDir}" -name "node_modules" -type d -prune -exec du -sk {} \\;`, { encoding: 'utf-8' });
    } catch { /* ignore */ }
    return performance.now() - start;
}

function formatTime(ms: number): string {
    return `${ms.toFixed(0)}ms`;
}

async function main() {
    console.log('\n='.repeat(60));
    console.log('📊 BENCHMARK: 10 ITERATIONS AVERAGE');
    console.log('='.repeat(60));

    const results: Record<number, RunResult[]> = {};
    for (const count of FOLDER_COUNTS) {
        results[count] = [];
    }

    for (let iter = 1; iter <= ITERATIONS; iter++) {
        console.log(`\n🔄 Iteration ${iter}/${ITERATIONS}...`);

        for (const count of FOLDER_COUNTS) {
            const testDir = await createTestEnvironment(count);

            const nj = await benchmarkNodeJanitor(testDir);
            const npk = await benchmarkNpkill(testDir);
            const fd = await benchmarkFind(testDir);

            results[count].push({ nodeJanitor: nj, npkill: npk, findDu: fd });

            console.log(`   ${count} folders: nj=${formatTime(nj)}, npkill=${formatTime(npk)}, find=${formatTime(fd)}`);

            await fs.remove(testDir);
        }
    }

    // Calculate averages
    console.log('\n' + '='.repeat(60));
    console.log('📋 AVERAGE RESULTS (10 iterations)');
    console.log('='.repeat(60));
    console.log('\n| Folders | node-janitor | npkill | find+du | Ratio |');
    console.log('|---------|--------------|--------|---------|-------|');

    for (const count of FOLDER_COUNTS) {
        const runs = results[count];
        const avgNj = runs.reduce((s, r) => s + r.nodeJanitor, 0) / runs.length;
        const avgNpk = runs.reduce((s, r) => s + r.npkill, 0) / runs.length;
        const avgFd = runs.reduce((s, r) => s + r.findDu, 0) / runs.length;
        const ratio = (avgNpk / avgNj).toFixed(1);

        console.log(`| ${count} | ${formatTime(avgNj)} | ${formatTime(avgNpk)} | ${formatTime(avgFd)} | ${ratio}x faster |`);
    }

    console.log('\n✅ Benchmark complete!');
}

main().catch(console.error);
