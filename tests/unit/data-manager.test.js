/**
 * TaskMasterDataManager tests
 */

import { jest } from '@jest/globals';
import fs from 'fs';

jest.unstable_mockModule('../../src/utils/path-utils.js', () => ({
	__esModule: true,
	findProjectRoot: jest.fn(() => '/project'),
	findTasksPath: jest.fn(() => '/project/.taskmaster/tasks/tasks.json'),
	resolveTasksOutputPath: jest.fn(
		() => '/project/.taskmaster/tasks/tasks.json'
	),
	findConfigPath: jest.fn(() => '/project/.taskmaster/config.json'),
	findPRDPath: jest.fn(() => null),
	findComplexityReportPath: jest.fn(() => null),
	resolveComplexityReportOutputPath: jest.fn(() => null)
}));

describe('TaskMasterDataManager', () => {
	let existsSpy;
	let mkdirSpy;
	let readSpy;
	let writeSpy;
	let TaskMasterDataManager;

	beforeEach(async () => {
		jest.clearAllMocks();
		jest.resetModules();
		existsSpy = jest.spyOn(fs, 'existsSync');
		mkdirSpy = jest.spyOn(fs, 'mkdirSync');
		readSpy = jest.spyOn(fs, 'readFileSync');
		writeSpy = jest.spyOn(fs, 'writeFileSync');
		const mod = await import('../../src/utils/data-manager.js');
		TaskMasterDataManager = mod.default;
	});

	afterEach(() => {
		existsSpy.mockRestore();
		mkdirSpy.mockRestore();
		readSpy.mockRestore();
		writeSpy.mockRestore();
	});

	test('ensureTaskmasterDir creates directory when missing', () => {
		existsSpy.mockReturnValue(false);
		const manager = new TaskMasterDataManager();
		const dir = manager.ensureTaskmasterDir();
		const expectedDir = '/project/.taskmaster';
		expect(fs.mkdirSync).toHaveBeenCalledWith(expectedDir, { recursive: true });
		expect(dir).toBe(expectedDir);
	});

	test('readJSONFile parses JSON', () => {
		readSpy.mockReturnValue('{"a":1}');
		const manager = new TaskMasterDataManager();
		const data = manager.readJSONFile('.taskmaster/config.json');
		const expectedPath = '/project/.taskmaster/config.json';
		expect(fs.readFileSync).toHaveBeenCalledWith(expectedPath, 'utf8');
		expect(data).toEqual({ a: 1 });
	});

	test('readJSONFile returns null on error', () => {
		readSpy.mockImplementation(() => {
			throw new Error('fail');
		});
		const manager = new TaskMasterDataManager();
		const data = manager.readJSONFile('missing.json');
		expect(data).toBeNull();
	});

	test('writeJSONFile writes data', () => {
		existsSpy.mockReturnValue(true);
		const manager = new TaskMasterDataManager();
		const result = manager.writeJSONFile('data.json', { x: 2 });
		const expectedFile = '/project/data.json';
		expect(fs.writeFileSync).toHaveBeenCalledWith(
			expectedFile,
			JSON.stringify({ x: 2 }, null, 2),
			'utf8'
		);
		expect(result).toBe(true);
	});

	test('writeJSONFile returns false on error', () => {
		writeSpy.mockImplementation(() => {
			throw new Error('fail');
		});
		const manager = new TaskMasterDataManager();
		const result = manager.writeJSONFile('fail.json', { y: 1 });
		expect(result).toBe(false);
	});

	test('validateTasksData checks structure', () => {
		const manager = new TaskMasterDataManager();
		const valid = {
			tasks: [
				{
					id: 1,
					title: 't',
					description: 'd',
					status: 'pending',
					priority: 'high',
					dependencies: []
				}
			]
		};
		expect(manager.validateTasksData(valid)).toBe(true);
		expect(manager.validateTasksData({ tasks: {} })).toBe(false);
	});

	test('readTasks uses findTasksPath and stores path', () => {
		readSpy.mockReturnValue('{"tasks": []}');
		const manager = new TaskMasterDataManager();
		const data = manager.readTasks();
		expect(data).toEqual({ tasks: [] });
		expect(manager.tasksPath).toBe('/project/.taskmaster/tasks/tasks.json');
	});

	test('writeTasks uses stored path', () => {
		existsSpy.mockReturnValue(true);
		writeSpy.mockImplementation(() => {});
		const manager = new TaskMasterDataManager();
		manager.tasksPath = '/project/.taskmaster/tasks/tasks.json';
		const result = manager.writeTasks({
			tasks: [
				{
					id: 1,
					title: 't',
					description: 'd',
					status: 'pending',
					priority: 'high',
					dependencies: []
				}
			]
		});
		expect(fs.writeFileSync).toHaveBeenCalled();
		expect(result).toBe(true);
	});
});
