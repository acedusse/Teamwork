import fs from 'fs';
import path from 'path';
import http from 'http';
import { WebSocket } from 'ws';
import request from 'supertest';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import { jest } from '@jest/globals';
import initWebSocketServer from '../../server/websocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateTasks(count) {
	const tasks = [];
	for (let i = 1; i <= count; i++) {
		tasks.push({
			id: i,
			title: `Task ${i}`,
			description: 'desc',
			status: 'pending',
			subtasks: []
		});
	}
	return tasks;
}

describe('Performance tests', () => {
	let tmpDir;
	let tasksPath;
	let server;
	let app;
	let port;

	beforeAll(async () => {
		tmpDir = fs.mkdtempSync(path.join(__dirname, 'tmp-'));
		tasksPath = path.join(tmpDir, 'tasks.json');
		fs.writeFileSync(
			tasksPath,
			JSON.stringify({ schemaVersion: 1, tasks: generateTasks(5000) })
		);
		process.env.TASKS_FILE = tasksPath;
		jest.resetModules();
		({ default: app } = await import('../../server/app.js'));
		server = http.createServer(app);
		initWebSocketServer(server);
		await new Promise((resolve) => {
			server.listen(0, () => {
				port = server.address().port;
				resolve();
			});
		});
	});

	afterAll(() => {
		server.close();
		fs.rmSync(tmpDir, { recursive: true, force: true });
		delete process.env.TASKS_FILE;
	});

	test('handles large task dataset quickly', async () => {
		const start = performance.now();
		const res = await request(app).get('/api/tasks');
		const duration = performance.now() - start;
		const memory = process.memoryUsage().heapUsed;
		expect(res.status).toBe(200);
		expect(res.body.tasks.length).toBe(5000);
		console.log('GET /api/tasks duration ms:', duration);
		console.log('Memory usage bytes:', memory);
	});

	test('broadcasts updates to many websocket clients', async () => {
		const clients = Array.from(
			{ length: 20 },
			() => new WebSocket(`ws://localhost:${port}`)
		);
		await Promise.all(
			clients.map((c) => new Promise((res) => c.on('open', res)))
		);
		const messages = [];
		clients.forEach((c) => c.on('message', (msg) => messages.push(msg)));

		fs.writeFileSync(
			tasksPath,
			JSON.stringify({ schemaVersion: 1, tasks: generateTasks(5001) })
		);

		await new Promise((r) => setTimeout(r, 200));

		expect(messages.length).toBeGreaterThanOrEqual(20);
		clients.forEach((c) => c.close());
	});
});
