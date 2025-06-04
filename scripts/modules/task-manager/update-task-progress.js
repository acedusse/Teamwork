import { readJSON, writeJSON } from '../utils.js';

/**
 * Update task progress percentage.
 * @param {string} tasksPath Path to tasks.json
 * @param {number|string} taskId Task ID
 * @param {number} progress Progress value 0-100
 * @returns {Object} Updated task
 */
export default function updateTaskProgress(tasksPath, taskId, progress) {
  const data = readJSON(tasksPath) || { tasks: [] };
  const id = parseInt(taskId, 10);
  if (!id) throw new Error('Invalid task id');
  const task = data.tasks.find((t) => t.id === id);
  if (!task) throw new Error(`Task ${taskId} not found`);
  const value = Number(progress);
  if (Number.isNaN(value) || value < 0 || value > 100) {
    throw new Error('Progress must be between 0 and 100');
  }
  task.progress = value;
  if (value === 100) task.status = 'done';
  else if (task.status === 'pending') task.status = 'in-progress';
  writeJSON(tasksPath, data);
  return task;
}
