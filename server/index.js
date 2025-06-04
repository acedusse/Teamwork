#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import http from 'http';
import app from './app.js';
import logger, { rotateLog } from './utils/logger.js';
import initWebSocketServer from './websocket.js';
import { scheduleLogRotation } from './utils/monitor.js';

const ENV = process.env.NODE_ENV || 'development';
const envFile = path.resolve(process.cwd(), `.env.${ENV}`);
if (fs.existsSync(envFile)) {
	dotenv.config({ path: envFile });
} else {
	dotenv.config();
}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const server = http.createServer(app);
initWebSocketServer(server);

server.listen(PORT, () => {
	logger.info(`Express server listening on port ${PORT}`);
});

scheduleLogRotation(rotateLog);
