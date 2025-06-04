import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js';
import { readJSON } from '../scripts/modules/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TASKS_FILE =
	process.env.TASKS_FILE ||
	path.join(__dirname, '../.taskmaster/tasks/tasks.json');

const clients = new Set();

export function broadcast(data) {
	const message = typeof data === 'string' ? data : JSON.stringify(data);
	for (const client of clients) {
		if (client.readyState === client.OPEN) {
			client.send(message);
		}
	}
}

function watchTasksFile() {
	if (!fs.existsSync(TASKS_FILE)) return;
	fs.watchFile(TASKS_FILE, { persistent: false, interval: 100 }, () => {
		try {
			const data = readJSON(TASKS_FILE) || { tasks: [] };
			broadcast({ type: 'tasksUpdated', tasks: data.tasks || [] });
		} catch (err) {
			logger.error('Failed to broadcast tasks update', err);
		}
	});
}

/**
 * Initialize WebSocket server for real-time communication.
 * @param {import('http').Server} server - HTTP server instance.
 */
export default function initWebSocketServer(server) {
	const wss = new WebSocketServer({ server });

	wss.on('connection', (ws, req) => {
		const url = new URL(req.url, `http://${req.headers.host}`);
		const token = url.searchParams.get('token');
		const expected = process.env.WS_TOKEN;
		if (expected && token !== expected) {
			ws.close(4001, 'Unauthorized');
			return;
		}

		clients.add(ws);
		logger.info('WebSocket client connected');

		ws.on('message', (data) => {
			for (const client of clients) {
				if (client.readyState === client.OPEN) {
					client.send(data);
				}
			}
		});

		ws.on('close', () => {
			clients.delete(ws);
			logger.info('WebSocket client disconnected');
		});
	});

	watchTasksFile();

	return wss;
}
