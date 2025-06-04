import path from 'path';
import { readJSON, writeJSON, findProjectRoot, log } from '../utils.js';
import { TASKMASTER_TASKS_FILE } from '../../../src/constants/paths.js';

/**
 * Remove completed tasks from tasks.json.
 * @param {string|null} tasksPath - Optional path to tasks.json
 * @returns {{removed:number, path:string}}
 */
export function cleanupDatabase(tasksPath = null) {
    const projectRoot = findProjectRoot() || process.cwd();
    const file = tasksPath || path.join(projectRoot, TASKMASTER_TASKS_FILE);
    const data = readJSON(file);
    if (!data || !Array.isArray(data.tasks)) {
        throw new Error(`Invalid tasks file at ${file}`);
    }
    const originalCount = data.tasks.length;
    data.tasks = data.tasks.filter((t) => t.status !== 'done');
    writeJSON(file, data);
    const removed = originalCount - data.tasks.length;
    log('info', `Removed ${removed} completed tasks`);
    return { removed, path: file };
}
