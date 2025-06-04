import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../mcp-server/src/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
	app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
	app.use(express.json());
	app.use((req, _res, next) => {
logger.info(`${req.method} ${req.url}`);
next();
});
	app.use(express.static(path.join(__dirname, '../ui/public')));

// Health check route
app.get('/health', (_req, res) => {
	res.json({ status: 'ok' });
});

// 404 handler
	app.use((_req, res, next) => {
res.status(404);
	res.json({ error: 'Not Found' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
	app.use((err, _req, res, _next) => {
logger.error(err);
res.status(err.status || 500);
	res.json({ error: err.message || 'Internal Server Error' });
});

export default app;
