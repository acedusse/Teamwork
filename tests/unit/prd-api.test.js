import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let app;
let tmpDir;
let prdPath;
let tasksPath;

describe('prd API', () => {
  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(__dirname, 'tmp-'));
    prdPath = path.join(tmpDir, 'prd.txt');
    tasksPath = path.join(tmpDir, 'tasks.json');
    fs.writeFileSync(prdPath, 'initial');
    fs.writeFileSync(tasksPath, JSON.stringify({ schemaVersion: 1, tasks: [] }, null, 2));
    process.env.PRD_FILE = prdPath;
    process.env.TASKS_FILE = tasksPath;
    jest.unstable_mockModule('../../scripts/modules/task-manager/parse-prd.js', () => ({
      default: jest.fn().mockResolvedValue({ success: true }),
    }));
    jest.resetModules();
    ({ default: app } = await import('../../server/app.js'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.PRD_FILE;
    delete process.env.TASKS_FILE;
    jest.resetModules();
  });

  test('GET /api/prd returns content', async () => {
    const res = await request(app).get('/api/prd');
    expect(res.status).toBe(200);
    expect(res.body.content).toBe('initial');
  });

  test('POST /api/prd updates content', async () => {
    const res = await request(app).post('/api/prd').send({ content: 'updated' });
    expect(res.status).toBe(200);
    expect(fs.readFileSync(prdPath, 'utf8')).toBe('updated');
  });

  test('POST /api/generate-tasks triggers parse', async () => {
    const { default: parsePRD } = await import('../../scripts/modules/task-manager/parse-prd.js');
    const res = await request(app).post('/api/generate-tasks').send({ numTasks: 5 });
    expect(res.status).toBe(200);
    expect(parsePRD).toHaveBeenCalledWith(prdPath, tasksPath, 5, { force: false, append: false, research: false });
  });
});
