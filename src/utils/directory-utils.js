import fs from 'fs';
import path from 'path';
import {
    TASKMASTER_DIR,
    TASKMASTER_TASKS_DIR,
    TASKMASTER_DOCS_DIR,
    TASKMASTER_REPORTS_DIR,
    TASKMASTER_TEMPLATES_DIR,
    TASKMASTER_CONFIG_FILE,
    EXAMPLE_PRD_FILE
} from '../constants/paths.js';
import { getLoggerOrDefault } from './logger-utils.js';

/**
 * Ensure .taskmaster directory and required subdirectories exist.
 * Performs basic permission checks for read/write access.
 * @param {string} projectRoot - Root directory of the project.
 * @param {Object|null} logger - Optional logger instance.
 * @returns {boolean} True if directories are ready, false otherwise.
 */
export function ensureTaskmasterDirs(projectRoot = process.cwd(), logger = null) {
    const log = getLoggerOrDefault(logger);
    const dirs = [
        TASKMASTER_DIR,
        TASKMASTER_TASKS_DIR,
        TASKMASTER_DOCS_DIR,
        TASKMASTER_REPORTS_DIR,
        TASKMASTER_TEMPLATES_DIR
    ].map((d) => path.join(projectRoot, d));

    for (const dir of dirs) {
        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                log.info?.(`Created directory: ${dir}`);
            }
            fs.accessSync(dir, fs.constants.R_OK | fs.constants.W_OK);
        } catch (err) {
            log.error?.(`Directory permission issue at ${dir}: ${err.message}`);
            return false;
        }
    }
    return true;
}

/**
 * Copy default template files to project if missing.
 * Templates are sourced from the package assets directory.
 * @param {string} projectRoot - Root directory of the project.
 * @param {Object|null} logger - Optional logger instance.
 */
export function createDefaultTemplates(projectRoot = process.cwd(), logger = null) {
    const log = getLoggerOrDefault(logger);
    const pkgRoot = path.resolve('assets');
    const templates = [
        { src: path.join(pkgRoot, 'config.json'), dest: path.join(projectRoot, TASKMASTER_CONFIG_FILE) },
        { src: path.join(pkgRoot, 'example_prd.txt'), dest: path.join(projectRoot, EXAMPLE_PRD_FILE) }
    ];

    for (const { src, dest } of templates) {
        try {
            if (!fs.existsSync(dest) && fs.existsSync(src)) {
                const dir = path.dirname(dest);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                fs.copyFileSync(src, dest);
                log.info?.(`Copied template ${dest}`);
            }
        } catch (err) {
            log.error?.(`Failed to copy template ${dest}: ${err.message}`);
        }
    }
}

/**
 * Remove the .taskmaster directory and all contents.
 * @param {string} projectRoot - Root directory of the project.
 * @param {Object|null} logger - Optional logger instance.
 */
export function cleanupTaskmasterDir(projectRoot = process.cwd(), logger = null) {
    const log = getLoggerOrDefault(logger);
    const dir = path.join(projectRoot, TASKMASTER_DIR);
    if (!fs.existsSync(dir)) {
        return;
    }
    try {
        fs.rmSync(dir, { recursive: true, force: true });
        log.info?.(`Removed ${dir}`);
    } catch (err) {
        log.error?.(`Failed to remove ${dir}: ${err.message}`);
    }
}
