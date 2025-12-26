# Configuration

Node Janitor supports configuration files for persistent settings.

## Config File Locations

Node Janitor looks for config files in this order:

1. `--config <path>` - Custom path via CLI
2. `.janitorrc` - Current directory
3. `.janitorrc.json` - Current directory
4. `~/.janitorrc` - Home directory
5. `~/.janitorrc.json` - Home directory
6. `~/.config/node-janitor/config.json` - XDG config

## Config File Format

```json
{
  "defaultPath": "~/projects",
  "defaultOlderThan": "30d",
  "depth": 5,
  "exclude": ["important-project", "client-*"],
  "include": [],
  "backup": true,
  "fast": true,
  "skipDirtyGit": true,
  "lang": "en"
}
```

## Options

| Option | Type | Description |
|--------|------|-------------|
| `defaultPath` | `string` | Default scan path |
| `defaultOlderThan` | `string` | Default age filter |
| `depth` | `number` | Maximum scan depth |
| `exclude` | `string[]` | Exclude patterns |
| `include` | `string[]` | Include patterns |
| `backup` | `boolean` | Always create backup |
| `fast` | `boolean` | Use fast mode |
| `skipDirtyGit` | `boolean` | Skip dirty repos |
| `gitOnly` | `boolean` | Only git repos |
| `lang` | `string` | Language code |

## Examples

### Minimal Config

```json
{
  "defaultPath": "~/projects",
  "defaultOlderThan": "30d"
}
```

### Development Machine

```json
{
  "defaultPath": "~/code",
  "defaultOlderThan": "60d",
  "exclude": ["work", "client-*"],
  "skipDirtyGit": true,
  "backup": true,
  "lang": "en"
}
```

### CI/CD Agent

```json
{
  "defaultPath": "/ci/workspaces",
  "defaultOlderThan": "7d",
  "fast": true,
  "depth": 3
}
```

## CLI Override

CLI options always override config file:

```bash
# Config has defaultOlderThan: "30d"
# But CLI overrides to 60d
node-janitor --older-than 60d
```

## Custom Config Path

```bash
node-janitor --config ~/.my-janitor-config.json
```

## Environment Variables

You can also set defaults via environment variables:

```bash
export NODE_JANITOR_PATH=~/projects
export NODE_JANITOR_OLDER_THAN=30d
export NODE_JANITOR_LANG=vi
```
