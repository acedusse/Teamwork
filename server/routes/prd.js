import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import validate from '../middleware/validation.js';
import { PRDSchema } from '../schemas/prd.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRD_FILE =
  process.env.PRD_FILE ||
  path.join(__dirname, '../../.taskmaster/docs/prd.txt');

router.get('/', (_req, res, next) => {
  try {
    const content = fs.existsSync(PRD_FILE)
      ? fs.readFileSync(PRD_FILE, 'utf8')
      : '';
    res.json({ content });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(PRDSchema), (req, res, next) => {
  try {
    const { content } = req.validatedBody;
    const dir = path.dirname(PRD_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PRD_FILE, content, 'utf8');
    res.json({ content });
  } catch (err) {
    next(err);
  }
});

export default router;
