import path from 'path';
import { fileURLToPath } from 'url';
import { readJSON, writeJSON } from '../../scripts/modules/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const AGENTS_FILE =
	process.env.AGENTS_FILE ||
	path.join(__dirname, '../../.taskmaster/agents.json');

export const TASKS_FILE =
	process.env.TASKS_FILE ||
	path.join(__dirname, '../../.taskmaster/tasks/tasks.json');

export const ASSIGNMENT_HISTORY_FILE =
	process.env.ASSIGNMENT_HISTORY_FILE ||
	path.join(__dirname, '../../.taskmaster/assignment-history.json');

export function loadAgents() {
	const data = readJSON(AGENTS_FILE) || { agents: [] };
	return Array.isArray(data.agents) ? data.agents : [];
}

export function saveAgents(agents) {
	writeJSON(AGENTS_FILE, { agents });
}

export function loadTasks() {
	const data = readJSON(TASKS_FILE) || { tasks: [] };
	return Array.isArray(data.tasks) ? data.tasks : [];
}

export function loadAssignmentHistory() {
	const data = readJSON(ASSIGNMENT_HISTORY_FILE) || { history: [] };
	return Array.isArray(data.history) ? data.history : [];
}

export function saveAssignmentHistory(history) {
	writeJSON(ASSIGNMENT_HISTORY_FILE, { history });
}

export function assignAgent(tasks, agents, task = null) {
	if (!agents.length) return null;
	const workload = Object.fromEntries(agents.map((a) => [a.name, 0]));
	for (const t of tasks) {
		if (t.agent && workload[t.agent] !== undefined && t.status !== 'done') {
			workload[t.agent] += 1;
		}
	}

	if (task && task.agent) {
		const manual = agents.find((a) => a.name === task.agent);
		if (manual && manual.status === 'available') {
			return manual.name;
		}
	}

	let bestAgent = null;
	let bestScore = -1;
	const text = task
		? `${task.title || ''} ${task.description || ''}`.toLowerCase()
		: '';

	for (const agent of agents) {
		if (agent.status !== 'available') continue;
		const caps = agent.capabilities || [];
		let score = 0;
		for (const cap of caps) {
			if (text.includes(cap.toLowerCase())) {
				score += 1;
			}
		}
		if (
			bestAgent === null ||
			score > bestScore ||
			(score === bestScore && workload[agent.name] < workload[bestAgent.name])
		) {
			bestAgent = agent;
			bestScore = score;
		}
	}

	return bestAgent ? bestAgent.name : null;
}

export function recordAssignment(taskId, agent) {
	const history = loadAssignmentHistory();
	history.push({ taskId, agent, timestamp: new Date().toISOString() });
	saveAssignmentHistory(history);
}

export function computeMetrics(agents, tasks) {
	const metrics = agents.map((a) => ({
		name: a.name,
		available: a.status === 'available',
		assigned: 0,
		completed: 0
	}));
	const map = Object.fromEntries(metrics.map((m) => [m.name, m]));
	for (const t of tasks) {
		if (!t.agent || !map[t.agent]) continue;
		map[t.agent].assigned += 1;
		if (t.status === 'done') {
			map[t.agent].completed += 1;
		}
	}
	return metrics;
}
