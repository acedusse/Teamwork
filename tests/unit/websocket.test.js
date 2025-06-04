import http from 'http';
import { once } from 'events';
import WebSocket from 'ws';
import { jest } from '@jest/globals';

let initWebSocketServer;
let broadcast;

// Helper to wait for a condition with timeout
async function waitFor(fn, timeout = 1000) {
  const start = Date.now();
  while (true) {
    if (fn()) return;
    if (Date.now() - start > timeout) {
      throw new Error('timeout');
    }
    await new Promise(r => setTimeout(r, 10));
  }
}

describe('websocket server', () => {
  let server;
  let wss;
  let port;

  beforeEach(async () => {
    process.env.WS_TOKEN = 'secret';
    process.env.TASKS_FILE = '/no/such/file';
    jest.resetModules();
    ({ default: initWebSocketServer, broadcast } = await import('../../server/websocket.js'));
    server = http.createServer();
    wss = initWebSocketServer(server);
    await new Promise(resolve => server.listen(0, resolve));
    port = server.address().port;
  });

  afterEach(() => {
    wss.close();
    server.close();
    delete process.env.WS_TOKEN;
    delete process.env.TASKS_FILE;
  });

  test('broadcast sends messages to all clients', async () => {
    const ws1 = new WebSocket(`ws://localhost:${port}?token=secret`);
    const ws2 = new WebSocket(`ws://localhost:${port}?token=secret`);
    await Promise.all([once(ws1, 'open'), once(ws2, 'open')]);
    const messages = [];
    ws2.on('message', data => messages.push(data.toString()));

    broadcast('hello');
    await waitFor(() => messages.length === 1);
    expect(messages[0]).toBe('hello');

    ws1.close();
    ws2.close();
  });

  test('clients receive messages from other clients', async () => {
    const ws1 = new WebSocket(`ws://localhost:${port}?token=secret`);
    const ws2 = new WebSocket(`ws://localhost:${port}?token=secret`);
    await Promise.all([once(ws1, 'open'), once(ws2, 'open')]);
    const messages = [];
    ws2.on('message', data => messages.push(data.toString()));

    ws1.send('hi');
    await waitFor(() => messages.length === 1);
    expect(messages[0]).toBe('hi');

    ws1.close();
    ws2.close();
  });

  test('unauthorized clients are rejected', async () => {
    const ws = new WebSocket(`ws://localhost:${port}?token=bad`);
    const [code] = await once(ws, 'close');
    expect(code).toBe(4001);
  });
});
