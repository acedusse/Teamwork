import { readJSON, writeJSON } from '../utils.js';

/**
 * Append feedback from an agent on a task.
 * @param {string} tasksPath Path to tasks.json
 * @param {number|string} taskId Task ID
 * @param {string} agent Agent name
 * @param {string} message Feedback message
 * @returns {Object} Updated task
 */
export default function addAgentFeedback(tasksPath, taskId, agent, message) {
  const data = readJSON(tasksPath) || { tasks: [] };
  const id = parseInt(taskId, 10);
  if (!id) throw new Error('Invalid task id');
  const task = data.tasks.find((t) => t.id === id);
  if (!task) throw new Error(`Task ${taskId} not found`);
  if (!agent) throw new Error('Agent required');
  if (!message) throw new Error('Feedback message required');
  if (!task.feedback) task.feedback = [];
  task.feedback.push({ agent, message, timestamp: new Date().toISOString() });
  writeJSON(tasksPath, data);
  return task;
}
