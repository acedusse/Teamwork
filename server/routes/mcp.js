import express from 'express';
import * as taskMasterCore from '../../mcp-server/src/core/task-master-core.js';
import { broadcast } from '../websocket.js';

const router = express.Router();

router.post('/command', async (req, res, next) => {
	const { command, params = {} } = req.body || {};
	const fn = taskMasterCore[`${command}Direct`] || taskMasterCore[command];
	if (typeof fn !== 'function') {
		res.status(400).json({ error: 'Unknown command' });
		return;
	}
	try {
		broadcast({ type: 'commandStatus', command, status: 'started' });
		const result = await fn(params, { source: 'mcp' });
		broadcast({ type: 'commandStatus', command, status: 'completed' });
		res.json(result);
	} catch (err) {
		broadcast({
			type: 'commandStatus',
			command,
			status: 'error',
			message: err.message
		});
		next(err);
	}
});

export default router;
