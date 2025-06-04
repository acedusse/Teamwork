import fs from 'fs';
import path from 'path';
import http from 'http';
import request from 'supertest';
import WebSocket from 'ws';
import express from 'express';
import { fileURLToPath } from 'url';
import { once } from 'events';
import { jest } from '@jest/globals';

// Mock MCP router to avoid importing the full MCP core
jest.unstable_mockModule('../../server/routes/mcp.js', () => ({
  default: express.Router(),
}));

let app;
let server;
let wss;
let port;
let baseUrl;
let tmpDir;
let tasksPath;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Full workflow integration', () => {
  beforeAll(async () => {
    tmpDir = fs.mkdtempSync(path.join(__dirname, 'tmp-'));
    tasksPath = path.join(tmpDir, 'tasks.json');
    fs.writeFileSync(tasksPath, JSON.stringify({ schemaVersion: 1, tasks: [] }, null, 2));
    process.env.TASKS_FILE = tasksPath;
    jest.resetModules();
    ({ default: app } = await import('../../server/app.js'));
    const initWebSocketServer = (await import('../../server/websocket.js')).default;
    server = http.createServer(app);
    wss = initWebSocketServer(server);
    await new Promise((resolve) => server.listen(0, resolve));
    port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(() => {
    wss.close();
    server.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.TASKS_FILE;
  });

  test('UI to backend communication and file persistence', async () => {
    const createRes = await request(baseUrl)
      .post('/api/tasks')
      .send({ title: 'Task 1', description: 'desc' });
    expect(createRes.status).toBe(201);

    const listRes = await request(baseUrl).get('/api/tasks');
    expect(listRes.status).toBe(200);
    expect(listRes.body.tasks.length).toBe(1);
    expect(listRes.body.tasks[0].title).toBe('Task 1');

    const data = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
    expect(data.tasks.length).toBe(1);
  });

  test('real-time updates via WebSocket', async () => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    await once(ws, 'open');
    const messages = [];
    ws.on('message', (data) => messages.push(JSON.parse(data)));

    await request(baseUrl)
      .post('/api/tasks')
      .send({ title: 'Task 2', description: 'two' });

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(messages.find((m) => m.type === 'tasksUpdated')).toBeTruthy();
    ws.terminate();
  });

  test('error scenario: version conflict', async () => {
    const res = await request(baseUrl)
      .post('/api/tasks')
      .set('X-Tasks-Version', '0')
      .send({ title: 'Conflict', description: 'fail' });
    expect(res.status).toBe(409);
  });
});
