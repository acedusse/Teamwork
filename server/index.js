#!/usr/bin/env node
import dotenv from 'dotenv';
import app from './app.js';
import logger from '../mcp-server/src/logger.js';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.listen(PORT, () => {
logger.info(`Express server listening on port ${PORT}`);
});

