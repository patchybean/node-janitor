import inquirer from 'inquirer';
import type { NodeModulesInfo } from '../types/index.js';
import { formatBytes } from '../utils/formatter.js';

/**
 * Prompt for scan path
 */
export async function promptPath(defaultPath: string): Promise<string> {
    const { path } = await inquirer.prompt([
        {
            type: 'input',
            name: 'path',
            message: '📂 Bạn muốn quét ở đâu?',
            default: defaultPath,
        },
    ]);
    return path;
}

/**
 * Prompt for age filter
 */
export async function promptAge(): Promise<string | undefined> {
    const { age } = await inquirer.prompt([
        {
            type: 'input',
            name: 'age',
            message: '📅 Chỉ xóa folder cũ hơn bao nhiêu ngày? (Enter = tất cả)',
            default: '',
        },
    ]);
    return age ? `${age}d` : undefined;
}

/**
 * Prompt for confirmation
 */
export async function promptConfirm(
    message: string,
    defaultValue = false
): Promise<boolean> {
    const { confirmed } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirmed',
            message,
            default: defaultValue,
        },
    ]);
    return confirmed;
}

/**
 * Prompt to view list
 */
export async function promptViewList(): Promise<boolean> {
    return promptConfirm('👀 Bạn có muốn xem danh sách?', true);
}

/**
 * Prompt to delete
 */
export async function promptDelete(count: number, size: number): Promise<boolean> {
    return promptConfirm(
        `🗑️  Xóa ${count} folders (${formatBytes(size)})?`,
        false
    );
}

/**
 * Prompt for folder selection
 */
export async function promptSelectFolders(
    folders: NodeModulesInfo[]
): Promise<NodeModulesInfo[]> {
    const choices = folders.map((folder, index) => ({
        name: `${folder.projectPath} (${formatBytes(folder.size)}, ${folder.ageDays}d)`,
        value: index,
        checked: true,
    }));

    const { selected } = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'selected',
            message: '📋 Chọn folders để xóa:',
            choices,
            pageSize: 15,
        },
    ]);

    return selected.map((i: number) => folders[i]);
}

/**
 * Prompt for action selection
 */
export async function promptAction(): Promise<'scan' | 'clean' | 'deep-clean' | 'report' | 'exit'> {
    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: '🎯 Bạn muốn làm gì?',
            choices: [
                { name: '🔍 Quét và xem danh sách node_modules', value: 'scan' },
                { name: '🧹 Xóa node_modules', value: 'clean' },
                { name: '🧼 Deep clean (xóa file rác)', value: 'deep-clean' },
                { name: '📊 Xem báo cáo', value: 'report' },
                { name: '👋 Thoát', value: 'exit' },
            ],
        },
    ]);
    return action;
}

export default {
    promptPath,
    promptAge,
    promptConfirm,
    promptViewList,
    promptDelete,
    promptSelectFolders,
    promptAction,
};
