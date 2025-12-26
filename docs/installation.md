# Installation

## Requirements

- **Node.js** >= 18.0.0
- **npm**, **yarn**, or **pnpm**

## Global Installation

The recommended way to install Node Janitor is globally:

=== "npm"

    ```bash
    npm install -g node-janitor
    ```

=== "yarn"

    ```bash
    yarn global add node-janitor
    ```

=== "pnpm"

    ```bash
    pnpm add -g node-janitor
    ```

After installation, you can use either command:

```bash
node-janitor --help
nj --help  # Short alias
```

## Using npx (No Installation)

If you prefer not to install globally, use npx:

```bash
npx node-janitor --path ~/projects
```

This will download and run the latest version without permanent installation.

## Verify Installation

Check that Node Janitor is installed correctly:

```bash
node-janitor --version
```

You should see output like:

```
1.1.0
```

## Updating

To update to the latest version:

=== "npm"

    ```bash
    npm update -g node-janitor
    ```

=== "yarn"

    ```bash
    yarn global upgrade node-janitor
    ```

=== "pnpm"

    ```bash
    pnpm update -g node-janitor
    ```

## Uninstalling

To remove Node Janitor:

=== "npm"

    ```bash
    npm uninstall -g node-janitor
    ```

=== "yarn"

    ```bash
    yarn global remove node-janitor
    ```

=== "pnpm"

    ```bash
    pnpm remove -g node-janitor
    ```

---

## Next Steps

Now that you have Node Janitor installed, check out the [Quick Start](quickstart.md) guide to learn basic usage.
