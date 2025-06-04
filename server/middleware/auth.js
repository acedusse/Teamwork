export default function authenticate(req, res, next) {
	const expected = process.env.API_TOKEN;
	if (expected) {
		const authHeader = req.get('Authorization') || '';
		const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
		if (token !== expected) {
			res.status(401).json({ error: 'Unauthorized' });
			return;
		}
	}
	next();
}
