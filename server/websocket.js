import { Server } from 'socket.io';
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

// Store connected clients with metadata
const connectedClients = new Map();
let io = null;

/**
 * Broadcast message to all connected clients
 * @param {string} event - Event name
 * @param {any} data - Data to broadcast
 * @param {string} [excludeSocketId] - Socket ID to exclude from broadcast
 */
export function broadcast(event, data, excludeSocketId = null) {
	if (!io) return;
	
	try {
		if (excludeSocketId) {
			io.sockets.sockets.forEach((socket) => {
				if (socket.id !== excludeSocketId) {
					socket.emit(event, data);
				}
			});
		} else {
			io.emit(event, data);
		}
		logger.debug(`Broadcasted ${event} to ${io.sockets.sockets.size} clients`);
	} catch (err) {
		logger.error('Failed to broadcast message', { event, error: err.message });
	}
}

/**
 * Send message to specific client
 * @param {string} socketId - Target socket ID
 * @param {string} event - Event name
 * @param {any} data - Data to send
 */
export function sendToClient(socketId, event, data) {
	if (!io) return false;
	
	const socket = io.sockets.sockets.get(socketId);
	if (socket) {
		socket.emit(event, data);
		return true;
	}
	return false;
}

/**
 * Get all connected clients info
 */
export function getConnectedClients() {
	return Array.from(connectedClients.values());
}

/**
 * Clean up inactive connections
 */
function cleanupInactiveConnections() {
	if (!io) return;
	
	const now = Date.now();
	const socketsToDisconnect = [];
	
	connectedClients.forEach((client, socketId) => {
		if (now - client.lastActivity > CONNECTION_TIMEOUT) {
			socketsToDisconnect.push(socketId);
		}
	});
	
	socketsToDisconnect.forEach(socketId => {
		const socket = io.sockets.sockets.get(socketId);
		if (socket) {
			socket.disconnect(true);
			logger.info(`Disconnected inactive client: ${socketId}`);
		}
	});
}

/**
 * Watch tasks file for changes and broadcast updates
 */
function watchTasksFile() {
	if (!fs.existsSync(TASKS_FILE)) return;
	
	fs.watchFile(TASKS_FILE, { persistent: false, interval: 100 }, () => {
		try {
			const data = readJSON(TASKS_FILE) || { tasks: [] };
			broadcast('tasksUpdated', { 
				tasks: data.master?.tasks || data.tasks || [],
				timestamp: new Date().toISOString()
			});
			logger.debug('Broadcasted task updates');
		} catch (err) {
			logger.error('Failed to broadcast tasks update', err);
		}
	});
}

/**
 * Handle user authentication
 * @param {Object} socket - Socket.io socket instance
 * @param {Function} next - Next middleware function
 */
function authenticateSocket(socket, next) {
	const token = socket.handshake.auth?.token || socket.handshake.query?.token;
	const expectedToken = process.env.WS_TOKEN;
	
	// If token is required but not provided or invalid
	if (expectedToken && token !== expectedToken) {
		return next(new Error('Authentication failed'));
	}
	
	// Store user info if provided
	socket.userId = socket.handshake.auth?.userId || `user_${Date.now()}`;
	socket.userName = socket.handshake.auth?.userName || 'Anonymous';
	
	next();
}

/**
 * Handle connection limits
 * @param {Object} socket - Socket.io socket instance
 * @param {Function} next - Next middleware function
 */
function checkConnectionLimit(socket, next) {
	if (connectedClients.size >= MAX_CONNECTIONS) {
		return next(new Error('Maximum connections reached'));
	}
	next();
}

/**
 * Initialize Socket.io server for real-time collaboration
 * @param {import('http').Server} server - HTTP server instance
 */
export default function initWebSocketServer(server) {
	io = new Server(server, {
		cors: {
			origin: process.env.CORS_ORIGIN || "*",
			methods: ["GET", "POST"],
			credentials: true
		},
		pingTimeout: CONNECTION_TIMEOUT,
		pingInterval: PING_INTERVAL,
		maxHttpBufferSize: 1e6, // 1MB
		transports: ['websocket', 'polling'],
		allowEIO3: true
	});

	// Apply middleware
	io.use(authenticateSocket);
	io.use(checkConnectionLimit);

	// Handle connections
	io.on('connection', (socket) => {
		const clientInfo = {
			id: socket.id,
			userId: socket.userId,
			userName: socket.userName,
			connectedAt: new Date().toISOString(),
			lastActivity: Date.now(),
			ip: socket.handshake.address,
			userAgent: socket.handshake.headers['user-agent'] || 'Unknown'
		};
		
		connectedClients.set(socket.id, clientInfo);
		
		logger.info(`Client connected: ${socket.id} (${socket.userName}) - Total: ${connectedClients.size}/${MAX_CONNECTIONS}`);
		
		// Send initial data to new client
		socket.emit('connected', {
			socketId: socket.id,
			userId: socket.userId,
			serverTime: new Date().toISOString()
		});
		
		// Broadcast user joined to others
		socket.broadcast.emit('userJoined', {
			userId: socket.userId,
			userName: socket.userName,
			socketId: socket.id
		});
		
		// Send current tasks to new client
		try {
			const data = readJSON(TASKS_FILE) || { tasks: [] };
			socket.emit('tasksUpdated', {
				tasks: data.master?.tasks || data.tasks || [],
				timestamp: new Date().toISOString()
			});
		} catch (err) {
			logger.error('Failed to send initial tasks to client', err);
		}

		// Handle real-time task updates
		socket.on('taskUpdate', (data) => {
			connectedClients.get(socket.id).lastActivity = Date.now();
			
			// Broadcast to all other clients
			socket.broadcast.emit('taskUpdate', {
				...data,
				userId: socket.userId,
				userName: socket.userName,
				timestamp: new Date().toISOString()
			});
			
			logger.debug(`Task update from ${socket.userName}: ${data.type}`);
		});

		// Handle user presence updates
		socket.on('presenceUpdate', (data) => {
			connectedClients.get(socket.id).lastActivity = Date.now();
			
			// Update client info
			const client = connectedClients.get(socket.id);
			if (client) {
				client.presence = data;
			}
			
			// Broadcast presence to others
			socket.broadcast.emit('presenceUpdate', {
				userId: socket.userId,
				userName: socket.userName,
				socketId: socket.id,
				...data
			});
		});

		// Handle cursor position updates
		socket.on('cursorUpdate', (data) => {
			connectedClients.get(socket.id).lastActivity = Date.now();
			
			// Broadcast cursor position to others
			socket.broadcast.emit('cursorUpdate', {
				userId: socket.userId,
				userName: socket.userName,
				socketId: socket.id,
				...data
			});
		});

		// Handle collaborative editing locks
		socket.on('requestLock', (data) => {
			connectedClients.get(socket.id).lastActivity = Date.now();
			
			// Simple lock implementation - first come, first served
			// In a production app, you'd want more sophisticated locking
			socket.broadcast.emit('lockRequested', {
				userId: socket.userId,
				userName: socket.userName,
				socketId: socket.id,
				...data
			});
		});

		socket.on('releaseLock', (data) => {
			connectedClients.get(socket.id).lastActivity = Date.now();
			
			socket.broadcast.emit('lockReleased', {
				userId: socket.userId,
				userName: socket.userName,
				socketId: socket.id,
				...data
			});
		});

		// Handle typing indicators
		socket.on('typing', (data) => {
			connectedClients.get(socket.id).lastActivity = Date.now();
			
			socket.broadcast.emit('userTyping', {
				userId: socket.userId,
				userName: socket.userName,
				socketId: socket.id,
				...data
			});
		});

		// Handle notifications
		socket.on('notification', (data) => {
			connectedClients.get(socket.id).lastActivity = Date.now();
			
			// Broadcast notification to all clients
			broadcast('notification', {
				...data,
				fromUserId: socket.userId,
				fromUserName: socket.userName,
				timestamp: new Date().toISOString()
			});
		});

		// Handle ping for connection health
		socket.on('ping', () => {
			connectedClients.get(socket.id).lastActivity = Date.now();
			socket.emit('pong');
		});

		// Handle disconnection
		socket.on('disconnect', (reason) => {
			connectedClients.delete(socket.id);
			
			logger.info(`Client disconnected: ${socket.id} (${socket.userName}) - Reason: ${reason} - Remaining: ${connectedClients.size}`);
			
			// Broadcast user left to others
			socket.broadcast.emit('userLeft', {
				userId: socket.userId,
				userName: socket.userName,
				socketId: socket.id,
				reason
			});
		});

		// Handle connection errors
		socket.on('error', (error) => {
			logger.error(`Socket error for ${socket.id}:`, error);
		});
	});

	// Start cleanup interval
	const cleanupInterval = setInterval(cleanupInactiveConnections, PING_INTERVAL);

	// Watch tasks file for changes
	watchTasksFile();

	// Graceful shutdown
	process.on('SIGTERM', () => {
		logger.info('SIGTERM received, closing Socket.io server...');
		
		clearInterval(cleanupInterval);
		
		// Notify all clients of server shutdown
		broadcast('serverShutdown', {
			message: 'Server is shutting down',
			timestamp: new Date().toISOString()
		});
		
		// Close all connections
		io.close(() => {
			logger.info('Socket.io server closed');
		});
	});

	logger.info('Socket.io server initialized successfully');
	return io;
}
