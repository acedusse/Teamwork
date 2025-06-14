import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { readJSON, writeJSON } from '../../scripts/modules/utils.js';
import validate from '../middleware/validation.js';
import { TaskSchema } from '../schemas/task.js';
import { broadcast } from '../websocket.js';
import { loadAgents, assignAgent, recordAssignment } from '../utils/agents.js';
import { 
    logTaskCreated, 
    logTaskStatusChanged, 
    logTaskDeleted,
    logTaskUpdated,
    readActivityLog,
    getActivityStatistics
} from '../utils/activityLogger.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TASKS_FILE =
	process.env.TASKS_FILE ||
	path.join(__dirname, '../../.taskmaster/tasks/tasks.json');

console.log(`[DEBUG] TASKS_FILE path: ${TASKS_FILE}`);

function getVersion() {
	try {
		return fs.statSync(TASKS_FILE).mtimeMs;
	} catch {
		return Date.now();
	}
}

function loadTasks() {
        console.log(`[DEBUG] Loading tasks from: ${TASKS_FILE}`);
        const data = readJSON(TASKS_FILE) || { schemaVersion: 1, tasks: [] };
        console.log(`[DEBUG] Loaded data:`, data ? `${data.tasks?.length || 0} tasks` : 'null');
        return Array.isArray(data.tasks) ? data.tasks : [];
}

function saveTasks(tasks) {
	const data = readJSON(TASKS_FILE) || { schemaVersion: 1, tasks: [] };
	writeJSON(TASKS_FILE, { ...data, tasks });
}

router.get('/', (req, res, next) => {
	try {
		const tasks = loadTasks();
		res.set('X-Tasks-Version', String(getVersion()));
		res.json({ tasks });
	} catch (err) {
		next(err);
	}
});

router.post('/', validate(TaskSchema), (req, res, next) => {
        try {
                const clientVersion = Number(req.get('x-tasks-version'));
                if (clientVersion && clientVersion !== getVersion()) {
                        res.status(409).json({ error: 'Task data out of date' });
                        return;
                }
                const data = req.validatedBody;
                const tasks = loadTasks();
                const newId = tasks.length ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;
                const newTask = { 
                    id: newId, 
                    ...data, 
                    subtasks: [], 
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                tasks.push(newTask);
                saveTasks(tasks);
                
                // Log task creation activity
                logTaskCreated(newTask, req.headers['x-user-id'] || 'web_user');
                
                broadcast({ type: 'tasksUpdated', tasks });
                res.set('X-Tasks-Version', String(getVersion()));
                res.status(201).json(newTask);
        } catch (err) {
                next(err);
        }
});

router.put('/:id', validate(TaskSchema.partial()), (req, res, next) => {
        try {
                const clientVersion = Number(req.get('x-tasks-version'));
                if (clientVersion && clientVersion !== getVersion()) {
                        res.status(409).json({ error: 'Task data out of date' });
                        return;
                }
                const id = parseInt(req.params.id, 10);
                const update = req.validatedBody;
                const tasks = loadTasks();
                const index = tasks.findIndex((t) => t.id === id);
                if (index === -1) {
                        res.status(404).json({ error: 'Task not found' });
                        return;
                }
                const prevStatus = tasks[index].status;
                const prevTask = { ...tasks[index] };
                tasks[index] = { ...tasks[index], ...update, updatedAt: new Date().toISOString() };
                if (update.status === 'done' && prevStatus !== 'done') {
                        tasks[index].completedAt = new Date().toISOString();
                }
                saveTasks(tasks);
                
                // Log activity based on what changed
                const userId = req.headers['x-user-id'] || 'web_user';
                if (update.status && update.status !== prevStatus) {
                    // Status change
                    logTaskStatusChanged(tasks[index], prevStatus, update.status, userId);
                } else {
                    // General update
                    logTaskUpdated(tasks[index], update, userId);
                }
                broadcast({ type: 'tasksUpdated', tasks });
                res.set('X-Tasks-Version', String(getVersion()));
                res.json(tasks[index]);
        } catch (err) {
                next(err);
        }
});

router.delete('/:id', (req, res, next) => {
	try {
		const clientVersion = Number(req.get('x-tasks-version'));
		if (clientVersion && clientVersion !== getVersion()) {
			res.status(409).json({ error: 'Task data out of date' });
			return;
		}
		const id = parseInt(req.params.id, 10);
		const tasks = loadTasks();
		const index = tasks.findIndex((t) => t.id === id);
		if (index === -1) {
			res.status(404).json({ error: 'Task not found' });
			return;
		}
		const deletedTask = tasks[index];
		tasks.splice(index, 1);
		saveTasks(tasks);
		
		// Log task deletion activity
		logTaskDeleted(deletedTask, req.headers['x-user-id'] || 'web_user');
		broadcast({ type: 'tasksUpdated', tasks });
		res.set('X-Tasks-Version', String(getVersion()));
		res.status(204).end();
	} catch (err) {
		next(err);
	}
});

// GET /stats - Task statistics for dashboard
router.get('/stats', (req, res, next) => {
    try {
        const tasks = loadTasks();
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'done').length;
        const pending = tasks.filter(t => t.status !== 'done').length;
        res.json({ total, completed, pending });
    } catch (err) {
        next(err);
    }
});

// GET /activities - Recent task activities for dashboard
router.get('/activities', (req, res, next) => {
    try {
        const tasks = loadTasks();
        console.log(`[DEBUG] Loaded ${tasks.length} tasks for activities`);
        let activities = [];
        
        // Generate real activities from actual task data and timestamps
        tasks.forEach(task => {
            // Task creation activity (from createdAt timestamp)
            if (task.createdAt) {
                activities.push({
                    type: 'added',
                    description: `Task "${task.title}" was created`,
                    timestamp: new Date(task.createdAt).toLocaleString(),
                    taskId: task.id,
                    date: task.createdAt
                });
            }
            
            // Task completion activity (from completedAt timestamp)
            if (task.completedAt && task.status === 'done') {
                activities.push({
                    type: 'completed',
                    description: `Task "${task.title}" was completed`,
                    timestamp: new Date(task.completedAt).toLocaleString(),
                    taskId: task.id,
                    date: task.completedAt
                });
            }
            
            // Task update activity (from updatedAt timestamp, only if different from createdAt)
            if (task.updatedAt && task.createdAt && task.updatedAt !== task.createdAt) {
                // Determine the type of update based on current status
                let updateDescription;
                switch (task.status) {
                    case 'in-progress':
                        updateDescription = `Task "${task.title}" status changed to in-progress`;
                        break;
                    case 'done':
                        // Don't duplicate completion activities
                        if (!task.completedAt) {
                            updateDescription = `Task "${task.title}" was marked as done`;
                        }
                        break;
                    case 'blocked':
                        updateDescription = `Task "${task.title}" was blocked`;
                        break;
                    case 'deferred':
                        updateDescription = `Task "${task.title}" was deferred`;
                        break;
                    default:
                        updateDescription = `Task "${task.title}" was updated`;
                }
                
                if (updateDescription) {
                    activities.push({
                        type: 'edited',
                        description: updateDescription,
                        timestamp: new Date(task.updatedAt).toLocaleString(),
                        taskId: task.id,
                        date: task.updatedAt
                    });
                }
            }
            
            // Subtask activities (if subtasks exist and have timestamps)
            if (task.subtasks && Array.isArray(task.subtasks)) {
                task.subtasks.forEach(subtask => {
                    if (subtask.completedAt && subtask.status === 'done') {
                        activities.push({
                            type: 'completed',
                            description: `Subtask "${subtask.title}" was completed`,
                            timestamp: new Date(subtask.completedAt).toLocaleString(),
                            taskId: task.id,
                            subtaskId: subtask.id,
                            date: subtask.completedAt
                        });
                    }
                    
                    if (subtask.updatedAt && subtask.createdAt && subtask.updatedAt !== subtask.createdAt) {
                        activities.push({
                            type: 'edited',
                            description: `Subtask "${subtask.title}" was updated`,
                            timestamp: new Date(subtask.updatedAt).toLocaleString(),
                            taskId: task.id,
                            subtaskId: subtask.id,
                            date: subtask.updatedAt
                        });
                    }
                });
            }
        });
        
        console.log(`[DEBUG] Generated ${activities.length} real activities from task data`);
        
        // Sort by date descending (most recent first)
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Filter to last 30 days and limit to 15 most recent activities
        const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
        activities = activities
            .filter(activity => new Date(activity.date) >= thirtyDaysAgo)
            .slice(0, 15);
        
        console.log(`[DEBUG] Returning ${activities.length} recent activities (last 30 days)`);
        res.json(activities);
    } catch (err) {
        console.log(`[DEBUG] Error in activities endpoint:`, err);
        next(err);
    }
});

// GET /statistics/daily - Daily task statistics for dashboard charts
router.get('/statistics/daily', (req, res, next) => {
    try {
        const tasks = loadTasks();
        
        // Parse query parameters for date range
        const { startDate, endDate } = req.query;
        
        // Default to last 7 days if no dates provided
        const now = new Date();
        const defaultStartDate = new Date(now);
        defaultStartDate.setDate(now.getDate() - 6); // Last 7 days including today
        
        const start = startDate ? new Date(startDate) : defaultStartDate;
        const end = endDate ? new Date(endDate) : now;
        
        // Validate date range
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ 
                error: 'Invalid date format. Use YYYY-MM-DD format.' 
            });
        }
        
        if (start > end) {
            return res.status(400).json({ 
                error: 'Start date must be before or equal to end date.' 
            });
        }
        
        // Generate array of dates in the range
        const dateRange = [];
        const currentDate = new Date(start);
        while (currentDate <= end) {
            dateRange.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Initialize statistics for each date
        const dailyStats = dateRange.map(date => {
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
            return {
                date: dateStr,
                completed: 0,
                inProgress: 0,
                pending: 0,
                total: 0
            };
        });

        // Helper function to get date string from timestamp
        const getDateString = (timestamp) => {
            if (!timestamp) return null;
            return new Date(timestamp).toISOString().split('T')[0];
        };

        // Helper function to find stats object for a given date
        const findStatsForDate = (dateStr) => {
            return dailyStats.find(stat => stat.date === dateStr);
        };

        // Process all tasks and their historical data
        tasks.forEach(task => {
            // Track task creation
            if (task.createdAt) {
                const createdDate = getDateString(task.createdAt);
                const stats = findStatsForDate(createdDate);
                if (stats) {
                    // When created, task was likely pending
                    stats.pending++;
                    stats.total++;
                }
            }

            // Track task completion
            if (task.completedAt && task.status === 'done') {
                const completedDate = getDateString(task.completedAt);
                const stats = findStatsForDate(completedDate);
                if (stats) {
                    stats.completed++;
                    stats.total++;
                    
                    // If we also tracked it as pending when created, adjust
                    if (task.createdAt) {
                        const createdDate = getDateString(task.createdAt);
                        const createdStats = findStatsForDate(createdDate);
                        if (createdStats && createdDate !== completedDate) {
                            // Move from pending to completed
                            createdStats.pending = Math.max(0, createdStats.pending - 1);
                            createdStats.total = Math.max(0, createdStats.total - 1);
                        }
                    }
                }
            }

            // Track current status for recent days (if no completion date)
            if (!task.completedAt || task.status !== 'done') {
                // For tasks that are still active, show them in recent days
                const recentDays = Math.min(3, dailyStats.length);
                for (let i = dailyStats.length - recentDays; i < dailyStats.length; i++) {
                    const dayStats = dailyStats[i];
                    if (dayStats) {
                        if (task.status === 'in-progress') {
                            dayStats.inProgress++;
                        } else {
                            dayStats.pending++;
                        }
                        dayStats.total++;
                    }
                }
            }

            // Process subtasks
            if (task.subtasks && Array.isArray(task.subtasks)) {
                task.subtasks.forEach(subtask => {
                    // Track subtask creation
                    if (subtask.createdAt) {
                        const createdDate = getDateString(subtask.createdAt);
                        const stats = findStatsForDate(createdDate);
                        if (stats) {
                            stats.pending++;
                            stats.total++;
                        }
                    }

                    // Track subtask completion
                    if (subtask.completedAt && subtask.status === 'done') {
                        const completedDate = getDateString(subtask.completedAt);
                        const stats = findStatsForDate(completedDate);
                        if (stats) {
                            stats.completed++;
                            stats.total++;
                            
                            // Adjust pending count if created on different day
                            if (subtask.createdAt) {
                                const createdDate = getDateString(subtask.createdAt);
                                const createdStats = findStatsForDate(createdDate);
                                if (createdStats && createdDate !== completedDate) {
                                    createdStats.pending = Math.max(0, createdStats.pending - 1);
                                    createdStats.total = Math.max(0, createdStats.total - 1);
                                }
                            }
                        }
                    }

                    // Track current subtask status for recent days
                    if (!subtask.completedAt || subtask.status !== 'done') {
                        const recentDays = Math.min(2, dailyStats.length);
                        for (let i = dailyStats.length - recentDays; i < dailyStats.length; i++) {
                            const dayStats = dailyStats[i];
                            if (dayStats) {
                                if (subtask.status === 'in-progress') {
                                    dayStats.inProgress++;
                                } else {
                                    dayStats.pending++;
                                }
                                dayStats.total++;
                            }
                        }
                    }
                });
            }
        });

        // Ensure we have some baseline activity for days with no data
        dailyStats.forEach((dayStats, index) => {
            if (dayStats.total === 0) {
                // Add minimal baseline activity for empty days
                const isRecentDay = index >= dailyStats.length - 3;
                if (isRecentDay) {
                    dayStats.pending = 1;
                    dayStats.total = 1;
                }
            }
        });

        console.log(`[DEBUG] Generated daily statistics from ${tasks.length} tasks across ${dailyStats.length} days`);
        console.log(`[DEBUG] Daily stats summary:`, dailyStats.map(s => `${s.date}: ${s.total} total (${s.completed}c, ${s.inProgress}i, ${s.pending}p)`));

        res.json({
            dateRange: {
                startDate: start.toISOString().split('T')[0],
                endDate: end.toISOString().split('T')[0]
            },
            statistics: dailyStats
        });
        
    } catch (err) {
        next(err);
    }
});

// GET /analytics/activities - Real activity log data for dashboard
router.get('/analytics/activities', (req, res, next) => {
    try {
        const activities = readActivityLog();
        
        // Parse query parameters
        const { limit = 15, days = 30 } = req.query;
        const limitNum = parseInt(limit, 10);
        const daysNum = parseInt(days, 10);
        
        // Filter to specified number of days
        const cutoffDate = new Date(Date.now() - (daysNum * 24 * 60 * 60 * 1000));
        const recentActivities = activities
            .filter(activity => new Date(activity.timestamp) >= cutoffDate)
            .slice(0, limitNum)
            .map(activity => ({
                type: activity.activityType === 'task_created' ? 'added' :
                      activity.activityType === 'task_status_changed' && activity.details.newStatus === 'done' ? 'completed' :
                      activity.activityType === 'task_deleted' ? 'deleted' : 'edited',
                description: activity.activityType === 'task_created' ? 
                    `Task "${activity.details.title}" was created` :
                    activity.activityType === 'task_status_changed' ?
                    `Task "${activity.details.title}" status changed from ${activity.details.oldStatus} to ${activity.details.newStatus}` :
                    activity.activityType === 'task_deleted' ?
                    `Task "${activity.details.title}" was deleted` :
                    `Task "${activity.details.title}" was updated`,
                timestamp: new Date(activity.timestamp).toLocaleString(),
                taskId: activity.details.taskId,
                date: activity.timestamp,
                userId: activity.userId,
                source: 'activity_log'
            }));
        
        res.json(recentActivities);
    } catch (err) {
        console.error('[ERROR] Failed to read activity log:', err);
        next(err);
    }
});

// GET /analytics/statistics - Activity-based statistics for dashboard charts
router.get('/analytics/statistics', (req, res, next) => {
    try {
        const { startDate, endDate, period = 'daily' } = req.query;
        
        // Default to last 7 days if no dates provided
        const now = new Date();
        const defaultStartDate = new Date(now);
        defaultStartDate.setDate(now.getDate() - 6); // Last 7 days including today
        
        const start = startDate ? new Date(startDate) : defaultStartDate;
        const end = endDate ? new Date(endDate) : now;
        
        // Validate date range
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ 
                error: 'Invalid date format. Use YYYY-MM-DD format.' 
            });
        }
        
        if (start > end) {
            return res.status(400).json({ 
                error: 'Start date must be before or equal to end date.' 
            });
        }
        
        // Get activities from the log
        const activities = readActivityLog(start, end);
        
        // Generate array of dates in the range
        const dateRange = [];
        const currentDate = new Date(start);
        while (currentDate <= end) {
            dateRange.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Initialize statistics for each date
        const dailyStats = dateRange.map(date => {
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
            return {
                date: dateStr,
                completed: 0,
                inProgress: 0,
                pending: 0,
                total: 0
            };
        });

        // Helper function to get date string from timestamp
        const getDateString = (timestamp) => {
            if (!timestamp) return null;
            return new Date(timestamp).toISOString().split('T')[0];
        };

        // Helper function to find stats object for a given date
        const findStatsForDate = (dateStr) => {
            return dailyStats.find(stat => stat.date === dateStr);
        };

        // Process activities and count them by type and date
        activities.forEach(activity => {
            const activityDate = getDateString(activity.timestamp);
            const stats = findStatsForDate(activityDate);
            
            if (stats) {
                // Count different types of activities
                switch (activity.activityType) {
                    case 'task_created':
                        stats.pending++; // New tasks start as pending
                        stats.total++;
                        break;
                    case 'task_status_changed':
                        if (activity.details.newStatus === 'done') {
                            stats.completed++;
                        } else if (activity.details.newStatus === 'in-progress') {
                            stats.inProgress++;
                        } else if (activity.details.newStatus === 'pending') {
                            stats.pending++;
                        }
                        stats.total++;
                        break;
                    case 'task_updated':
                    case 'subtask_created':
                    case 'subtask_updated':
                    case 'subtask_status_changed':
                    case 'dependency_added':
                    case 'dependency_removed':
                        stats.total++; // Count all other activities as general activity
                        break;
                    default:
                        stats.total++;
                }
            }
        });

        const result = {
            dateRange: {
                startDate: start.toISOString().split('T')[0],
                endDate: end.toISOString().split('T')[0]
            },
            statistics: dailyStats
        };
        
        res.json(result);
    } catch (err) {
        console.error('[ERROR] Failed to generate activity statistics:', err);
        next(err);
    }
});

export default router;
