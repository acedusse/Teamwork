import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import validate from '../middleware/validation.js';
import { GenerateTasksSchema } from '../schemas/generate-tasks.js';
import parsePRD from '../../scripts/modules/task-manager/parse-prd.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRD_FILE =
  process.env.PRD_FILE ||
  path.join(__dirname, '../../.taskmaster/docs/prd.txt');

const TASKS_FILE =
  process.env.TASKS_FILE ||
  path.join(__dirname, '../../.taskmaster/tasks/tasks.json');

router.post('/', validate(GenerateTasksSchema), async (req, res, next) => {
  try {
    const { numTasks, force, append, research } = req.validatedBody;
    const result = await parsePRD(PRD_FILE, TASKS_FILE, numTasks, {
      force,
      append,
      research,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
