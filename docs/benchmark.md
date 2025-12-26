# Performance Benchmark

Node Janitor is optimized for performance. This page documents the benchmark results and optimization tips.

## Running Benchmarks

```bash
npm run benchmark
```

This creates a test environment with mock `node_modules` folders and measures:

- **Scan time** - Time to find and analyze all folders
- **Quick scan time** - Time with `--quick` flag (skips size calculation)
- **Fast delete time** - Time with `--fast` flag (uses native OS commands)

## Benchmark Results

Results on MacBook Pro M1, 16GB RAM, SSD:

| Operation | 20 folders | 100 folders | 500 folders |
|-----------|------------|-------------|-------------|
| Scan | ~150ms | ~400ms | ~1.5s |
| Quick scan | ~50ms | ~120ms | ~400ms |
| Delete | ~300ms | ~800ms | ~2s |
| Fast delete | ~100ms | ~250ms | ~600ms |

!!! note "Your Results May Vary"
    Performance depends on disk speed, folder sizes, and system load.

## Comparison with Other Tools

### vs npkill

| Operation | node-janitor | npkill |
|-----------|--------------|--------|
| Initial scan | Similar | Similar |
| Size calculation | ✅ Parallel | ❌ Sequential |
| Delete speed | ✅ Fast mode | ✅ Fast |
| Memory usage | Low | Low |

### vs find + rm

```bash
# Traditional approach
find ~/projects -name "node_modules" -type d -prune -exec rm -rf {} +

# Node Janitor with filters
node-janitor --older-than 30d --fast
```

Node Janitor advantages:

- Age filtering built-in
- Size filtering
- Dry run preview
- Backup capability
- Progress reporting

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
