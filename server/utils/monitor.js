import cron from 'node-cron';
import os from 'os';
import process from 'process';

const metrics = {
	requests: 0,
	errors: 0,
	responseTimes: [],
	start: Date.now()
};

export function metricsMiddleware(req, res, next) {
	const start = process.hrtime();
	metrics.requests += 1;
	res.on('finish', () => {
		const diff = process.hrtime(start);
		const ms = diff[0] * 1000 + diff[1] / 1e6;
		metrics.responseTimes.push(ms);
	});
	next();
}

export function recordError() {
	metrics.errors += 1;
}

export function getMetrics() {
	const avgResponseTime =
		metrics.responseTimes.reduce((a, b) => a + b, 0) /
		(metrics.responseTimes.length || 1);
	return {
		uptime: process.uptime(),
		memoryUsage: process.memoryUsage().rss,
		cpuLoad: os.loadavg()[0],
		requests: metrics.requests,
		errors: metrics.errors,
		avgResponseTime
	};
}

export function scheduleLogRotation(rotateFn) {
	cron.schedule('0 0 * * *', rotateFn);
}
