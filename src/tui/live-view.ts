import blessed from 'blessed';
import { scanNodeModules, calculateTotals } from '../core/scanner.js';
import { cleanNodeModules } from '../core/cleaner.js';
import { formatBytes } from '../utils/formatter.js';
import type { NodeModulesInfo } from '../types/index.js';

export interface LiveViewOptions {
    path: string;
    depth?: number;
}

interface FolderItem {
    folder: NodeModulesInfo;
    selected: boolean;
}

/**
 * Start the interactive live TUI mode
 */
export async function startLiveView(options: LiveViewOptions): Promise<void> {
    const screen = blessed.screen({
        smartCSR: true,
        title: 'Node Janitor - Interactive Mode',
        fullUnicode: true,
    });

    let folders: FolderItem[] = [];
    let currentIndex = 0;
    let isScanning = true;
    let isDeleting = false;
    let totalSize = 0;
    let sortBy: 'size' | 'age' = 'size';

    // Header box
    const header = blessed.box({
        top: 0,
        left: 0,
        width: '100%',
        height: 3,
        content: ' 🧹 NODE JANITOR - Interactive Mode',
        tags: true,
        style: {
            fg: 'white',
            bg: 'blue',
            bold: true,
        },
    });

    // Status bar (below header)
    const statusBar = blessed.box({
        top: 3,
        left: 0,
        width: '100%',
        height: 1,
        content: ' Scanning...',
        tags: true,
        style: {
            fg: 'black',
            bg: 'cyan',
        },
    });

    // Main list
    const list = blessed.list({
        top: 4,
        left: 0,
        width: '100%',
        height: '100%-7',
        items: ['  Scanning...'],
        tags: true,
        keys: true,
        vi: true,
        mouse: true,
        scrollable: true,
        alwaysScroll: true,
        scrollbar: {
            ch: '█',
            style: {
                bg: 'blue',
            },
        },
        style: {
            fg: 'white',
            bg: 'black',
            selected: {
                fg: 'black',
                bg: 'white',
            },
        },
    });

    // Help bar (bottom)
    const helpBar = blessed.box({
        bottom: 0,
        left: 0,
        width: '100%',
        height: 3,
        content: ' {cyan-fg}↑/↓{/} Navigate  {cyan-fg}SPACE{/} Select  {cyan-fg}A{/} Select All  {cyan-fg}S{/} Sort  {cyan-fg}D{/} Delete  {cyan-fg}Q/ESC{/} Exit',
        tags: true,
        style: {
            fg: 'white',
            bg: 'gray',
        },
    });

    // Append elements
    screen.append(header);
    screen.append(statusBar);
    screen.append(list);
    screen.append(helpBar);

    // Update the display
    function updateDisplay(): void {
        // Update header with path
        header.setContent(` 🧹 NODE JANITOR - Interactive Mode | ${options.path}`);

        // Update status
        const selectedCount = folders.filter(f => f.selected).length;
        const selectedSize = folders
            .filter(f => f.selected)
            .reduce((sum, f) => sum + f.folder.size, 0);

        let status = '';
        if (isScanning) {
            status = ` 🔍 Scanning... Found: ${folders.length} folders | Total: ${formatBytes(totalSize)}`;
        } else if (isDeleting) {
            status = ' 🗑️  Deleting selected folders...';
        } else {
            status = ` 📊 Found: ${folders.length} folders | Total: ${formatBytes(totalSize)}`;
            if (selectedCount > 0) {
                status += ` | Selected: ${selectedCount} (${formatBytes(selectedSize)})`;
            }
            status += ` | Sort: ${sortBy}`;
        }
        statusBar.setContent(status);

        // Update list items
        const items = folders.map((item, index) => {
            const checkbox = item.selected ? '■' : '□';
            const pointer = index === currentIndex ? '>' : ' ';

            // Color by age
            let ageColor = 'green';
            if (item.folder.ageDays >= 90) {
                ageColor = 'red';
            } else if (item.folder.ageDays >= 30) {
                ageColor = 'yellow';
            }

            // Truncate path if needed
            const maxPathLen = (screen.width as number) - 40;
            let pathDisplay = item.folder.projectPath;
            if (pathDisplay.length > maxPathLen) {
                pathDisplay = '...' + pathDisplay.slice(-maxPathLen + 3);
            }

            return ` ${pointer} ${checkbox} ${pathDisplay.padEnd(maxPathLen)} {white-fg}${formatBytes(item.folder.size).padStart(10)}{/}  {${ageColor}-fg}${String(item.folder.ageDays).padStart(4)}d{/}`;
        });

        if (items.length === 0) {
            list.setItems(['  No node_modules folders found']);
        } else {
            list.setItems(items);
            list.select(currentIndex);
        }

        screen.render();
    }

    // Sort folders
    function sortFolders(): void {
        folders.sort((a, b) => {
            if (sortBy === 'size') {
                return b.folder.size - a.folder.size;
            }
            return b.folder.ageDays - a.folder.ageDays;
        });
    }

    // Key bindings
    list.on('keypress', (_ch: string, key: blessed.Widgets.Events.IKeyEventArg) => {
        if (isDeleting) return;

        if (key.name === 'up' || key.name === 'k') {
            currentIndex = Math.max(0, currentIndex - 1);
            updateDisplay();
        } else if (key.name === 'down' || key.name === 'j') {
            currentIndex = Math.min(folders.length - 1, currentIndex + 1);
            updateDisplay();
        } else if (key.name === 'space') {
            if (folders[currentIndex]) {
                folders[currentIndex].selected = !folders[currentIndex].selected;
                updateDisplay();
            }
        }
    });

    screen.key(['a'], () => {
        if (isDeleting || isScanning) return;
        const allSelected = folders.every(f => f.selected);
        folders.forEach(f => f.selected = !allSelected);
        updateDisplay();
    });

    screen.key(['s'], () => {
        if (isDeleting || isScanning) return;
        sortBy = sortBy === 'size' ? 'age' : 'size';
        sortFolders();
        updateDisplay();
    });

    screen.key(['d'], async () => {
        if (isDeleting || isScanning) return;

        const selected = folders.filter(f => f.selected);
        if (selected.length === 0) return;

        isDeleting = true;
        updateDisplay();

        try {
            const foldersToDelete = selected.map(s => s.folder);
            const result = await cleanNodeModules(foldersToDelete, { fast: true });

            // Remove deleted folders from list
            folders = folders.filter(f => !f.selected);
            totalSize = folders.reduce((sum, f) => sum + f.folder.size, 0);
            currentIndex = Math.min(currentIndex, folders.length - 1);

            // Show result
            statusBar.setContent(` ✅ Deleted ${result.deletedCount} folders, freed ${formatBytes(result.freedBytes)}`);
        } catch (error) {
            statusBar.setContent(` ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        isDeleting = false;
        updateDisplay();
    });

    screen.key(['escape', 'q', 'C-c'], () => {
        screen.destroy();
        process.exit(0);
    });

    list.focus();
    updateDisplay();

    // Start scanning
    try {
        const scannedFolders = await scanNodeModules({
            path: options.path,
            depth: options.depth,
            quick: false,
        });

        folders = scannedFolders.map(folder => ({
            folder,
            selected: false,
        }));

        totalSize = calculateTotals(scannedFolders).totalSize;
        sortFolders();
        isScanning = false;
        updateDisplay();
    } catch (error) {
        isScanning = false;
        statusBar.setContent(` ❌ Scan error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        screen.render();
    }
}

export default {
    startLiveView,
};
