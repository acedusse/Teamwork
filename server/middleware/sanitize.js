export default function sanitizeBody(req, _res, next) {
	if (req.body && typeof req.body === 'object') {
		for (const [key, value] of Object.entries(req.body)) {
			if (typeof value === 'string') {
				req.body[key] = value.replace(/[<>]/g, '');
			}
		}
	}
	next();
}
