import fs from 'fs';
import { readJSON } from '../utils.js';

/**
 * Export tasks to CSV or JSON.
 * @param {string} tasksPath
 * @param {string} outputPath
 * @param {string} format
 * @returns {string}
 */
function exportTasks(tasksPath, outputPath, format = 'csv') {
    const data = readJSON(tasksPath);
    if (!data || !Array.isArray(data.tasks)) {
        throw new Error(`No valid tasks found in ${tasksPath}`);
    }

    if (format === 'json') {
        fs.writeFileSync(outputPath, JSON.stringify(data.tasks, null, 2), 'utf8');
    } else {
        const headers = Object.keys(data.tasks[0] || {});
        const rows = [headers.join(',')];
        for (const task of data.tasks) {
            rows.push(headers.map(h => JSON.stringify(task[h] ?? '')).join(','));
        }
        fs.writeFileSync(outputPath, rows.join('\n'), 'utf8');
    }
    return outputPath;
}

export default exportTasks;
