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

function getVelocityData(days = 7) {
  const key = `velocity-${days}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const tasks = loadTasks();
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - (days - 1));
  const map = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const keyDate = d.toISOString().slice(0, 10);
    map[keyDate] = 0;
  }
  for (const t of tasks) {
    if (!t.completedAt) continue;
    const d = t.completedAt.slice(0, 10);
    if (d in map) map[d]++;
  }
  const data = Object.entries(map).map(([date, count]) => ({ date, count }));
  cache.set(key, data);
  return data;
}

function getBurndownData(days = 7) {
  const key = `burndown-${days}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const tasks = loadTasks();
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - (days - 1));
  let remaining = tasks.length;
  const data = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const completedToday = tasks.filter(
      (t) => t.completedAt && t.completedAt.slice(0, 10) === dateStr
    ).length;
    remaining -= completedToday;
    data.push({ date: dateStr, remaining });
  }
  cache.set(key, data);
  return data;
}

function getProgressData() {
  const metrics = getMetricsData();
  return { completionRate: metrics.completionRate };
}

function getTeamPerformanceData() {
  const cached = cache.get('team');
  if (cached) return cached;
  const tasks = loadTasks();
  const team = {};
  for (const t of tasks) {
    const agent = t.agent || 'Unassigned';
    if (!team[agent]) team[agent] = { completed: 0, total: 0 };
    team[agent].total++;
    if (t.status === 'done') team[agent].completed++;
  }
  cache.set('team', team);
  return team;
}

function getTrendData(days = 30) {
  const key = `trends-${days}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const tasks = loadTasks();
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - (days - 1));
  const map = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const keyDate = d.toISOString().slice(0, 10);
    map[keyDate] = { created: 0, completed: 0 };
  }
  for (const t of tasks) {
    if (t.createdAt) {
      const d = t.createdAt.slice(0, 10);
      if (map[d]) map[d].created++;
    }
    if (t.completedAt) {
      const d = t.completedAt.slice(0, 10);
      if (map[d]) map[d].completed++;
    }
  }
  const data = Object.entries(map).map(([date, val]) => ({ date, ...val }));
  cache.set(key, data);
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

router.get('/velocity', (req, res, next) => {
  try {
    const data = getVelocityData();
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});

router.get('/burndown', (req, res, next) => {
  try {
    const data = getBurndownData();
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});

router.get('/progress', (req, res, next) => {
  try {
    const data = getProgressData();
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});

router.get('/team-performance', (req, res, next) => {
  try {
    const data = getTeamPerformanceData();
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});

router.get('/trends', (req, res, next) => {
  try {
    const data = getTrendData();
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});

router.get('/health', (_req, res) => {
  res.json(success({ status: 'ok' }));
});

export default router;
