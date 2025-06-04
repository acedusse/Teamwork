import fs from 'fs';
import path from 'path';
import { findProjectRoot } from '../utils.js';
import { TASKMASTER_TASKS_FILE } from '../../../src/constants/paths.js';

/**
 * Create a timestamped backup of tasks.json.
 * @param {string|null} tasksPath - Optional path to tasks.json
 * @returns {string} Path to the backup file
 */
export function backupDatabase(tasksPath = null) {
    const projectRoot = findProjectRoot() || process.cwd();
    const file = tasksPath || path.join(projectRoot, TASKMASTER_TASKS_FILE);
    if (!fs.existsSync(file)) {
        throw new Error(`Tasks file not found at ${file}`);
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${file}.${timestamp}.bak`;
    fs.copyFileSync(file, backupPath);
    return backupPath;
}
