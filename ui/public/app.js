const priorityColors = {
	high: '#e74c3c',
	medium: '#f1c40f',
	low: '#2ecc71'
};

const statusClasses = {
	pending: 'status-pending',
	'in-progress': 'status-progress',
	review: 'status-review',
	done: 'status-done'
};

let tasks = [];

let agents = [];

let savedFilters = [];

let editId = null;

let socket = null;

function connectWebSocket() {
	const statusEl = document.getElementById('connection-status');
	const proto = location.protocol === 'https:' ? 'wss' : 'ws';
	const url = `${proto}://${location.host}`;
	socket = new WebSocket(url);
	socket.addEventListener('open', () => {
		statusEl.textContent = 'Connected';
		statusEl.classList.remove('disconnected');
		statusEl.classList.add('connected');
	});
	socket.addEventListener('close', () => {
		statusEl.textContent = 'Disconnected';
		statusEl.classList.remove('connected');
		statusEl.classList.add('disconnected');
		setTimeout(connectWebSocket, 3000);
	});
	socket.addEventListener('message', (e) => {
		try {
			const msg = JSON.parse(e.data);
			if (msg.type === 'tasksUpdated' && Array.isArray(msg.tasks)) {
				tasks = msg.tasks;
				renderBoard();
			}
		} catch (err) {
			console.error('Invalid message', err);
		}
	});
}

const modal = document.getElementById('task-modal');
const form = document.getElementById('task-form');

function showModal() {
	modal.classList.remove('hidden');
}

function hideModal() {
	modal.classList.add('hidden');
	form.reset();
}

function highlightText(text, query) {
	if (!query) return text;
	const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return text.replace(
		new RegExp(escaped, 'gi'),
		(m) => `<span class="highlight">${m}</span>`
	);
}

function createCard(task, query) {
	const card = document.createElement('div');
	card.className = 'task-card';
	card.draggable = true;
	card.dataset.id = task.id;
	card.dataset.status = task.status;
	card.style.borderLeftColor = priorityColors[task.priority] || '#ccc';

	const title = document.createElement('strong');
	title.innerHTML = highlightText(task.title, query);
	card.appendChild(title);

	if (task.description) {
		const desc = document.createElement('p');
		desc.innerHTML = highlightText(task.description, query);
		card.appendChild(desc);
	}

	const status = document.createElement('span');
	status.className = `status ${statusClasses[task.status] || ''}`;
	status.textContent = task.status;
	card.appendChild(status);

	card.addEventListener('dragstart', (e) => {
		e.dataTransfer.setData('text/plain', task.id);
	});

	return card;
}

const columns = {
	pending: document.querySelector('.column[data-status="pending"]'),
	'in-progress': document.querySelector('.column[data-status="in-progress"]'),
	review: document.querySelector('.column[data-status="review"]'),
	done: document.querySelector('.column[data-status="done"]')
};

function renderBoard() {
	Object.values(columns).forEach((col) => {
		col.querySelectorAll('.task-card').forEach((c) => c.remove());
	});
	const query = document
		.getElementById('task-filter')
		.value.trim()
		.toLowerCase();
	const agentF = document.getElementById('agent-filter').value;
	const epicF = document.getElementById('epic-filter').value;
	const priorityF = document.getElementById('priority-filter').value;

	tasks
		.filter((t) => {
			const matchesQuery =
				!query ||
				t.title.toLowerCase().includes(query) ||
				(t.description && t.description.toLowerCase().includes(query));
			const matchesAgent = !agentF || t.agent === agentF;
			const matchesEpic = !epicF || t.epic === epicF;
			const matchesPriority = !priorityF || t.priority === priorityF;
			return matchesQuery && matchesAgent && matchesEpic && matchesPriority;
		})
		.forEach((task) => {
			const col = columns[task.status] || columns.pending;
			col.appendChild(createCard(task, query));
		});
}

function renderAgents() {
	const list = document.getElementById('agent-list');
	if (!list) return;
	list.innerHTML = '';
	agents.forEach((a) => {
		const li = document.createElement('li');
		const caps = a.capabilities ? a.capabilities.join(', ') : '';
		li.textContent = `${a.name} - ${a.status}${caps ? ` (${caps})` : ''}`;
		list.appendChild(li);
	});
}

function updateFilterOptions() {
	const agentSel = document.getElementById('agent-filter');
	const epicSel = document.getElementById('epic-filter');
	const agentsSet = [...new Set(tasks.map((t) => t.agent).filter(Boolean))];
	const epicsSet = [...new Set(tasks.map((t) => t.epic).filter(Boolean))];
	agentSel
		.querySelectorAll('option:not(:first-child)')
		.forEach((o) => o.remove());
	epicSel
		.querySelectorAll('option:not(:first-child)')
		.forEach((o) => o.remove());
	agentsSet.forEach((a) => {
		const opt = document.createElement('option');
		opt.value = a;
		opt.textContent = a;
		agentSel.appendChild(opt);
	});
	epicsSet.forEach((e) => {
		const opt = document.createElement('option');
		opt.value = e;
		opt.textContent = e;
		epicSel.appendChild(opt);
	});
}

function loadSavedFilters() {
	try {
		savedFilters = JSON.parse(localStorage.getItem('savedFilters')) || [];
	} catch {
		savedFilters = [];
	}
}

function renderSavedFilterOptions() {
	const sel = document.getElementById('saved-filters');
	sel.innerHTML = '<option value="">Saved filters</option>';
	savedFilters.forEach((f, i) => {
		const opt = document.createElement('option');
		opt.value = i;
		opt.textContent = f.name;
		sel.appendChild(opt);
	});
}

function saveCurrentFilter() {
	const name = prompt('Filter name?');
	if (!name) return;
	const filter = {
		name,
		query: document.getElementById('task-filter').value.trim(),
		agent: document.getElementById('agent-filter').value,
		epic: document.getElementById('epic-filter').value,
		priority: document.getElementById('priority-filter').value
	};
	savedFilters.push(filter);
	localStorage.setItem('savedFilters', JSON.stringify(savedFilters));
	renderSavedFilterOptions();
}

function applyFilterSet(index) {
	const f = savedFilters[index];
	if (!f) return;
	document.getElementById('task-filter').value = f.query;
	document.getElementById('agent-filter').value = f.agent;
	document.getElementById('epic-filter').value = f.epic;
	document.getElementById('priority-filter').value = f.priority;
	renderBoard();
}

Object.values(columns).forEach((col) => {
	col.addEventListener('dragover', (e) => {
		e.preventDefault();
		col.classList.add('dragover');
	});
	col.addEventListener('dragleave', () => {
		col.classList.remove('dragover');
	});
	col.addEventListener('drop', (e) => {
		e.preventDefault();
		col.classList.remove('dragover');
		const id = e.dataTransfer.getData('text/plain');
		const task = tasks.find((t) => String(t.id) === id);
		if (task) {
			task.status = col.dataset.status;
			renderBoard();
			if (socket && socket.readyState === WebSocket.OPEN) {
				socket.send(JSON.stringify({ type: 'taskUpdated', task }));
			}
		}
	});
});

document.querySelector('.board').addEventListener('click', (e) => {
	const card = e.target.closest('.task-card');
	if (!card) return;
	const task = tasks.find((t) => String(t.id) === card.dataset.id);
	if (task) {
		editId = task.id;
		form.title.value = task.title;
		form.description.value = task.description;
		form.priority.value = task.priority || 'medium';
		form.status.value = task.status || 'pending';
		form.agent.value = task.agent || '';
		form.epic.value = task.epic || '';
		document.getElementById('modal-title').textContent = 'Edit Task';
		showModal();
	}
});

document.getElementById('task-filter').addEventListener('input', renderBoard);
document.getElementById('agent-filter').addEventListener('change', renderBoard);
document.getElementById('epic-filter').addEventListener('change', renderBoard);
document
	.getElementById('priority-filter')
	.addEventListener('change', renderBoard);
document
	.getElementById('save-filter')
	.addEventListener('click', saveCurrentFilter);
document.getElementById('saved-filters').addEventListener('change', (e) => {
	if (e.target.value) applyFilterSet(Number(e.target.value));
});
document.querySelectorAll('.quick-filters button').forEach((btn) => {
	btn.addEventListener('click', () => {
		document.getElementById('priority-filter').value = btn.dataset.priority;
		renderBoard();
	});
});

document.getElementById('create-task-link').addEventListener('click', (e) => {
	e.preventDefault();
	editId = null;
	form.reset();
	document.getElementById('modal-title').textContent = 'Create Task';
	showModal();
});

document.getElementById('task-cancel').addEventListener('click', (e) => {
	e.preventDefault();
	hideModal();
});

form.addEventListener('submit', async (e) => {
	e.preventDefault();
	const payload = {
		title: form.title.value.trim(),
		description: form.description.value.trim(),
		priority: form.priority.value,
		status: form.status.value,
		agent: form.agent.value,
		epic: form.epic.value
	};
	if (!payload.title || !payload.description) {
		alert('Title and description are required');
		return;
	}
	try {
		let res;
		if (editId) {
			res = await fetch(`/api/tasks/${editId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
		} else {
			res = await fetch('/api/tasks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
		}
		if (!res.ok) throw new Error('Request failed');
		const data = await res.json();
		if (editId) {
			const index = tasks.findIndex((t) => t.id === editId);
			tasks[index] = data;
		} else {
			tasks.push(data);
		}
		hideModal();
		renderBoard();
	} catch (err) {
		console.error('Failed to save task', err);
	}
});

async function init() {
	try {
		const res = await fetch('/api/tasks');
		const data = await res.json();
		tasks = data.tasks || [];
		updateFilterOptions();
		renderBoard();
	} catch (err) {
		console.error('Failed to load tasks', err);
	}
}

loadSavedFilters();
renderSavedFilterOptions();
init();
connectWebSocket();

async function loadMetrics() {
	try {
		const [velRes, burnRes] = await Promise.all([
			fetch('/api/velocity'),
			fetch('/api/burndown')
		]);
		const velocity = await velRes.json();
		const burndown = await burnRes.json();
		renderVelocityChart(velocity.data || []);
		renderBurndownChart(burndown.data || []);
	} catch (err) {
		console.error('Failed to load metrics', err);
	}
}

function renderVelocityChart(data) {
	const ctx = document.getElementById('velocityChart');
	if (!ctx) return;
	new Chart(ctx, {
		type: 'bar',
		data: {
			labels: data.map((d) => d.date),
			datasets: [
				{
					label: 'Tasks Completed',
					data: data.map((d) => d.count),
					backgroundColor: '#667eea'
				}
			]
		}
	});
}

function renderBurndownChart(data) {
	const ctx = document.getElementById('burndownChart');
	if (!ctx) return;
	new Chart(ctx, {
		type: 'line',
		data: {
			labels: data.map((d) => d.date),
			datasets: [
				{
					label: 'Remaining Tasks',
					data: data.map((d) => d.remaining),
					borderColor: '#e74c3c',
					fill: false
				}
			]
		}
	});
}

loadMetrics();
