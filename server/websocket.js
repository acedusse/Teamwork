import { WebSocketServer } from 'ws';
import logger from '../mcp-server/src/logger.js';

/**
 * Initialize WebSocket server for real-time communication.
 * @param {import('http').Server} server - HTTP server instance.
 */
export default function initWebSocketServer(server) {
  const wss = new WebSocketServer({ server });
  const clients = new Set();

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

  return wss;
}
