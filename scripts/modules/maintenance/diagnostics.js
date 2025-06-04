import path from 'path';
import { readJSON, findProjectRoot } from '../utils.js';
import { TASKMASTER_TASKS_FILE } from '../../../src/constants/paths.js';

/**
 * Generate simple statistics about the tasks database.
 * @param {string|null} tasksPath - Optional path to tasks.json
 * @returns {{total:number,statuses:Object}}
 */
export function runDiagnostics(tasksPath = null) {
    const projectRoot = findProjectRoot() || process.cwd();
    const file = tasksPath || path.join(projectRoot, TASKMASTER_TASKS_FILE);
    const data = readJSON(file);
    if (!data || !Array.isArray(data.tasks)) {
        throw new Error(`Invalid tasks file at ${file}`);
    }
    const counts = {};
    for (const t of data.tasks) {
        counts[t.status] = (counts[t.status] || 0) + 1;
    }
    return { total: data.tasks.length, statuses: counts };
}
