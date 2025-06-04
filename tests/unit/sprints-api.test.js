import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let app;
let tmpDir;
let sprintsPath;
let tasksPath;

describe('sprints API', () => {
  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(__dirname, 'tmp-'));
    sprintsPath = path.join(tmpDir, 'sprints.json');
    tasksPath = path.join(tmpDir, 'tasks.json');
    fs.writeFileSync(sprintsPath, JSON.stringify({ sprints: [] }, null, 2));
    fs.writeFileSync(tasksPath, JSON.stringify({ schemaVersion: 1, tasks: [] }, null, 2));
    process.env.SPRINTS_FILE = sprintsPath;
    process.env.TASKS_FILE = tasksPath;
    jest.resetModules();
    ({ default: app } = await import('../../server/app.js'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.SPRINTS_FILE;
    delete process.env.TASKS_FILE;
  });

  test('GET /api/sprints returns empty list', async () => {
    const res = await request(app).get('/api/sprints');
    expect(res.status).toBe(200);
    expect(res.body.sprints).toEqual([]);
  });

  test('POST /api/sprints creates sprint', async () => {
    const res = await request(app)
      .post('/api/sprints')
      .send({ name: 'Sprint 1', goal: 'g' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Sprint 1');
    const data = JSON.parse(fs.readFileSync(sprintsPath, 'utf-8'));
    expect(data.sprints.length).toBe(1);
  });

  test('PUT /api/sprints/:id updates sprint', async () => {
    await request(app).post('/api/sprints').send({ name: 'S1', goal: 'g' });
    const res = await request(app)
      .put('/api/sprints/1')
      .send({ status: 'done' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
  });

  test('POST /api/sprints/:id/plan auto-plans sprint', async () => {
    const tasks = [
      { id: 1, title: 'T1', description: 'd', status: 'pending', subtasks: [] },
      { id: 2, title: 'T2', description: 'd', status: 'done', subtasks: [] }
    ];
    fs.writeFileSync(tasksPath, JSON.stringify({ schemaVersion: 1, tasks }, null, 2));
    await request(app).post('/api/sprints').send({ name: 'S1', goal: 'g' });
    const res = await request(app).post('/api/sprints/1/plan');
    expect(res.status).toBe(200);
    expect(res.body.tasks).toContain(1);
    expect(res.body.tasks).not.toContain(2);
  });

  test('GET /api/sprints/metrics returns metrics', async () => {
    const tasks = [
      { id: 1, title: 'T1', description: 'd', status: 'done', subtasks: [] },
      { id: 2, title: 'T2', description: 'd', status: 'pending', subtasks: [] }
    ];
    fs.writeFileSync(tasksPath, JSON.stringify({ schemaVersion: 1, tasks }, null, 2));
    await request(app).post('/api/sprints').send({ name: 'S1', goal: 'g', tasks: [1, 2] });
    const res = await request(app).get('/api/sprints/metrics');
    expect(res.status).toBe(200);
    const metric = res.body.metrics.find((m) => m.id === 1);
    expect(metric.total).toBe(2);
    expect(metric.completed).toBe(1);
  });
});
