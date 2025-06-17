import path from 'path';
import chalk from 'chalk';
import boxen from 'boxen';

import { log, readJSON, writeJSON, findTaskById } from '../utils.js';
import { displayBanner } from '../ui.js';
import { validateTaskDependencies } from '../dependency-manager.js';
import { getDebugFlag } from '../config-manager.js';
import updateSingleTaskStatus from './update-single-task-status.js';
import generateTaskFiles from './generate-task-files.js';
import {
	isValidTaskStatus,
	TASK_STATUS_OPTIONS
} from '../../../src/constants/task-status.js';
import { logTaskStatusChanged } from '../../../server/utils/activityLogger.js';

/**
 * Set the status of a task
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {string} taskIdInput - Task ID(s) to update
 * @param {string} newStatus - New status
 * @param {Object} options - Additional options (mcpLog for MCP mode)
 * @returns {Object|undefined} Result object in MCP mode, undefined in CLI mode
 */
async function setTaskStatus(tasksPath, taskIdInput, newStatus, options = {}) {
	try {
		if (!isValidTaskStatus(newStatus)) {
			throw new Error(
				`Error: Invalid status value: ${newStatus}. Use one of: ${TASK_STATUS_OPTIONS.join(', ')}`
			);
		}
		// Determine if we're in MCP mode by checking for mcpLog
		const isMcpMode = !!options?.mcpLog;

		// Only display UI elements if not in MCP mode
		if (!isMcpMode) {
			displayBanner();

			console.log(
				boxen(chalk.white.bold(`Updating Task Status to: ${newStatus}`), {
					padding: 1,
					borderColor: 'blue',
					borderStyle: 'round'
				})
			);
		}

		log('info', `Reading tasks from ${tasksPath}...`);
		const data = readJSON(tasksPath);
		if (!data || !data.tasks) {
			throw new Error(`No valid tasks found in ${tasksPath}`);
		}

		// Handle multiple task IDs (comma-separated)
		const taskIds = taskIdInput.split(',').map((id) => id.trim());
		const updatedTasks = [];
		const statusChanges = []; // Track status changes for activity logging

		// Update each task
		for (const id of taskIds) {
			// Capture old status before update
			let oldStatus = 'pending';
			let taskToUpdate = null;
			
			if (id.includes('.')) {
				// Subtask
				const [parentId, subtaskId] = id.split('.').map((id) => parseInt(id, 10));
				const parentTask = data.tasks.find((t) => t.id === parentId);
				if (parentTask && parentTask.subtasks) {
					const subtask = parentTask.subtasks.find((st) => st.id === subtaskId);
					if (subtask) {
						oldStatus = subtask.status || 'pending';
						taskToUpdate = subtask;
					}
				}
			} else {
				// Regular task
				const taskId = parseInt(id, 10);
				const task = data.tasks.find((t) => t.id === taskId);
				if (task) {
					oldStatus = task.status || 'pending';
					taskToUpdate = task;
				}
			}
			
			await updateSingleTaskStatus(tasksPath, id, newStatus, data, !isMcpMode);
			updatedTasks.push(id);
			
			// Store status change for logging
			if (taskToUpdate && oldStatus !== newStatus) {
				statusChanges.push({
					task: taskToUpdate,
					oldStatus,
					newStatus,
					taskId: id
				});
			}
		}

		// Write the updated tasks to the file
		writeJSON(tasksPath, data);

		// Log status change activities
		try {
			const userId = options?.session?.env?.USER_ID || options?.userId || 'cli_user';
			statusChanges.forEach(change => {
				logTaskStatusChanged(change.task, change.oldStatus, change.newStatus, userId);
			});
			if (statusChanges.length > 0) {
				log('info', `Logged ${statusChanges.length} status change activities.`);
			}
		} catch (logError) {
			log('warn', `Warning: Failed to log status change activities: ${logError.message}`);
		}

		// Validate dependencies after status update
		log('info', 'Validating dependencies after status update...');
		validateTaskDependencies(data.tasks);

		// Generate individual task files
		log('info', 'Regenerating task files...');
		await generateTaskFiles(tasksPath, path.dirname(tasksPath), {
			mcpLog: options.mcpLog
		});

		// Display success message - only in CLI mode
		if (!isMcpMode) {
			for (const id of updatedTasks) {
				const task = findTaskById(data.tasks, id);
				const taskName = task ? task.title : id;

				console.log(
					boxen(
						chalk.white.bold(`Successfully updated task ${id} status:`) +
							'\n' +
							`From: ${chalk.yellow(task ? task.status : 'unknown')}\n` +
							`To:   ${chalk.green(newStatus)}`,
						{ padding: 1, borderColor: 'green', borderStyle: 'round' }
					)
				);
			}
		}

		// Return success value for programmatic use
		return {
			success: true,
			updatedTasks: updatedTasks.map((id) => ({
				id,
				status: newStatus
			}))
		};
	} catch (error) {
		log('error', `Error setting task status: ${error.message}`);

		// Only show error UI in CLI mode
		if (!options?.mcpLog) {
			console.error(chalk.red(`Error: ${error.message}`));

			// Pass session to getDebugFlag
			if (getDebugFlag(options?.session)) {
				// Use getter
				console.error(error);
			}

			process.exit(1);
		} else {
			// In MCP mode, throw the error for the caller to handle
			throw error;
		}
	}
}

export default setTaskStatus;
