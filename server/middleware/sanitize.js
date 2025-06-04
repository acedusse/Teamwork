function sanitizeObject(obj) {
	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === 'string') {
			obj[key] = value.replace(/[<>]/g, '');
		}
	}
}

export default function sanitizeInputs(req, _res, next) {
	if (req.body && typeof req.body === 'object') {
		sanitizeObject(req.body);
	}
	if (req.query && typeof req.query === 'object') {
		sanitizeObject(req.query);
	}
	if (req.params && typeof req.params === 'object') {
		sanitizeObject(req.params);
	}
	next();
}
