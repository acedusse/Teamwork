import fs from 'fs';
import { jest } from '@jest/globals';

const projectRoot = '/project';
const existsSpy = jest.spyOn(fs, 'existsSync');
const mkdirSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
const accessSpy = jest.spyOn(fs, 'accessSync').mockImplementation(() => {});
const copySpy = jest.spyOn(fs, 'copyFileSync').mockImplementation(() => {});
const rmSpy = jest.spyOn(fs, 'rmSync').mockImplementation(() => {});

import {
    ensureTaskmasterDirs,
    createDefaultTemplates,
    cleanupTaskmasterDir
} from '../../src/utils/directory-utils.js';

describe('directory-utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('ensureTaskmasterDirs creates missing dirs and checks permissions', () => {
        existsSpy.mockReturnValue(false);
        const result = ensureTaskmasterDirs(projectRoot);
        expect(fs.mkdirSync).toHaveBeenCalled();
        expect(fs.accessSync).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    test('createDefaultTemplates copies templates when missing', () => {
        existsSpy.mockImplementation((p) => p.includes('assets'));
        createDefaultTemplates(projectRoot);
        expect(fs.copyFileSync).toHaveBeenCalled();
    });

    test('cleanupTaskmasterDir removes directory', () => {
        existsSpy.mockReturnValue(true);
        cleanupTaskmasterDir(projectRoot);
        expect(fs.rmSync).toHaveBeenCalled();
    });
});
