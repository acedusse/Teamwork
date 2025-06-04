import fs from 'fs';
import path from 'path';

const logDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
	fs.mkdirSync(logDir);
}

let logStream = fs.createWriteStream(path.join(logDir, 'app.log'), {
	flags: 'a'
});

export function rotateLog() {
	const { size } = fs.statSync(logStream.path);
	const maxSize = 5 * 1024 * 1024; // 5MB
	if (size < maxSize) return;
	logStream.end();
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const rotated = path.join(logDir, `app-${timestamp}.log`);
	fs.renameSync(logStream.path, rotated);
	logStream = fs.createWriteStream(path.join(logDir, 'app.log'), {
		flags: 'a'
	});
}

export function log(level, message, meta = {}) {
	rotateLog();
	const entry = {
		timestamp: new Date().toISOString(),
		level,
		message,
		...meta
	};
	logStream.write(JSON.stringify(entry) + '\n');
	const text = `[${level.toUpperCase()}] ${message}`;
	console[level === 'error' ? 'error' : 'log'](text);
}

export const logger = {
	info: (msg, meta) => log('info', msg, meta),
	warn: (msg, meta) => log('warn', msg, meta),
	error: (msg, meta) => log('error', msg, meta),
	debug: (msg, meta) => log('debug', msg, meta)
};

export default logger;
