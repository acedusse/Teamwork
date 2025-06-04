import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { LRUCache } from 'lru-cache';
import { readJSON } from '../../scripts/modules/utils.js';
import { success } from '../utils/response.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TASKS_FILE =
  process.env.TASKS_FILE ||
  path.join(__dirname, '../../.taskmaster/tasks/tasks.json');

const cache = new LRUCache({ max: 50, ttl: 1000 * 60 });

function loadTasks() {
  const data = readJSON(TASKS_FILE) || { tasks: [] };
  return Array.isArray(data.tasks) ? data.tasks : [];
}

function computeCounts(tasks) {
  const counts = {};
  for (const task of tasks) {
    const status = task.status || 'unknown';
    counts[status] = (counts[status] || 0) + 1;
  }
  return counts;
}

function getStatusData() {
  const cached = cache.get('status');
  if (cached) return cached;
  const tasks = loadTasks();
  const counts = computeCounts(tasks);
  const data = {
    total: tasks.length,
    completed: counts.done || 0,
    pending: counts.pending || 0,
    inProgress: counts['in-progress'] || 0,
    blocked: counts.blocked || 0,
    deferred: counts.deferred || 0,
    cancelled: counts.cancelled || 0,
  };
  cache.set('status', data);
  return data;
}

function getMetricsData() {
  const cached = cache.get('metrics');
  if (cached) return cached;
  const tasks = loadTasks();
  const counts = computeCounts(tasks);
  const completed = counts.done || 0;
  const total = tasks.length || 1;
  const data = {
    byStatus: counts,
    completionRate: completed / total,
  };
  cache.set('metrics', data);
  return data;
}

router.get('/status', (req, res, next) => {
  try {
    const data = getStatusData();
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});

router.get('/metrics', (req, res, next) => {
  try {
    const data = getMetricsData();
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});

router.get('/health', (_req, res) => {
  res.json(success({ status: 'ok' }));
});

export default router;
