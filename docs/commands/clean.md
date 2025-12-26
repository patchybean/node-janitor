# Scan & Clean

The main command scans for `node_modules` folders and optionally cleans them.

## Basic Usage

```bash
# Scan current directory
node-janitor

# Scan specific path
node-janitor --path ~/projects

# Limit scan depth
node-janitor --path ~/projects --depth 3
```

## Dry Run (Preview)

Always preview before deleting:

```bash
node-janitor --path ~/projects --older-than 30d --dry-run
```

!!! tip "Best Practice"
    Use `--dry-run` first to see what will be deleted, then run without it to perform the actual cleanup.

## Age-based Cleanup

Delete folders older than a specified duration:

```bash
# Older than 30 days
node-janitor --older-than 30d

# Older than 3 months
node-janitor --older-than 3m

# Older than 1 year
node-janitor --older-than 1y

# Between 30 and 90 days
node-janitor --between 30d-90d
```

### Duration Formats

| Format | Description | Example |
|--------|-------------|---------|
| `Xd` | X days | `30d` = 30 days |
| `Xw` | X weeks | `2w` = 14 days |
| `Xm` | X months | `3m` = 90 days |
| `Xy` | X years | `1y` = 365 days |

## Size Filters

Filter by folder size:

```bash
# Only large folders (> 500MB)
node-janitor --min-size 500MB

# Only small folders (< 10MB)
node-janitor --max-size 10MB

# Combined with age
node-janitor --older-than 30d --min-size 100MB
```

## Pattern Filters

### Exclude Patterns

```bash
# Exclude specific folders
node-janitor --exclude "important-project,client-work"
```

### Include Patterns

```bash
# Only include matching patterns
node-janitor --include "test-*,demo-*"
```

## Deep Clean Mode

Remove unnecessary files without deleting entire folders:

```bash
node-janitor --deep-clean
```

Files removed:

- 📚 Documentation: `*.md`, `LICENSE`, `CHANGELOG`, `docs/`
- 🧪 Tests: `test/`, `tests/`, `__tests__/`, `spec/`
- 🗺️ Source maps: `*.map`
- 📦 Examples: `example/`, `examples/`
- ⚙️ Config files: `.eslintrc`, `.prettierrc`, etc.

!!! info "Space Savings"
    Deep clean typically saves ~40% additional space without breaking dependencies.

## Safety Options

### Backup Before Delete

```bash
node-janitor --older-than 30d --backup
```

Creates a JSON file with list of deleted folders.

### Lockfile Check

```bash
node-janitor --lock-check
```

Only delete folders that have a lockfile (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`).

### Git-aware Cleanup

```bash
# Skip repos with uncommitted changes
node-janitor --skip-dirty-git

# Only process git repositories
node-janitor --git-only

# Both options
node-janitor --skip-dirty-git --git-only --older-than 30d
```

## Performance Options

### Fast Mode

Use native OS commands for faster deletion:

```bash
node-janitor --fast
```

!!! note "Platform Support"
    Fast mode uses `rm -rf` on Unix and `rmdir /s /q` on Windows.

### Parallel Deletion

```bash
node-janitor --parallel 4
```

Run multiple deletions concurrently.

## Examples

### Clean Old Projects

```bash
node-janitor --path ~/projects --older-than 90d
```

### Safe Weekly Cleanup

```bash
node-janitor --path ~/projects --older-than 60d \
  --skip-dirty-git --backup --dry-run
```

### Maximum Space Recovery

```bash
node-janitor --path ~/projects --older-than 30d --fast
node-janitor --deep-clean  # Additional cleanup
```
