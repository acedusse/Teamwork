import logger from '../../mcp-server/src/logger.js';

export default function errorHandler(err, _req, res, _next) {
	logger.error(err);
	res.status(err.status || 500).json({
		error: err.message || 'Internal Server Error'
	});
}
