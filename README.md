# 🧹 Node-Janitor

> Smart CLI tool to clean up `node_modules` folders - free up disk space automatically

[![npm version](https://badge.fury.io/js/node-janitor.svg)](https://badge.fury.io/js/node-janitor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🔍 **Smart Scanner** - Find all `node_modules` in your system
- ⏰ **Time-based Cleanup** - Delete folders older than X days
- 🧼 **Deep Clean** - Remove unnecessary files (docs, tests, source maps)
- 👁️ **Dry Run** - Preview before deleting
- 🎮 **Interactive Mode** - Step-by-step wizard
- 💾 **Backup** - Save list before deletion
- 📊 **Reports** - Detailed analytics
- ⚡ **Fast Mode** - Native OS commands for speed
- 🔄 **CI/CD Ready** - Silent mode with JSON output

## 📦 Installation

```bash
# Global installation
npm install -g node-janitor

# Or use with npx
npx node-janitor
```

## 🚀 Quick Start

```bash
# Scan current directory
node-janitor

# Scan specific path
node-janitor --path ~/projects

# Preview what would be deleted (dry run)
node-janitor --path ~/projects --dry-run

# Delete folders older than 30 days
node-janitor --older-than 30d

# Interactive mode
node-janitor --interactive
```

## 📖 Usage

### Basic Commands

```bash
# Scan and show all node_modules
node-janitor --path ~/projects

# Limit scan depth
node-janitor --path ~/projects --depth 3

# Quick scan (skip size calculation)
node-janitor --path ~/projects --quick
```

### Time-based Cleanup

```bash
# Delete folders older than 30 days
node-janitor --older-than 30d

# Delete folders older than 3 months
node-janitor --older-than 3m

# Delete folders between 30-90 days old
node-janitor --between 30d-90d
```

### Size Filters

```bash
# Only delete folders larger than 500MB
node-janitor --min-size 500MB

# Only delete folders smaller than 10MB
node-janitor --max-size 10MB
```

### Deep Clean Mode

Remove unnecessary files from `node_modules` without deleting the entire folder:

```bash
node-janitor --deep-clean
```

**Files removed:**
- Documentation: `*.md`, `LICENSE`, `CHANGELOG`, `docs/`
- Tests: `test/`, `tests/`, `__tests__/`, `spec/`
- Source maps: `*.map`
- Examples: `example/`, `examples/`
- Config files: `.eslintrc`, `.prettierrc`, etc.

### Safe Mode

```bash
# Preview without deleting
node-janitor --dry-run

# Create backup before deletion
node-janitor --backup

# Only delete if lockfile exists
node-janitor --lock-check
```

### Performance

```bash
# Use native OS commands (faster)
node-janitor --fast

# Parallel deletion
node-janitor --parallel 4
```

### Reports

```bash
# Generate report
node-janitor report

# Detailed report
node-janitor report --detailed

# JSON output
node-janitor report --json
```

### CI/CD Integration

```bash
# Silent mode (no prompts, no colors)
node-janitor --silent --older-than 30d

# JSON output for automation
node-janitor --json
```

### Exclude Patterns

```bash
# Exclude specific folders
node-janitor --exclude "important-project,client-work"
```

## 📋 All Options

| Option | Description |
|--------|-------------|
| `-p, --path <path>` | Directory to scan (default: current) |
| `-d, --depth <n>` | Maximum scan depth |
| `--older-than <duration>` | Only process folders older than (30d, 3m, 1y) |
| `--between <range>` | Age range (30d-90d) |
| `--min-size <size>` | Minimum folder size (500MB) |
| `--max-size <size>` | Maximum folder size (10MB) |
| `--dry-run` | Preview only |
| `--deep-clean` | Remove unnecessary files |
| `--fast` | Use native OS commands |
| `--parallel <n>` | Number of parallel deletions |
| `--backup` | Create backup before deletion |
| `--lock-check` | Only delete if lockfile exists |
| `--quick` | Skip size calculation |
| `-i, --interactive` | Interactive mode |
| `-v, --verbose` | Verbose output |
| `--debug` | Debug mode |
| `--silent` | Silent mode (CI/CD) |
| `--json` | JSON output |
| `--exclude <patterns>` | Exclude patterns (comma-separated) |

## 🎯 Examples

### Clean old projects

```bash
# Find and delete node_modules older than 90 days
node-janitor --path ~/projects --older-than 90d
```

### Deep clean to save space

```bash
# Remove docs, tests, source maps from all node_modules
node-janitor --path ~/projects --deep-clean
```

### CI/CD cleanup

```bash
# Automated cleanup in CI
node-janitor --silent --older-than 60d --json
```

### Cautious cleanup

```bash
# Preview first
node-janitor --path ~/projects --older-than 30d --dry-run

# Then execute with backup
node-janitor --path ~/projects --older-than 30d --backup
```

## 📊 Sample Output

```
🧹 NODE JANITOR

✔ Found 15 node_modules folders

┌─────┬──────────────────────────────┬──────────┬───────┬──────────┬──────┐
│ #   │ Path                         │ Size     │ Age   │ Packages │ Lock │
├─────┼──────────────────────────────┼──────────┼───────┼──────────┼──────┤
│ 1   │ ~/projects/old-app           │ 523 MB   │ 180d  │ 1,234    │ npm  │
│ 2   │ ~/projects/test-project      │ 312 MB   │ 95d   │ 567      │ yarn │
│ 3   │ ~/projects/archived          │ 245 MB   │ 45d   │ 890      │ npm  │
└─────┴──────────────────────────────┴──────────┴───────┴──────────┴──────┘

┌───────────────┬──────────┐
│ Total Folders │ 15       │
│ Total Size    │ 2.5 GB   │
│ Oldest        │ 180 days │
│ Newest        │ 5 days   │
└───────────────┴──────────┘
```

## 🔧 Development

```bash
# Clone repository
git clone https://github.com/patchybean/node-janitor.git
cd node-janitor

# Install dependencies
npm install

# Build
npm run build

# Run locally
node dist/index.js --help
```

## 📄 License

MIT © Patchy Bean

---

**Made with ❤️ for developers who hate bloated disk space**
