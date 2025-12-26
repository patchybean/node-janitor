# Reports

Generate detailed reports about `node_modules` usage.

## Usage

```bash
node-janitor report [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Directory to scan | Current directory |
| `-d, --depth <n>` | Maximum scan depth | Unlimited |
| `--detailed` | Show detailed breakdown | `false` |
| `--json` | Output as JSON | `false` |

## Basic Report

```bash
node-janitor report --path ~/projects
```

Output:

```
📊 Node Modules Report

┌───────────────┬──────────┐
│ Total Folders │ 15       │
│ Total Size    │ 2.5 GB   │
│ Avg Size      │ 167 MB   │
│ Oldest        │ 180 days │
│ Newest        │ 5 days   │
└───────────────┴──────────┘

📅 Breakdown by Age:
┌──────────────────┬───────┬──────────┐
│ Category         │ Count │ Size     │
├──────────────────┼───────┼──────────┤
│ Recent (< 30d)   │ 5     │ 400 MB   │
│ Medium (30-90d)  │ 6     │ 900 MB   │
│ Old (> 90d)      │ 4     │ 1.2 GB   │
└──────────────────┴───────┴──────────┘

💡 Recommendations
  → Run node-janitor --older-than 90d to free 1.2 GB
  → Run node-janitor --deep-clean to save ~40% more space
```

## Detailed Report

```bash
node-janitor report --detailed
```

Shows additional sections:

- **Top 10 Largest** - Biggest folders by size
- **Top 10 Oldest** - Oldest folders by age

## JSON Output

For automation and scripting:

```bash
node-janitor report --json
```

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "totalSize": 2684354560,
  "count": 15,
  "averageSize": 178956970,
  "breakdown": {
    "recent": { "count": 5, "size": 419430400 },
    "medium": { "count": 6, "size": 943718400 },
    "old": { "count": 4, "size": 1321205760 }
  },
  "topBySize": [...],
  "topByAge": [...]
}
```

## Use Cases

### Weekly Report Script

```bash
#!/bin/bash
# Save weekly report to file
node-janitor report --json > ~/reports/node-modules-$(date +%Y%m%d).json
```

### Monitoring Dashboard

Pipe JSON output to monitoring tools:

```bash
node-janitor report --json | jq '.totalSize' | send-to-prometheus
```
