# Commands Overview

Node Janitor provides several commands and options for managing `node_modules` folders.

## Main Command

```bash
node-janitor [options]
```

The main command scans for `node_modules` and optionally cleans them.

## Sub-commands

| Command | Description |
|---------|-------------|
| `node-janitor` | Main scan and clean command |
| `node-janitor tui` | Interactive TUI mode |
| `node-janitor watch` | Watch mode for continuous monitoring |
| `node-janitor schedule` | Scheduled cleanup with cron |
| `node-janitor report` | Generate detailed reports |

## Global Options

### Path & Scanning

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Directory to scan | Current directory |
| `-d, --depth <n>` | Maximum scan depth | Unlimited |
| `--quick` | Skip size calculation (faster) | `false` |

### Filters

| Option | Description | Example |
|--------|-------------|---------|
| `--older-than <duration>` | Only folders older than | `30d`, `3m`, `1y` |
| `--between <range>` | Age range | `30d-90d` |
| `--min-size <size>` | Minimum folder size | `500MB` |
| `--max-size <size>` | Maximum folder size | `10MB` |
| `--exclude <patterns>` | Exclude patterns | `work,client` |
| `--include <patterns>` | Include only these | `test-*` |

### Modes

| Option | Description |
|--------|-------------|
| `-i, --interactive` | Step-by-step wizard mode |
| `-l, --live` | Interactive TUI mode |
| `--dry-run` | Preview only, no deletion |
| `--deep-clean` | Remove unnecessary files |

### Safety

| Option | Description |
|--------|-------------|
| `--backup` | Create backup before deletion |
| `--lock-check` | Only delete if lockfile exists |
| `--skip-dirty-git` | Skip repos with uncommitted changes |
| `--git-only` | Only process git repositories |

### Performance

| Option | Description | Default |
|--------|-------------|---------|
| `--fast` | Use native OS commands | `false` |
| `--parallel <n>` | Parallel deletions | 1 |

### Output

| Option | Description |
|--------|-------------|
| `-v, --verbose` | Verbose output |
| `--debug` | Debug mode |
| `--silent` | Silent mode (CI/CD) |
| `--json` | JSON output |

### Configuration

| Option | Description |
|--------|-------------|
| `-c, --config <path>` | Path to config file |
| `--lang <code>` | Language (en, vi, zh, ja, ko, es, fr, de) |

---

## Quick Reference

```bash
# Scan current directory
node-janitor

# Scan with age filter
node-janitor --older-than 30d

# Preview before delete
node-janitor --older-than 30d --dry-run

# Interactive TUI
node-janitor --live

# Watch mode
node-janitor watch --interval 60

# Scheduled cleanup
node-janitor schedule --daily --older-than 60d

# CI/CD usage
node-janitor --silent --older-than 30d --json
```
