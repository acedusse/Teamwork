import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import addAgentFeedback from '../../../../../scripts/modules/task-manager/add-agent-feedback.js';

test('addAgentFeedback appends feedback to task', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const tmp = fs.mkdtempSync(path.join(__dirname, 'tmp-'));
  const tasksPath = path.join(tmp, 'tasks.json');
  fs.writeFileSync(tasksPath, JSON.stringify({ tasks: [{ id: 1, status: 'pending' }] }, null, 2));

  addAgentFeedback(tasksPath, 1, 'Agent', 'Good job');
  const stored = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
  expect(stored.tasks[0].feedback.length).toBe(1);
  expect(stored.tasks[0].feedback[0].agent).toBe('Agent');

  fs.rmSync(tmp, { recursive: true, force: true });
});
