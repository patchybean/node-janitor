# Quick Start

This guide will help you get started with Node Janitor in just a few minutes.

## Basic Scan

The simplest way to use Node Janitor is to scan your projects directory:

```bash
node-janitor --path ~/projects
```

This will find and display all `node_modules` folders in the specified path.

## Preview Mode (Dry Run)

Before deleting anything, preview what would be cleaned:

```bash
node-janitor --path ~/projects --dry-run
```

!!! tip "Always Preview First"
    It's recommended to use `--dry-run` first to see what will be deleted before performing actual cleanup.

## Age-based Cleanup

Delete `node_modules` folders older than 30 days:

```bash
node-janitor --older-than 30d
```

Supported duration formats:

| Format | Example | Description |
|--------|---------|-------------|
| `Xd` | `30d` | X days |
| `Xw` | `2w` | X weeks |
| `Xm` | `3m` | X months |
| `Xy` | `1y` | X years |

## Interactive TUI Mode

Launch the full-screen interactive interface:

```bash
node-janitor --live
```

Use keyboard to navigate:

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate list |
| `Space` | Select/Deselect |
| `A` | Select all |
| `S` | Toggle sort (size/age) |
| `D` | Delete selected |
| `Q` / `Esc` | Exit |

## Deep Clean Mode

Remove unnecessary files (docs, tests, source maps) without deleting entire folders:

```bash
node-janitor --deep-clean
```

This can save ~40% additional space!

## Common Workflows

### Weekly Cleanup

```bash
# Delete old projects, create backup first
node-janitor --older-than 60d --backup
```

### CI/CD Pipeline

```bash
# Silent mode with JSON output for automation
node-janitor --silent --older-than 30d --json
```

### Safe Cleanup (Git-aware)

```bash
# Skip repos with uncommitted changes
node-janitor --skip-dirty-git --older-than 30d
```

---

## What's Next?

- [Commands Reference](commands/index.md) - Learn all available commands
- [Configuration](configuration.md) - Set up persistent config file
- [Watch Mode](commands/watch.md) - Continuous monitoring
