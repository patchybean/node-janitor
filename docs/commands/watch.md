# Watch Mode

Watch mode continuously monitors directories and optionally auto-cleans when `node_modules` folders exceed a specified age.

## Usage

```bash
node-janitor watch [options]
```

## Basic Example

```bash
# Watch ~/projects every 60 seconds
node-janitor watch --path ~/projects --interval 60
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Directory to watch | Current directory |
| `-d, --depth <n>` | Maximum scan depth | Unlimited |
| `--older-than <duration>` | Age filter | None |
| `--interval <seconds>` | Scan interval | 60 |
| `--auto-clean` | Auto-delete matching folders | `false` |
| `--dry-run` | Preview only | `false` |

## Examples

### Monitor Without Auto-clean

```bash
# Just watch and report
node-janitor watch --path ~/projects --interval 120
```

Output:
```
🔄 Watch Mode Started
Watching: /Users/me/projects
Interval: 120s
Press Ctrl+C to stop

[15:30:00] Scanning... Found 5 folders (1.2 GB)
  → ~/old-app (180d)
  → ~/test-project (95d)
  ... and 3 more
```

### Auto-clean Old Folders

```bash
node-janitor watch --path ~/projects \
  --older-than 60d \
  --auto-clean \
  --interval 3600  # Every hour
```

!!! warning "Use with Caution"
    `--auto-clean` will delete folders without confirmation. Make sure to set an appropriate `--older-than` value.

### Preview Auto-clean

```bash
node-janitor watch --path ~/projects \
  --older-than 30d \
  --auto-clean \
  --dry-run
```

## Stopping

Press `Ctrl+C` to stop watch mode. Summary will be displayed:

```
✔ Watch mode stopped
Total cleaned: 5 folders
Total freed: 1.2 GB
```

## Use Cases

### Development Machine Maintenance

Keep your development machine clean by running in background:

```bash
# Run in tmux/screen
node-janitor watch --path ~/projects \
  --older-than 90d \
  --auto-clean \
  --interval 86400  # Once per day
```

### CI/CD Agent Cleanup

```bash
node-janitor watch --path /ci/workspaces \
  --older-than 7d \
  --auto-clean \
  --interval 3600
```

## Comparison with Schedule

| Feature | Watch | Schedule |
|---------|-------|----------|
| Interval-based | ✅ | ❌ |
| Cron expressions | ❌ | ✅ |
| Runs continuously | ✅ | ✅ |
| Auto-clean | ✅ | ✅ (always cleans) |

Use **Watch** for simple intervals, **Schedule** for more complex timing needs.
