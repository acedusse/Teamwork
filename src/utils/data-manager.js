import fs from 'fs';
import path from 'path';
import {
	TASKMASTER_DIR,
	TASKMASTER_TASKS_FILE,
	TASKMASTER_CONFIG_FILE
} from '../constants/paths.js';
import {
	findProjectRoot,
	findTasksPath,
	resolveTasksOutputPath
} from './path-utils.js';
import { tasksFileSchema } from './tasks-schema.js';
import { getLoggerOrDefault } from './logger-utils.js';

/**
 * Manages reading and writing Task Master data files.
 */
export default class TaskMasterDataManager {
	/**
	 * @param {string|null} projectRoot - Optional project root. Defaults to auto discovery.
	 * @param {Object|null} logger - Optional logger object.
	 */
	constructor(projectRoot = null, logger = null) {
		this.projectRoot = projectRoot || findProjectRoot() || process.cwd();
		this.logger = getLoggerOrDefault(logger);
		this.tasksPath = null;
	}

	/**
	 * Get the absolute path to the .taskmaster directory.
	 * @returns {string} Directory path.
	 */
	getTaskmasterDir() {
		return path.join(this.projectRoot, TASKMASTER_DIR);
	}

	/**
	 * Ensure the .taskmaster directory exists.
	 * @returns {string|null} Created directory path or null on error.
	 */
	ensureTaskmasterDir() {
		const dir = this.getTaskmasterDir();
		try {
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
				this.logger.info(`Created directory: ${dir}`);
			}
			return dir;
		} catch (err) {
			this.logger.error(`Failed to create directory ${dir}: ${err.message}`);
			return null;
		}
	}

	/**
	 * Read the contents of a sub directory inside .taskmaster.
	 * @param {string} subDir - Relative sub directory path.
	 * @returns {string[]} Array of file names or empty array on error.
	 */
	readDirectory(subDir = '') {
		const dirPath = path.join(this.getTaskmasterDir(), subDir);
		try {
			return fs.readdirSync(dirPath);
		} catch (err) {
			this.logger.error(`Failed to read directory ${dirPath}: ${err.message}`);
			return [];
		}
	}

	/**
	 * Read and parse a JSON file relative to the project root.
	 * @param {string} relativePath - File path relative to project root.
	 * @returns {Object|null} Parsed data or null on error.
	 */
	readJSONFile(relativePath) {
		const filePath = path.join(this.projectRoot, relativePath);
		try {
			const raw = fs.readFileSync(filePath, 'utf8');
			return JSON.parse(raw);
		} catch (err) {
			this.logger.error(`Error reading JSON file ${filePath}: ${err.message}`);
			return null;
		}
	}

	/**
	 * Write data as JSON to a file relative to the project root.
	 * @param {string} relativePath - File path relative to project root.
	 * @param {Object} data - Data to write.
	 * @returns {boolean} True on success, false otherwise.
	 */
	writeJSONFile(relativePath, data) {
		const filePath = path.join(this.projectRoot, relativePath);
		try {
			const dir = path.dirname(filePath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}
			fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
			return true;
		} catch (err) {
			this.logger.error(`Error writing JSON file ${filePath}: ${err.message}`);
			return false;
		}
	}

	/**
	 * Read tasks.json using fallback search for legacy locations.
	 * Stores the path that was read for future writes.
	 */
	readTasks() {
		const tasksPath =
			findTasksPath(null, { projectRoot: this.projectRoot }, this.logger) ||
			path.join(this.projectRoot, TASKMASTER_TASKS_FILE);

		const data = this.readJSONFile(tasksPath);
		if (data) {
			this.tasksPath = tasksPath;
		}
		return data;
	}

	/**
	 * Write tasks.json after validation. Uses previously read path or
	 * resolves the default output path if none was stored.
	 */
	writeTasks(data) {
		if (!this.validateTasksData(data)) {
			this.logger.error('Invalid tasks data');
			return false;
		}

		const outPath =
			this.tasksPath ||
			resolveTasksOutputPath(
				null,
				{ projectRoot: this.projectRoot },
				this.logger
			);
		this.tasksPath = outPath;
		return this.writeJSONFile(outPath, data);
	}

	/** Read config.json using standard path. */
	readConfig() {
		return this.readJSONFile(TASKMASTER_CONFIG_FILE);
	}

	/** Write config.json after validation. */
	writeConfig(data) {
		if (!this.validateConfigData(data)) {
			this.logger.error('Invalid config data');
			return false;
		}
		return this.writeJSONFile(TASKMASTER_CONFIG_FILE, data);
	}

	/**
	 * Validate basic structure of tasks data.
	 * @param {Object} data - Data to validate.
	 * @returns {boolean} True if valid.
	 */
	validateTasksData(data) {
		const result = tasksFileSchema.safeParse(data);
		return result.success;
	}

	/**
	 * Validate basic structure of config data.
	 * @param {Object} data - Config data.
	 * @returns {boolean} True if valid.
	 */
	validateConfigData(data) {
		return (
			data &&
			typeof data === 'object' &&
			typeof data.models === 'object' &&
			typeof data.global === 'object'
		);
	}
}
