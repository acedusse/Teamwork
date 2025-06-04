import logger from '../utils/logger.js';
import { recordError } from '../utils/monitor.js';

export default function errorHandler(err, _req, res, _next) {
	recordError();
	logger.error(err.stack || err.toString());
	res.status(err.status || 500).json({
		error: err.message || 'Internal Server Error'
	});
}
