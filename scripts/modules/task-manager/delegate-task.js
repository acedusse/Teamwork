import { readJSON, writeJSON } from '../utils.js';

/**
 * Assign an available agent to a task with minimal workload.
 * @param {string} tasksPath Path to tasks.json
 * @param {string} agentsPath Path to agents.json
 * @param {number|string} taskId ID of the task to assign
 * @returns {Object} Updated task object
 */
export default function delegateTask(tasksPath, agentsPath, taskId) {
  const data = readJSON(tasksPath) || { tasks: [] };
  const agentsData = readJSON(agentsPath) || { agents: [] };
  const id = parseInt(taskId, 10);
  if (!id) throw new Error('Invalid task id');
  const task = data.tasks.find((t) => t.id === id);
  if (!task) throw new Error(`Task ${taskId} not found`);
  const agents = agentsData.agents || [];
  if (!agents.length) throw new Error('No agents available');
  const workload = Object.fromEntries(agents.map((a) => [a.name, 0]));
  for (const t of data.tasks) {
    if (t.agent && workload[t.agent] !== undefined && t.status !== 'done') {
      workload[t.agent] += 1;
    }
  }
  let chosen = null;
  for (const a of agents) {
    if (a.status !== 'available') continue;
    if (!chosen || workload[a.name] < workload[chosen.name]) chosen = a;
  }
  if (!chosen) throw new Error('No available agents');
  task.agent = chosen.name;
  if (task.status === 'pending') task.status = 'in-progress';
  writeJSON(tasksPath, data);
  return task;
}
