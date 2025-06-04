import path from 'path';
import { fileURLToPath } from 'url';
import { readJSON, writeJSON } from '../../scripts/modules/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const AGENTS_FILE =
  process.env.AGENTS_FILE ||
  path.join(__dirname, '../../.taskmaster/agents.json');

export const TASKS_FILE =
  process.env.TASKS_FILE ||
  path.join(__dirname, '../../.taskmaster/tasks/tasks.json');

export function loadAgents() {
  const data = readJSON(AGENTS_FILE) || { agents: [] };
  return Array.isArray(data.agents) ? data.agents : [];
}

export function saveAgents(agents) {
  writeJSON(AGENTS_FILE, { agents });
}

export function loadTasks() {
  const data = readJSON(TASKS_FILE) || { tasks: [] };
  return Array.isArray(data.tasks) ? data.tasks : [];
}

export function assignAgent(tasks, agents) {
  if (!agents.length) return null;
  const workload = Object.fromEntries(agents.map((a) => [a.name, 0]));
  for (const t of tasks) {
    if (t.agent && workload[t.agent] !== undefined && t.status !== 'done') {
      workload[t.agent] += 1;
    }
  }
  let chosen = null;
  for (const agent of agents) {
    if (agent.status !== 'available') continue;
    if (!chosen || workload[agent.name] < workload[chosen.name]) {
      chosen = agent;
    }
  }
  return chosen ? chosen.name : null;
}

export function computeMetrics(agents, tasks) {
  const metrics = agents.map((a) => ({
    name: a.name,
    available: a.status === 'available',
    assigned: 0,
    completed: 0,
  }));
  const map = Object.fromEntries(metrics.map((m) => [m.name, m]));
  for (const t of tasks) {
    if (!t.agent || !map[t.agent]) continue;
    map[t.agent].assigned += 1;
    if (t.status === 'done') {
      map[t.agent].completed += 1;
    }
  }
  return metrics;
}
