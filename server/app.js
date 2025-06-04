import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../mcp-server/src/logger.js';
import tasksRouter from './routes/tasks.js';
import statusRouter from './routes/status.js';
import mcpRouter from './routes/mcp.js';
import cliRouter from './routes/cli.js';
import sanitizeBody from './middleware/sanitize.js';
import errorHandler from './middleware/error-handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(sanitizeBody);
app.use((req, _res, next) => {
	logger.info(`${req.method} ${req.url}`);
	next();
});
app.use(express.static(path.join(__dirname, '../ui/public')));
app.use('/api/tasks', tasksRouter);
app.use('/api/mcp', mcpRouter);
app.use('/api/cli', cliRouter);
app.use('/api', statusRouter);

// Legacy health check route
app.get('/health', (_req, res) => {
        res.json({ status: 'ok' });
});

// 404 handler
app.use((_req, res) => {
	res.status(404).json({ error: 'Not Found' });
});

app.use(errorHandler);

export default app;
