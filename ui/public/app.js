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
let socket;
const statusEl = document.getElementById('connection-status');
let retryTimeout;

function setStatus(state) {
	if (!statusEl) return;
	statusEl.textContent =
		state === 'connected'
			? 'Connected'
			: state === 'connecting'
				? 'Connecting...'
				: 'Disconnected';
	statusEl.classList.remove('connected', 'disconnected');
	if (state === 'connected') statusEl.classList.add('connected');
	if (state === 'disconnected') statusEl.classList.add('disconnected');
}

function handleMessage(event) {
	try {
		const msg = JSON.parse(event.data);
		switch (msg.type) {
			case 'tasks':
				tasks = msg.tasks;
				renderBoard();
				break;
			case 'taskAdded':
				tasks.push(msg.task);
				renderBoard();
				break;
			case 'taskUpdated': {
				const idx = tasks.findIndex((t) => t.id === msg.task.id);
				if (idx !== -1) {
					tasks[idx] = msg.task;
					renderBoard();
				}
				break;
			}
			case 'taskDeleted':
				tasks = tasks.filter((t) => t.id !== msg.id);
				renderBoard();
				break;
			default:
				console.warn('Unknown message', msg);
		}
	} catch (err) {
		console.error('WebSocket message error', err);
	}
}

function connectWebSocket() {
	const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
	setStatus('connecting');
	socket = new WebSocket(`${protocol}://${location.host}`);

	socket.addEventListener('open', () => {
		setStatus('connected');
	});
	socket.addEventListener('message', handleMessage);
	socket.addEventListener('close', () => {
		setStatus('disconnected');
		if (!retryTimeout) {
			retryTimeout = setTimeout(() => {
				retryTimeout = null;
				connectWebSocket();
			}, 3000);
		}
	});
	socket.addEventListener('error', () => {
		socket.close();
	});
}

function createCard(task) {
	const card = document.createElement('div');
	card.className = 'task-card';
	card.draggable = true;
	card.dataset.id = task.id;
	card.dataset.status = task.status;
	card.style.borderLeftColor = priorityColors[task.priority] || '#ccc';

	const title = document.createElement('strong');
	title.textContent = task.title;
	card.appendChild(title);

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
	const query = document.getElementById('task-filter').value.toLowerCase();
	tasks
		.filter(
			(t) =>
				t.title.toLowerCase().includes(query) ||
				(t.description && t.description.toLowerCase().includes(query))
		)
		.forEach((task) => {
			const col = columns[task.status] || columns.pending;
			col.appendChild(createCard(task));
		});
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

document.getElementById('task-filter').addEventListener('input', renderBoard);

async function init() {
	try {
		const res = await fetch('/api/tasks');
		const data = await res.json();
		tasks = data.tasks || [];
		renderBoard();
	} catch (err) {
		console.error('Failed to load tasks', err);
	}
}

init();
connectWebSocket();
