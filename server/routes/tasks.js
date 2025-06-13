import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { readJSON, writeJSON } from '../../scripts/modules/utils.js';
import validate from '../middleware/validation.js';
import { TaskSchema } from '../schemas/task.js';
import { broadcast } from '../websocket.js';
import { loadAgents, assignAgent, recordAssignment } from '../utils/agents.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TASKS_FILE =
	process.env.TASKS_FILE ||
	path.join(__dirname, '../../.taskmaster/tasks/tasks.json');

function getVersion() {
	try {
		return fs.statSync(TASKS_FILE).mtimeMs;
	} catch {
		return Date.now();
	}
}

function loadTasks() {
	const data = readJSON(TASKS_FILE) || { schemaVersion: 1, tasks: [] };
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
                const newTask = { id: newId, ...data, subtasks: [], createdAt: new Date().toISOString() };
                tasks.push(newTask);
                saveTasks(tasks);
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
                tasks[index] = { ...tasks[index], ...update };
                if (update.status === 'done' && prevStatus !== 'done') {
                        tasks[index].completedAt = new Date().toISOString();
                }
                saveTasks(tasks);
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
		tasks.splice(index, 1);
		saveTasks(tasks);
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
        let activities = [];
        for (const t of tasks) {
            if (t.createdAt) {
                activities.push({
                    type: 'created',
                    taskId: t.id,
                    title: t.title,
                    date: t.createdAt
                });
            }
            if (t.completedAt) {
                activities.push({
                    type: 'completed',
                    taskId: t.id,
                    title: t.title,
                    date: t.completedAt
                });
            }
            if (t.updatedAt) {
                activities.push({
                    type: 'updated',
                    taskId: t.id,
                    title: t.title,
                    date: t.updatedAt
                });
            }
        }
        // Sort by date descending
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        // Limit to 20 most recent
        activities = activities.slice(0, 20);
        res.json({ activities });
    } catch (err) {
        next(err);
    }
});

export default router;
