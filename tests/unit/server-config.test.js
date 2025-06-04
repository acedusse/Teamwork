import { jest } from '@jest/globals';

const CONFIG_PATH = '../../mcp-server/src/config.js';

describe('server config', () => {
  afterEach(() => {
    jest.resetModules();
    delete process.env.PORT;
    delete process.env.CORS_ORIGIN;
    delete process.env.LOG_LEVEL;
  });

  test('loads defaults when env vars not set', async () => {
    const { default: config } = await import(CONFIG_PATH);
    expect(config.port).toBe(3000);
    expect(config.corsOrigin).toBe('*');
    expect(config.logLevel).toBe('info');
  });

  test('respects environment variables', async () => {
    process.env.PORT = '5000';
    process.env.CORS_ORIGIN = 'http://example.com';
    process.env.LOG_LEVEL = 'debug';
    jest.resetModules();
    const { default: config } = await import(CONFIG_PATH);
    expect(config.port).toBe(5000);
    expect(config.corsOrigin).toBe('http://example.com');
    expect(config.logLevel).toBe('debug');
  });
});
