import express from 'express';
import { AgentSchema, AgentUpdateSchema } from '../schemas/agent.js';
import validate from '../middleware/validation.js';
import { success } from '../utils/response.js';
import {
	loadAgents,
	saveAgents,
	loadTasks,
	assignAgent,
	loadAssignmentHistory,
	recordAssignment,
	computeMetrics
} from '../utils/agents.js';

const router = express.Router();

router.get('/', (req, res, next) => {
	try {
		const agents = loadAgents();
		res.json({ agents });
	} catch (err) {
		next(err);
	}
});

router.post('/', validate(AgentSchema), (req, res, next) => {
	try {
		const agents = loadAgents();
		const newId = agents.length
			? Math.max(...agents.map((a) => a.id || 0)) + 1
			: 1;
		const newAgent = { id: newId, ...req.validatedBody };
		agents.push(newAgent);
		saveAgents(agents);
		res.status(201).json(newAgent);
	} catch (err) {
		next(err);
	}
});

router.put('/:id', validate(AgentUpdateSchema), (req, res, next) => {
	try {
		const id = parseInt(req.params.id, 10);
		const agents = loadAgents();
		const idx = agents.findIndex((a) => a.id === id);
		if (idx === -1) {
			res.status(404).json({ error: 'Agent not found' });
			return;
		}
		agents[idx] = { ...agents[idx], ...req.validatedBody };
		saveAgents(agents);
		res.json(agents[idx]);
	} catch (err) {
		next(err);
	}
});

router.get('/metrics', (req, res, next) => {
	try {
		const agents = loadAgents();
		const tasks = loadTasks();
		const metrics = computeMetrics(agents, tasks);
		res.json(success({ metrics }));
	} catch (err) {
		next(err);
	}
});

router.get('/history', (req, res, next) => {
	try {
		const history = loadAssignmentHistory();
		res.json(success({ history }));
	} catch (err) {
		next(err);
	}
});

export default router;
