# Scheduled Cleanup

Schedule automated cleanup using cron expressions.

## Usage

```bash
node-janitor schedule [options]
```

## Presets

Quick presets for common schedules:

```bash
# Daily at midnight
node-janitor schedule --daily --older-than 30d

# Weekly on Sunday
node-janitor schedule --weekly --older-than 60d

# Monthly on 1st
node-janitor schedule --monthly --older-than 90d
```

## Custom Cron

Use any cron expression:

```bash
# Every 6 hours
node-janitor schedule --cron "0 */6 * * *" --older-than 30d

# Weekdays at 2am
node-janitor schedule --cron "0 2 * * 1-5" --older-than 60d
```

### Cron Format

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday = 0)
│ │ │ │ │
* * * * *
```

### Common Expressions

| Expression | Description |
|------------|-------------|
| `0 0 * * *` | Daily at midnight |
| `0 0 * * 0` | Weekly on Sunday |
| `0 0 1 * *` | Monthly on 1st |
| `0 * * * *` | Every hour |
| `0 */6 * * *` | Every 6 hours |
| `0 2 * * 1-5` | Weekdays at 2am |

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Directory to clean | Current directory |
| `-d, --depth <n>` | Maximum scan depth | Unlimited |
| `--cron <expression>` | Cron expression | None |
| `--daily` | Run daily at midnight | |
| `--weekly` | Run weekly on Sunday | |
| `--monthly` | Run monthly on 1st | |
| `--older-than <duration>` | Age filter | None |
| `--dry-run` | Preview only | `false` |

## Output

```
📅 Scheduled Cleanup Started
Path: /Users/me/projects
Schedule: 0 0 * * *
Age filter: >30 days
Press Ctrl+C to stop

Next run: 2024-01-15 00:00:00

[2024-01-15 00:00:00] Running scheduled cleanup...
Found 3 folders (523 MB)
✓ Cleaned 3 folders
✓ Freed 523 MB
```

## Stopping

Press `Ctrl+C` to stop:

```
✔ Scheduled cleanup stopped
Total runs: 5
Total cleaned: 15 folders
Total freed: 2.5 GB
```

## Running as Service

### Using systemd (Linux)

Create `/etc/systemd/system/node-janitor.service`:

```ini
[Unit]
Description=Node Janitor Scheduled Cleanup
After=network.target

[Service]
Type=simple
User=youruser
ExecStart=/usr/local/bin/node-janitor schedule --daily --older-than 30d --path /home/youruser/projects
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable node-janitor
sudo systemctl start node-janitor
```

### Using launchd (macOS)

Create `~/Library/LaunchAgents/com.nodejanitor.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.nodejanitor</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node-janitor</string>
        <string>schedule</string>
        <string>--daily</string>
        <string>--older-than</string>
        <string>30d</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

Load:

```bash
launchctl load ~/Library/LaunchAgents/com.nodejanitor.plist
```
