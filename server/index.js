#!/usr/bin/env node
import dotenv from 'dotenv';
import http from 'http';
import app from './app.js';
import logger from '../mcp-server/src/logger.js';
import initWebSocketServer from './websocket.js';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const server = http.createServer(app);
initWebSocketServer(server);

server.listen(PORT, () => {
  logger.info(`Express server listening on port ${PORT}`);
});

