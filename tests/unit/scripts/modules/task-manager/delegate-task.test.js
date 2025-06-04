import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import delegateTask from '../../../../../scripts/modules/task-manager/delegate-task.js';

test('delegateTask assigns available agent', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const tmp = fs.mkdtempSync(path.join(__dirname, 'tmp-'));
  const tasksPath = path.join(tmp, 'tasks.json');
  const agentsPath = path.join(tmp, 'agents.json');
  fs.writeFileSync(tasksPath, JSON.stringify({ tasks: [{ id: 1, status: 'pending' }] }, null, 2));
  fs.writeFileSync(agentsPath, JSON.stringify({ agents: [{ id: 1, name: 'Agent', status: 'available' }] }, null, 2));

  const updated = delegateTask(tasksPath, agentsPath, 1);
  expect(updated.agent).toBe('Agent');
  const stored = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
  expect(stored.tasks[0].agent).toBe('Agent');

  fs.rmSync(tmp, { recursive: true, force: true });
});
