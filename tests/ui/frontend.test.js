/**
 * @jest-environment jsdom
 */
import fs from 'fs';
import path from 'path';
import {sampleTasks} from '../fixtures/sample-tasks.js';
import axe from 'axe-core';
import { jest } from '@jest/globals';

let mod;
let originalFetch;
let originalWebSocket;

class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.events = {};
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.events['open']) this.events['open']();
    }, 0);
  }
  addEventListener(evt, cb) {
    this.events[evt] = cb;
  }
  send(data) {
    this.sent = data;
  }
  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.events['close']) this.events['close']();
  }
}
MockWebSocket.CONNECTING = 0;
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSED = 3;

describe('Frontend UI', () => {
  beforeEach(async () => {
    document.documentElement.innerHTML = fs.readFileSync(
      path.join('ui', 'public', 'index.html'),
      'utf8'
    );

    // jsdom lacks matchMedia
    window.matchMedia = window.matchMedia || (() => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {}
    }));

    // run inline theme script
    const script = document.querySelector('script');
    if (script) {
      eval(script.textContent);
    }

    originalWebSocket = global.WebSocket;
    originalFetch = global.fetch;
    global.WebSocket = MockWebSocket;
    global.fetch = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ data: [] }) })
    );

    jest.resetModules();
    mod = await import('../../ui/public/app.js');
  });

  afterEach(() => {
    global.WebSocket = originalWebSocket;
    global.fetch = originalFetch;
  });

  test('renders tasks in columns', () => {
    mod.__test.setTasks(sampleTasks.tasks);
    mod.renderBoard();
    const column = document.querySelector(
      '.column[data-status="in-progress"]'
    );
    expect(column.querySelectorAll('.task-card').length).toBeGreaterThan(0);
  });

  test('theme toggle updates data-theme', () => {
    const toggle = document.getElementById('theme-toggle');
    const initial = document.body.getAttribute('data-theme');
    toggle.dispatchEvent(new Event('click'));
    const updated = document.body.getAttribute('data-theme');
    expect(updated).not.toBe(initial);
  });

  test('CSS contains responsive media queries', () => {
    const css = fs.readFileSync(path.join('ui', 'public', 'styles.css'), 'utf8');
    expect(css).toMatch(/@media \(max-width: 768px\)/);
    expect(css).toMatch(/@media \(max-width: 480px\)/);
  });

  test('WebSocket connection updates status', () => {
    const status = document.getElementById('connection-status');
    mod.connectWebSocket();
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(status.textContent).toBe('Connected');
        resolve();
      }, 10);
    });
  });

  test('page passes basic accessibility check', async () => {
    const results = await axe.run(document);
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(serious.length).toBeLessThan(2);
  });
});
