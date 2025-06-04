import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { readJSON, writeJSON } from '../../scripts/modules/utils.js';
import validate from '../middleware/validation.js';
import { TaskSchema } from '../schemas/task.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TASKS_FILE =
	process.env.TASKS_FILE ||
	path.join(__dirname, '../../.taskmaster/tasks/tasks.json');

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
		res.json({ tasks });
	} catch (err) {
		next(err);
	}
});

router.post('/', validate(TaskSchema), (req, res, next) => {
	try {
		const data = req.validatedBody;
		const tasks = loadTasks();
		const newId = tasks.length ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;
                const timestamp = new Date().toISOString();
                const newTask = {
                        id: newId,
                        ...data,
                        createdAt: timestamp,
                        completedAt: data.status === 'done' ? timestamp : undefined,
                        subtasks: []
                };
		tasks.push(newTask);
		saveTasks(tasks);
		res.status(201).json(newTask);
	} catch (err) {
		next(err);
	}
});

router.put('/:id', validate(TaskSchema.partial()), (req, res, next) => {
	try {
		const id = parseInt(req.params.id, 10);
                const update = req.validatedBody;
                const tasks = loadTasks();
                const index = tasks.findIndex((t) => t.id === id);
                if (index === -1) {
                        res.status(404).json({ error: 'Task not found' });
                        return;
                }
                const existing = tasks[index];
                const updated = { ...existing, ...update };
                if (update.status === 'done' && existing.status !== 'done') {
                        updated.completedAt = new Date().toISOString();
                }
                tasks[index] = updated;
                saveTasks(tasks);
                res.json(updated);
	} catch (err) {
		next(err);
	}
});

router.delete('/:id', (req, res, next) => {
	try {
		const id = parseInt(req.params.id, 10);
		const tasks = loadTasks();
		const index = tasks.findIndex((t) => t.id === id);
		if (index === -1) {
			res.status(404).json({ error: 'Task not found' });
			return;
		}
		tasks.splice(index, 1);
		saveTasks(tasks);
		res.status(204).end();
	} catch (err) {
		next(err);
	}
});

export default router;
