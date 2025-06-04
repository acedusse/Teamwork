import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let app;
let tmpDir;
let tasksPath;

describe('status API', () => {
  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(__dirname, 'tmp-'));
    tasksPath = path.join(tmpDir, 'tasks.json');
    const tasks = [
      { id: 1, title: 'A', description: 'd', status: 'done', subtasks: [] },
      { id: 2, title: 'B', description: 'd', status: 'in-progress', subtasks: [] },
      { id: 3, title: 'C', description: 'd', status: 'pending', subtasks: [] }
    ];
    fs.writeFileSync(tasksPath, JSON.stringify({ tasks }, null, 2));
    process.env.TASKS_FILE = tasksPath;
    jest.resetModules();
    ({ default: app } = await import('../../server/app.js'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.TASKS_FILE;
  });

  test('GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });

  test('GET /api/status', async () => {
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(3);
    expect(res.body.data.completed).toBe(1);
    expect(res.body.data.inProgress).toBe(1);
    expect(res.body.data.pending).toBe(1);
  });

  test('GET /api/metrics', async () => {
    const res = await request(app).get('/api/metrics');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.byStatus.done).toBe(1);
    expect(res.body.data.completionRate).toBeCloseTo(1 / 3);
  });
});
