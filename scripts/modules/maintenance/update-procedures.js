import path from 'path';
import { readJSON, writeJSON, findProjectRoot } from '../utils.js';
import { TASKMASTER_TASKS_FILE } from '../../../src/constants/paths.js';

/**
 * Ensure each task contains a createdAt field.
 * @param {string|null} tasksPath - Optional path to tasks.json
 * @returns {{updated:boolean,path:string}}
 */
export function runUpdate(tasksPath = null) {
    const projectRoot = findProjectRoot() || process.cwd();
    const file = tasksPath || path.join(projectRoot, TASKMASTER_TASKS_FILE);
    const data = readJSON(file);
    if (!data || !Array.isArray(data.tasks)) {
        throw new Error(`Invalid tasks file at ${file}`);
    }
    let changed = false;
    const now = new Date().toISOString();
    for (const task of data.tasks) {
        if (!task.createdAt) {
            task.createdAt = now;
            changed = true;
        }
    }
    if (changed) {
        writeJSON(file, data);
    }
    return { updated: changed, path: file };
}
