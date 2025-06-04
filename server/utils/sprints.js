import path from 'path';
import { fileURLToPath } from 'url';
import { readJSON, writeJSON } from '../../scripts/modules/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SPRINTS_FILE =
  process.env.SPRINTS_FILE ||
  path.join(__dirname, '../../.taskmaster/sprints.json');

export const TASKS_FILE =
  process.env.TASKS_FILE ||
  path.join(__dirname, '../../.taskmaster/tasks/tasks.json');

export function loadSprints() {
  const data = readJSON(SPRINTS_FILE) || { sprints: [] };
  return Array.isArray(data.sprints) ? data.sprints : [];
}

export function saveSprints(sprints) {
  writeJSON(SPRINTS_FILE, { sprints });
}

export function loadTasks() {
  const data = readJSON(TASKS_FILE) || { tasks: [] };
  return Array.isArray(data.tasks) ? data.tasks : [];
}

export function autoPlan(sprints, sprintId, limit = 5) {
  const idx = sprints.findIndex((s) => s.id === sprintId);
  if (idx === -1) return null;
  const tasks = loadTasks();
  const unassigned = tasks.filter((t) => t.status !== 'done');
  sprints[idx].tasks = unassigned.slice(0, limit).map((t) => t.id);
  return sprints[idx];
}

export function computeMetrics(sprints) {
  const tasks = loadTasks();
  return sprints.map((s) => {
    const ids = Array.isArray(s.tasks) ? s.tasks : [];
    const total = ids.length;
    const completed = ids.reduce((acc, id) => {
      const t = tasks.find((t) => t.id === id);
      return acc + (t && t.status === 'done' ? 1 : 0);
    }, 0);
    return { id: s.id, name: s.name, total, completed };
  });
}
