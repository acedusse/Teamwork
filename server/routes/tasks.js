import express from 'express';
import TaskMasterDataManager from '../../src/utils/data-manager.js';

const router = express.Router();
const dataManager = new TaskMasterDataManager();

router.get('/', (_req, res) => {
	const tasks = dataManager.readTasks();
	if (!tasks) {
		return res.status(500).json({ error: 'Failed to load tasks' });
	}
	res.json(tasks);
});

export default router;
