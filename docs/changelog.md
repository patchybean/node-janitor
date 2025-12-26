# Changelog

All notable changes to Node Janitor are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2024-12-26

### Added

- 🖥️ **Interactive TUI Mode** - Full-screen, keyboard-navigable interface
  - New `--live` flag and `tui` subcommand
  - Arrow keys / j/k navigation
  - Multi-select with Space bar
  - Select all with 'A'
  - Sort toggle (size/age) with 'S'
  - Color-coded age display (green, yellow, red)
- 📚 **ReadTheDocs Documentation** - Comprehensive docs with Material theme
- 📊 **Performance Benchmarks** - Verify and compare performance

### Changed

- ⚡ **3x Faster Scanning** - Native `find` command + parallel metadata collection
  - 10 folders: 124ms (was 293ms)
  - 25 folders: 135ms (was 409ms)
  - 50 folders: 152ms (was 695ms)
- Improved test coverage to 90%+
- Refactored schedule and watch commands for better testability

---

## [1.1.0] - 2024-12-17

### Added

- 🔄 **Watch Mode** - Continuously monitor directories
  - Configurable scan interval
  - Auto-clean option
  - Age filtering
- 📅 **Scheduled Cleanup** - Cron-style automation
  - Preset schedules (daily, weekly, monthly)
  - Custom cron expressions
  - Dry run support
- ⚙️ **Config File Support** - Persistent settings
  - `.janitorrc` in home or project directory
  - JSON format configuration
  - CLI override support
- 🔀 **Git-aware Cleanup**
  - `--skip-dirty-git` to skip repos with uncommitted changes
  - `--git-only` to only process git repositories
- 🌍 **Multi-language Support** - 8 languages
  - English, Vietnamese, Chinese, Japanese
  - Korean, Spanish, French, German

### Changed

- Improved scanning performance
- Better error handling and messages

---

## [1.0.0] - 2024-12-10

### Added

- 🔍 **Smart Scanner** - Find all node_modules folders
  - Depth limit support
  - Pattern matching (exclude/include)
  - Quick scan mode
- ⏰ **Time-based Cleanup**
  - `--older-than` filter
  - `--between` range filter
- 📏 **Size Filters**
  - `--min-size` and `--max-size`
- 🧼 **Deep Clean Mode**
  - Remove docs, tests, source maps
  - ~40% additional space savings
- 👁️ **Dry Run** - Preview before deleting
- 🎮 **Interactive Mode** - Step-by-step wizard
- 💾 **Backup** - Save list before deletion
- 📊 **Reports** - Detailed analytics
  - Age breakdown
  - Size analysis
  - JSON output
- ⚡ **Fast Mode** - Native OS commands
- 🔄 **Parallel Deletion** - Concurrent cleanup
- 🤖 **CI/CD Ready**
  - Silent mode
  - JSON output
  - Exit codes

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 1.2.0 | 2024-12-26 | TUI Mode, 3x Faster, Documentation |
| 1.1.0 | 2024-12-17 | Watch, Schedule, Config, i18n, Git-aware |
| 1.0.0 | 2024-12-10 | Initial release |

---

## Migration Guides

### 1.0.x → 1.1.x

No breaking changes. New features are additive.

### 1.1.x → 1.2.x

No breaking changes. New `--live` flag and `tui` subcommand are optional.

---

## Roadmap

Planned features for future releases:

- [ ] `--restore` from backup
- [ ] History/Log command
- [ ] Profile presets (aggressive, safe)
- [ ] `.janitorignore` file
- [ ] Shell completion (bash, zsh, fish)
- [ ] Plugin system
