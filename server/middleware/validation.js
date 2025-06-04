import { ZodError } from 'zod';

export default function validate(schema) {
	return (req, res, next) => {
		try {
			const data = schema.parse(req.body);
			req.validatedBody = data;
			next();
		} catch (err) {
			if (err instanceof ZodError) {
				res.status(400).json({ error: 'Invalid data', details: err.errors });
			} else {
				next(err);
			}
		}
	};
}
