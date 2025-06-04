import { readJSON } from '../utils.js';

/**
 * Generate a JSON sprint report summarizing tasks in a sprint.
 * @param {string} tasksPath
 * @param {number|string} sprintId
 * @returns {object}
 */
function generateSprintReport(tasksPath, sprintId) {
    const data = readJSON(tasksPath);
    if (!data || !Array.isArray(data.tasks)) {
        throw new Error(`No valid tasks found in ${tasksPath}`);
    }
    const tasks = data.tasks.filter(t => t.sprint === sprintId);
    const done = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
    return {
        sprint: sprintId,
        summary: { total: tasks.length, completed: done },
        tasks
    };
}

export default generateSprintReport;
