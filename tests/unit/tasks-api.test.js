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

describe('tasks API', () => {
  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(__dirname, 'tmp-'));
    tasksPath = path.join(tmpDir, 'tasks.json');
    fs.writeFileSync(tasksPath, JSON.stringify({ tasks: [] }, null, 2));
    process.env.TASKS_FILE = tasksPath;
    jest.resetModules();
    ({ default: app } = await import('../../server/app.js'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.TASKS_FILE;
  });

  test('GET /api/tasks returns empty list', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.tasks).toEqual([]);
  });

  test('POST /api/tasks creates task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test', description: 'Desc' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test');

    const data = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
    expect(data.tasks.length).toBe(1);
  });

  test('PUT /api/tasks/:id updates task', async () => {
    await request(app)
      .post('/api/tasks')
      .send({ title: 'Test', description: 'Desc' });
    const res = await request(app)
      .put('/api/tasks/1')
      .send({ status: 'done' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
  });

  test('DELETE /api/tasks/:id removes task', async () => {
    await request(app)
      .post('/api/tasks')
      .send({ title: 'Test', description: 'Desc' });
    const res = await request(app).delete('/api/tasks/1');
    expect(res.status).toBe(204);
    const data = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
    expect(data.tasks).toEqual([]);
  });
});
