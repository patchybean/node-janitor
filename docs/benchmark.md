# Performance Benchmark

Node Janitor uses native OS commands for blazing fast scanning. This page documents real benchmark results.

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

| Folders | node-janitor | npkill | find+du (baseline) | Winner |
|---------|--------------|--------|-------------------|--------|
| 10 | **174ms** | 504ms | 22ms | ✅ node-janitor (3x faster) |
| 25 | **133ms** | 408ms | 47ms | ✅ node-janitor (3x faster) |
| 50 | **150ms** | 525ms | 87ms | ✅ node-janitor (3.5x faster) |

!!! success "Performance Achievement"
    node-janitor is now **3-4x faster** than npkill on all tested scenarios!

### How We Achieved This

**Optimizations implemented:**

1. **Native `find` command** - Uses OS-level file scanning instead of Node.js `fs.readdir`
2. **Parallel metadata** - Collects folder info with 10 concurrent operations using `p-limit`
3. **Smart filtering** - Filters hidden/system folders after fast discovery
4. **Lazy evaluation** - Only calculates size when needed (`--quick` skips this)

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
