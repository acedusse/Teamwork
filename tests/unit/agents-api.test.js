import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let app;
let tmpDir;
let agentsPath;
let tasksPath;

describe('agents API', () => {
  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(__dirname, 'tmp-'));
    agentsPath = path.join(tmpDir, 'agents.json');
    tasksPath = path.join(tmpDir, 'tasks.json');
    const agents = [
      { id: 1, name: 'Agent A', status: 'available', capabilities: [] },
      { id: 2, name: 'Agent B', status: 'available', capabilities: [] },
    ];
    const tasks = [
      { id: 1, title: 'T1', description: 'd', status: 'done', agent: 'Agent A', subtasks: [] },
      { id: 2, title: 'T2', description: 'd', status: 'in-progress', agent: 'Agent B', subtasks: [] }
    ];
    fs.writeFileSync(agentsPath, JSON.stringify({ agents }, null, 2));
    fs.writeFileSync(tasksPath, JSON.stringify({ tasks }, null, 2));
    process.env.AGENTS_FILE = agentsPath;
    process.env.TASKS_FILE = tasksPath;
    jest.resetModules();
    ({ default: app } = await import('../../server/app.js'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.AGENTS_FILE;
    delete process.env.TASKS_FILE;
  });

  test('GET /api/agents', async () => {
    const res = await request(app).get('/api/agents');
    expect(res.status).toBe(200);
    expect(res.body.agents.length).toBe(2);
  });

  test('PUT /api/agents/1 updates agent', async () => {
    const res = await request(app)
      .put('/api/agents/1')
      .send({ status: 'busy' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('busy');
  });

  test('GET /api/agents/metrics', async () => {
    const res = await request(app).get('/api/agents/metrics');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const metrics = res.body.data.metrics;
    const aMetric = metrics.find((m) => m.name === 'Agent A');
    expect(aMetric.assigned).toBe(1);
  });
});
