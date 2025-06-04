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
