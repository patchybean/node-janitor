# Interactive TUI Mode

Node Janitor features a full-screen, keyboard-navigable interface similar to [npkill](https://github.com/voidcosmos/npkill).

## Starting TUI Mode

=== "Using --live flag"

    ```bash
    node-janitor --live
    ```

=== "Using tui subcommand"

    ```bash
    node-janitor tui --path ~/projects
    ```

## Interface

```
┌──────────────────────────────────────────────────────────────────┐
│  🧹 NODE JANITOR - Interactive Mode | ~/projects                  │
├──────────────────────────────────────────────────────────────────┤
│  📊 Found: 15 folders | Total: 2.5 GB | Selected: 3 (523 MB)     │
├──────────────────────────────────────────────────────────────────┤
│  > ■ ~/projects/old-app/node_modules          523 MB    180 days │
│    □ ~/projects/test-project/node_modules     312 MB     95 days │
│    ■ ~/projects/archived/node_modules         245 MB     45 days │
│    □ ~/projects/client-work/node_modules      198 MB     30 days │
│    □ ~/projects/demo/node_modules              89 MB     15 days │
├──────────────────────────────────────────────────────────────────┤
│  [↑/↓] Navigate  [SPACE] Select  [A] All  [S] Sort  [D] Delete   │
└──────────────────────────────────────────────────────────────────┘
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` / `k` | Move up |
| `↓` / `j` | Move down |
| `Space` | Select/Deselect current item |
| `A` | Select all / Deselect all |
| `S` | Toggle sort (size ↔ age) |
| `D` | Delete selected folders |
| `Q` / `Esc` | Exit TUI |

## Features

### Color-coded Age

Folders are color-coded by age:

- 🟢 **Green** - New (< 30 days)
- 🟡 **Yellow** - Medium (30-90 days)
- 🔴 **Red** - Old (> 90 days)

### Multi-select

Select multiple folders using `Space`, then delete them all at once with `D`.

### Real-time Stats

The status bar shows:

- Total folders found
- Total size of all folders
- Number of selected folders
- Size of selected folders
- Current sort mode

### Sorting

Press `S` to toggle between:

- **Size** - Largest folders first
- **Age** - Oldest folders first

## Options

```bash
node-janitor tui [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Directory to scan | Current directory |
| `-d, --depth <n>` | Maximum scan depth | Unlimited |

## Tips

!!! tip "Quick Selection"
    Press `A` to select all folders, then use `Space` to deselect the ones you want to keep.

!!! warning "No Undo"
    Deleted folders cannot be recovered. Use the standard command with `--dry-run` and `--backup` if you need those features.
