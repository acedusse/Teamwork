import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import updateTaskProgress from '../../../../../scripts/modules/task-manager/update-task-progress.js';

test('updateTaskProgress sets progress and status', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const tmp = fs.mkdtempSync(path.join(__dirname, 'tmp-'));
  const tasksPath = path.join(tmp, 'tasks.json');
  fs.writeFileSync(tasksPath, JSON.stringify({ tasks: [{ id: 1, status: 'pending' }] }, null, 2));

  const t = updateTaskProgress(tasksPath, 1, 50);
  expect(t.progress).toBe(50);
  const stored = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
  expect(stored.tasks[0].progress).toBe(50);
  expect(stored.tasks[0].status).toBe('in-progress');

  fs.rmSync(tmp, { recursive: true, force: true });
});
