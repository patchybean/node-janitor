# Performance Benchmark

Node Janitor is designed for convenience and features. This page documents real benchmark results.

## Running Benchmarks

```bash
# Basic benchmark
npm run benchmark

# Comparison with npkill
npm run build && npx tsx benchmark/compare.ts
```

## Real Benchmark Results

Tested on MacBook Pro M1, 16GB RAM, SSD (December 2024):

### Scan Performance Comparison

| Folders | node-janitor | npkill | find+du (baseline) |
|---------|--------------|--------|-------------------|
| 10 | 293ms | 450ms | 27ms |
| 25 | 409ms | 390ms | 47ms |
| 50 | 695ms | 373ms | 88ms |

!!! note "Honest Assessment"
    - **Small projects (< 25)**: node-janitor is slightly faster
    - **Large projects (50+)**: npkill is faster at scanning
    - **Baseline (find+du)**: Native commands are always fastest

### Analysis

**Why npkill can be faster at scale:**

- npkill uses efficient streaming algorithms
- node-janitor calculates more metadata (package count, lockfile detection)
- node-janitor builds interactive table data

**Why node-janitor adds value despite speed:**

- Git-aware cleanup (`--skip-dirty-git`)
- Age-based filtering (`--older-than`)
- Deep clean mode
- Watch & Schedule modes
- Config file support
- Multi-language support

## Optimization Tips

### 1. Use Quick Scan

```bash
node-janitor --quick --older-than 30d
```

Skips size calculation, ~3x faster for scanning.

### 2. Use Fast Mode

```bash
node-janitor --fast
```

Uses native `rm -rf` (Unix) or `rmdir /s /q` (Windows) instead of Node.js fs.

### 3. Limit Depth

```bash
node-janitor --depth 3
```

Only scan 3 levels deep, faster for deeply nested structures.

### 4. Parallel Deletion

```bash
node-janitor --parallel 4
```

Delete 4 folders concurrently.

### 5. Use Patterns

```bash
node-janitor --exclude "node_modules/@types"
```

Skip certain patterns to reduce work.

## Memory Usage

Node Janitor is designed to be memory-efficient:

- Streams folder discovery (doesn't load all paths into memory at once)
- Processes deletions in batches
- Uses native commands when available

Typical memory usage: **~50-100MB** for 1000+ folders.

## Profiling

To profile Node Janitor:

```bash
# CPU profiling
node --prof dist/index.js --path ~/projects --dry-run

# Memory profiling
node --inspect dist/index.js --path ~/projects --dry-run
```

## Contributing

Found a performance issue? [Open an issue](https://github.com/patchybean/node-janitor/issues) with:

- Your environment (OS, Node version, disk type)
- Number and size of folders scanned
- Expected vs actual performance
