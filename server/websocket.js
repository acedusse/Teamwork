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

// Configuration options
const MAX_CONNECTIONS = parseInt(process.env.MAX_WS_CONNECTIONS || '100', 10);
const PING_INTERVAL = parseInt(process.env.WS_PING_INTERVAL || '30000', 10);
const CONNECTION_TIMEOUT = parseInt(process.env.WS_CONNECTION_TIMEOUT || '120000', 10);

// Store clients with metadata for better management
const clients = new Set();
let pingInterval = null;

export function broadcast(data) {
	const message = typeof data === 'string' ? data : JSON.stringify(data);
	for (const client of clients) {
		if (client.readyState === client.OPEN) {
			try {
				client.send(message);
			} catch (err) {
				logger.error('Failed to send message to client', err);
				// Remove problematic client
				clients.delete(client);
			}
		}
	}
}

/**
 * Clean up inactive connections to free resources
 */
function cleanupInactiveConnections() {
	const now = Date.now();
	for (const client of clients) {
		if (client.readyState !== client.OPEN || (client._lastActivity && now - client._lastActivity > CONNECTION_TIMEOUT)) {
			try {
				client.terminate();
			} catch (e) {
				// Ignore errors during cleanup
			}
			clients.delete(client);
			logger.info('WebSocket connection terminated due to inactivity');
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
	const wss = new WebSocketServer({ 
		server,
		perMessageDeflate: {
			zlibDeflateOptions: { level: 1 }, // Use lower compression level to save CPU
			serverNoContextTakeover: true,
			clientNoContextTakeover: true
		},
		maxPayload: 1024 * 1024 // 1MB max message size
	});

	// Start ping interval for connection health checks and cleanup
	if (pingInterval) {
		clearInterval(pingInterval);
	}
	pingInterval = setInterval(() => {
		cleanupInactiveConnections();
		
		for (const client of clients) {
			if (client.readyState === client.OPEN) {
				try {
					client.ping();
				} catch (err) {
					// If ping fails, client will be cleaned up on next interval
				}
			}
		}
	}, PING_INTERVAL);

	wss.on('connection', (ws, req) => {
		// Check if we have reached the connection limit
		if (clients.size >= MAX_CONNECTIONS) {
			ws.close(1013, 'Maximum connections reached');
			logger.warn(`WebSocket connection rejected: Max connections (${MAX_CONNECTIONS}) reached`);
			return;
		}

		const url = new URL(req.url, `http://${req.headers.host}`);
		const token = url.searchParams.get('token');
		const expected = process.env.WS_TOKEN;
		if (expected && token !== expected) {
			ws.close(4001, 'Unauthorized');
			return;
		}

		// Set initial activity timestamp and connection info
		ws._lastActivity = Date.now();
		ws._clientInfo = {
			ip: req.socket.remoteAddress,
			userAgent: req.headers['user-agent'] || 'Unknown',
			connectedAt: new Date().toISOString()
		};

		clients.add(ws);
		logger.info(`WebSocket client connected (${clients.size}/${MAX_CONNECTIONS})`);

		// Update last activity on any message
		ws.on('message', (data) => {
			ws._lastActivity = Date.now();
			
			try {
				for (const client of clients) {
					if (client.readyState === client.OPEN) {
						try {
							client.send(data);
						} catch (err) {
							logger.error('Failed to relay message to client', err);
						}
					}
				}
			} catch (err) {
				logger.error('Error processing WebSocket message', err);
			}
		});

		ws.on('pong', () => {
			// Update activity on pong response
			ws._lastActivity = Date.now();
		});

		ws.on('error', (err) => {
			logger.error('WebSocket client error', err);
			try {
				ws.terminate();
			} catch (e) {
				// Ignore errors during termination
			}
			clients.delete(ws);
		});

		ws.on('close', () => {
			clients.delete(ws);
			logger.info(`WebSocket client disconnected (${clients.size}/${MAX_CONNECTIONS})`);
		});
	});

	// Graceful shutdown handler
	process.on('SIGTERM', () => {
		logger.info('SIGTERM received, closing WebSocket connections...');
		if (pingInterval) {
			clearInterval(pingInterval);
			pingInterval = null;
		}

		wss.close(() => {
			logger.info('WebSocket server closed');
		});

		for (const client of clients) {
			try {
				client.close(1001, 'Server shutting down');
			} catch (err) {
				// Ignore errors during shutdown
			}
		}
	});

	watchTasksFile();

	return wss;
}
