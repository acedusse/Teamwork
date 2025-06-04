import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { broadcast } from '../websocket.js';
import { readJSON } from '../../scripts/modules/utils.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TASKS_FILE =
  process.env.TASKS_FILE ||
  path.join(__dirname, '../../.taskmaster/tasks/tasks.json');
const HISTORY_FILE =
  process.env.COMMAND_HISTORY_FILE ||
  path.join(__dirname, '../../.taskmaster/command-history.json');

function loadHistory() {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

router.post('/', (req, res) => {
  const { command } = req.body || {};
  if (!command) {
    res.status(400).json({ error: 'Command required' });
    return;
  }

  const cmd = `node ${path.join(
    __dirname,
    '../../bin/task-master.js'
  )} ${command}`;

  exec(cmd, { cwd: process.cwd() }, (err, stdout, stderr) => {
    let data = null;
    try {
      data = JSON.parse(stdout);
    } catch {
      data = null;
    }

    const entry = {
      timestamp: new Date().toISOString(),
      command,
      success: !err,
      stdout,
      stderr: stderr.trim(),
    };
    const history = loadHistory();
    history.push(entry);
    saveHistory(history);

    if (!err) {
      try {
        const tasks = readJSON(TASKS_FILE) || { tasks: [] };
        broadcast({ type: 'tasksUpdated', tasks: tasks.tasks || [] });
      } catch {
        // ignore
      }
    }

    res.json({ success: !err, output: stdout, error: stderr.trim(), data });
  });
});

router.get('/history', (_req, res) => {
  res.json({ history: loadHistory() });
});

export default router;
