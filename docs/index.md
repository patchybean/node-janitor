---
hide:
  - navigation
  - toc
---

# 🧹 Node Janitor

<div class="hero" markdown>

**Smart CLI tool to clean up `node_modules` folders - free up disk space automatically**

[Get Started :material-rocket-launch:](quickstart.md){ .md-button .md-button--primary }
[View on GitHub :material-github:](https://github.com/patchybean/node-janitor){ .md-button }

</div>

---

## ✨ Features

<div class="grid cards" markdown>

-   :material-magnify:{ .lg .middle } **Smart Scanner**

    ---

    Find all `node_modules` folders across your entire system with depth control and pattern matching.

-   :material-clock-outline:{ .lg .middle } **Time-based Cleanup**

    ---

    Delete folders older than X days. Perfect for cleaning up abandoned projects.

-   :material-broom:{ .lg .middle } **Deep Clean**

    ---

    Remove unnecessary files (docs, tests, source maps) without deleting the entire folder.

-   :material-monitor:{ .lg .middle } **Interactive TUI**

    ---

    Full-screen, keyboard-navigable interface with multi-select and color-coded display.

-   :material-clock-fast:{ .lg .middle } **Watch Mode**

    ---

    Continuously monitor directories and auto-clean when folders exceed age threshold.

-   :material-calendar-clock:{ .lg .middle } **Scheduled Cleanup**

    ---

    Cron-style scheduling for automated maintenance. Set it and forget it!

-   :material-git:{ .lg .middle } **Git-aware**

    ---

    Skip repositories with uncommitted changes. Never lose unsaved work.

-   :material-translate:{ .lg .middle } **Multi-language**

    ---

    8 languages supported: English, Vietnamese, Chinese, Japanese, Korean, Spanish, French, German.

</div>

---

## 🚀 Quick Example

```bash
# Install globally
npm install -g node-janitor

# Scan and preview
node-janitor --path ~/projects --dry-run

# Delete folders older than 30 days
node-janitor --older-than 30d

# Interactive TUI mode
node-janitor --live
```

---

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
└───────────────┴──────────┘
```

---

## 📦 Installation

=== "npm"

    ```bash
    npm install -g node-janitor
    ```

=== "npx"

    ```bash
    npx node-janitor
    ```

---

## 🌟 Why Node Janitor?

| Feature | Node Janitor | npkill | node-prune |
|---------|:------------:|:------:|:----------:|
| Interactive TUI | ✅ | ✅ | ❌ |
| Deep Clean | ✅ | ❌ | ✅ |
| Watch Mode | ✅ | ❌ | ❌ |
| Scheduled Cleanup | ✅ | ❌ | ❌ |
| Git-aware | ✅ | ❌ | ❌ |
| Multi-language | ✅ | ❌ | ❌ |
| Config File | ✅ | ❌ | ❌ |
| CI/CD Ready | ✅ | ❌ | ✅ |

---

<div class="footer-cta" markdown>

**Ready to free up some disk space?**

[Get Started →](quickstart.md){ .md-button .md-button--primary }

</div>
