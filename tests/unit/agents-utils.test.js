import { jest } from '@jest/globals';

jest.unstable_mockModule('../../scripts/modules/utils.js', () => ({
  __esModule: true,
  readJSON: jest.fn(() => ({ agents: [], tasks: [] })),
  writeJSON: jest.fn()
}));

let loadAgents;
let saveAgents;
let loadTasks;
let assignAgent;
let computeMetrics;

beforeEach(async () => {
  jest.clearAllMocks();
  jest.resetModules();
  const mod = await import('../../server/utils/agents.js');
  loadAgents = mod.loadAgents;
  saveAgents = mod.saveAgents;
  loadTasks = mod.loadTasks;
  assignAgent = mod.assignAgent;
  computeMetrics = mod.computeMetrics;
});

describe('agents utils', () => {
  test('loadAgents returns agents array', async () => {
    const utils = await import('../../scripts/modules/utils.js');
    utils.readJSON.mockReturnValue({ agents: [{ name: 'A' }] });
    expect(loadAgents()).toEqual([{ name: 'A' }]);
  });

  test('saveAgents writes agents data', async () => {
    const utils = await import('../../scripts/modules/utils.js');
    const agents = [{ name: 'A' }];
    saveAgents(agents);
    expect(utils.writeJSON).toHaveBeenCalled();
    const args = utils.writeJSON.mock.calls[0];
    expect(args[1]).toEqual({ agents });
  });

  test('loadTasks returns tasks array', async () => {
    const utils = await import('../../scripts/modules/utils.js');
    utils.readJSON.mockReturnValue({ tasks: [{ id: 1 }] });
    expect(loadTasks()).toEqual([{ id: 1 }]);
  });

  test('assignAgent chooses available agent with least workload', () => {
    const tasks = [
      { id: 1, agent: 'A', status: 'pending' },
      { id: 2, agent: 'B', status: 'in-progress' }
    ];
    const agents = [
      { name: 'A', status: 'available' },
      { name: 'B', status: 'available' }
    ];
    expect(assignAgent(tasks, agents)).toBe('A');
  });

  test('computeMetrics summarizes tasks per agent', () => {
    const agents = [
      { name: 'A', status: 'available' },
      { name: 'B', status: 'busy' }
    ];
    const tasks = [
      { id: 1, agent: 'A', status: 'done' },
      { id: 2, agent: 'A', status: 'pending' },
      { id: 3, agent: 'B', status: 'pending' }
    ];
    const result = computeMetrics(agents, tasks);
    const a = result.find(m => m.name === 'A');
    const b = result.find(m => m.name === 'B');
    expect(a.assigned).toBe(2);
    expect(a.completed).toBe(1);
    expect(b.assigned).toBe(1);
  });
});
