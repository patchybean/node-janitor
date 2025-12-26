#!/usr/bin/env node
/**
 * Performance Benchmark for Node Janitor
 * 
 * Compares scanning and deletion performance against baseline
 * and optionally against npkill
 */

import { performance } from 'perf_hooks';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

interface BenchmarkResult {
    name: string;
    scanTime: number;
    deleteTime?: number;
    folderCount: number;
    totalSize: number;
}

const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

function log(message: string, color = COLORS.reset): void {
    console.log(`${color}${message}${COLORS.reset}`);
}

function formatTime(ms: number): string {
    if (ms < 1000) {
        return `${ms.toFixed(2)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function createTestEnvironment(): Promise<string> {
    const testDir = path.join(os.tmpdir(), `node-janitor-bench-${Date.now()}`);
    await fs.ensureDir(testDir);

    log('\n📁 Creating test environment...', COLORS.cyan);

    // Create mock node_modules folders
    const folderCount = 20;
    for (let i = 0; i < folderCount; i++) {
        const projectDir = path.join(testDir, `project-${i}`);
        const nodeModulesDir = path.join(projectDir, 'node_modules');
        await fs.ensureDir(nodeModulesDir);

        // Create some mock packages
        for (let j = 0; j < 10; j++) {
            const packageDir = path.join(nodeModulesDir, `package-${j}`);
            await fs.ensureDir(packageDir);
            await fs.writeFile(
                path.join(packageDir, 'index.js'),
                `// Mock package ${j}\n`.repeat(1000)
            );
            await fs.writeFile(
                path.join(packageDir, 'package.json'),
                JSON.stringify({ name: `package-${j}`, version: '1.0.0' })
            );
        }

        // Create package.json and lockfile
        await fs.writeFile(
            path.join(projectDir, 'package.json'),
            JSON.stringify({ name: `project-${i}`, version: '1.0.0' })
        );
        await fs.writeFile(path.join(projectDir, 'package-lock.json'), '{}');
    }

    log(`   Created ${folderCount} mock projects`, COLORS.green);
    return testDir;
}

async function benchmarkScan(testDir: string): Promise<BenchmarkResult> {
    log('\n⏱️  Benchmarking scan performance...', COLORS.cyan);

    const start = performance.now();

    // Run node-janitor scan
    const output = execSync(
        `node ${path.join(process.cwd(), 'dist/index.js')} --path "${testDir}" --json --dry-run`,
        { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 }
    );

    const end = performance.now();
    const scanTime = end - start;

    let folderCount = 0;
    let totalSize = 0;

    try {
        const result = JSON.parse(output);
        folderCount = result.count || 0;
        totalSize = result.totalSize || 0;
    } catch {
        // Parse from output if JSON fails
        const countMatch = output.match(/Found (\d+)/);
        if (countMatch) {
            folderCount = parseInt(countMatch[1], 10);
        }
    }

    log(`   Scan time: ${formatTime(scanTime)}`, COLORS.green);
    log(`   Folders found: ${folderCount}`, COLORS.green);
    log(`   Total size: ${formatBytes(totalSize)}`, COLORS.green);

    return {
        name: 'node-janitor',
        scanTime,
        folderCount,
        totalSize,
    };
}

async function benchmarkQuickScan(testDir: string): Promise<BenchmarkResult> {
    log('\n⚡ Benchmarking quick scan (--quick)...', COLORS.cyan);

    const start = performance.now();

    execSync(
        `node ${path.join(process.cwd(), 'dist/index.js')} --path "${testDir}" --quick --dry-run`,
        { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 }
    );

    const end = performance.now();
    const scanTime = end - start;

    log(`   Quick scan time: ${formatTime(scanTime)}`, COLORS.green);

    return {
        name: 'node-janitor --quick',
        scanTime,
        folderCount: 0,
        totalSize: 0,
    };
}

async function benchmarkFastDelete(testDir: string): Promise<BenchmarkResult> {
    log('\n🗑️  Benchmarking fast delete (--fast)...', COLORS.cyan);

    // Create fresh test data for deletion
    const deleteTestDir = path.join(os.tmpdir(), `node-janitor-delete-bench-${Date.now()}`);
    await fs.copy(testDir, deleteTestDir);

    const start = performance.now();

    execSync(
        `node ${path.join(process.cwd(), 'dist/index.js')} --path "${deleteTestDir}" --fast --silent`,
        { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 }
    );

    const end = performance.now();
    const deleteTime = end - start;

    log(`   Fast delete time: ${formatTime(deleteTime)}`, COLORS.green);

    // Cleanup
    await fs.remove(deleteTestDir);

    return {
        name: 'node-janitor --fast',
        scanTime: 0,
        deleteTime,
        folderCount: 0,
        totalSize: 0,
    };
}

async function runBenchmarks(): Promise<void> {
    log('\n' + '='.repeat(60), COLORS.bright);
    log('🚀 NODE JANITOR PERFORMANCE BENCHMARK', COLORS.bright);
    log('='.repeat(60), COLORS.bright);

    let testDir: string | null = null;
    const results: BenchmarkResult[] = [];

    try {
        // Create test environment
        testDir = await createTestEnvironment();

        // Run benchmarks
        results.push(await benchmarkScan(testDir));
        results.push(await benchmarkQuickScan(testDir));
        results.push(await benchmarkFastDelete(testDir));

        // Print summary
        log('\n' + '='.repeat(60), COLORS.bright);
        log('📊 BENCHMARK RESULTS', COLORS.bright);
        log('='.repeat(60), COLORS.bright);

        console.log('\n');
        console.log('| Benchmark | Time |');
        console.log('|-----------|------|');

        for (const result of results) {
            const time = result.deleteTime || result.scanTime;
            console.log(`| ${result.name} | ${formatTime(time)} |`);
        }

        // Performance tips
        log('\n💡 Performance Tips:', COLORS.yellow);
        log('   • Use --quick for faster scanning (skips size calculation)', COLORS.reset);
        log('   • Use --fast for faster deletion (uses native rm -rf)', COLORS.reset);
        log('   • Use --parallel N for concurrent deletions', COLORS.reset);
        log('   • Use --depth N to limit scan depth', COLORS.reset);

    } finally {
        // Cleanup
        if (testDir) {
            log('\n🧹 Cleaning up test environment...', COLORS.cyan);
            await fs.remove(testDir);
        }
    }

    log('\n✅ Benchmark complete!', COLORS.green);
}

// Run benchmarks
runBenchmarks().catch(console.error);
