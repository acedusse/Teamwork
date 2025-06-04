import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../mcp-server/src/logger.js';
import tasksRouter from './routes/tasks.js';
import statusRouter from './routes/status.js';
import prdRouter from './routes/prd.js';
import generateTasksRouter from './routes/generate-tasks.js';
import agentsRouter from './routes/agents.js';
import mcpRouter from './routes/mcp.js';
import sanitizeBody from './middleware/sanitize.js';
import errorHandler from './middleware/error-handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  app.use(helmet());
  app.set('trust proxy', 1);
}

// Middleware

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(sanitizeBody);
app.use((req, _res, next) => {
	logger.info(`${req.method} ${req.url}`);
	next();
});
const staticDir = isProd
  ? path.join(__dirname, '../dist/public')
  : path.join(__dirname, '../ui/public');
app.use(express.static(staticDir));
app.use('/api/tasks', tasksRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/prd', prdRouter);
app.use('/api/generate-tasks', generateTasksRouter);
app.use('/api/mcp', mcpRouter);
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
