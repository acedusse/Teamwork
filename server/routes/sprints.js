import express from 'express';
import validate from '../middleware/validation.js';
import { SprintSchema } from '../schemas/sprint.js';
import { broadcast } from '../websocket.js';
import { loadSprints, saveSprints, autoPlan, computeMetrics } from '../utils/sprints.js';

const router = express.Router();

router.get('/', (req, res, next) => {
  try {
    const sprints = loadSprints();
    res.json({ sprints });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(SprintSchema), (req, res, next) => {
  try {
    const sprints = loadSprints();
    const newId = sprints.length ? Math.max(...sprints.map((s) => s.id || 0)) + 1 : 1;
    const newSprint = {
      id: newId,
      ...req.validatedBody,
      createdAt: new Date().toISOString(),
      tasks: req.validatedBody.tasks || []
    };
    sprints.push(newSprint);
    saveSprints(sprints);
    broadcast({ type: 'sprintsUpdated', sprints });
    res.status(201).json(newSprint);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validate(SprintSchema.partial()), (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const sprints = loadSprints();
    const index = sprints.findIndex((s) => s.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Sprint not found' });
      return;
    }
    sprints[index] = { ...sprints[index], ...req.validatedBody };
    saveSprints(sprints);
    broadcast({ type: 'sprintsUpdated', sprints });
    res.json(sprints[index]);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/plan', (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const sprints = loadSprints();
    const sprint = autoPlan(sprints, id);
    if (!sprint) {
      res.status(404).json({ error: 'Sprint not found' });
      return;
    }
    saveSprints(sprints);
    broadcast({ type: 'sprintsUpdated', sprints });
    res.json(sprint);
  } catch (err) {
    next(err);
  }
});

router.get('/metrics', (req, res, next) => {
  try {
    const sprints = loadSprints();
    const metrics = computeMetrics(sprints);
    res.json({ metrics });
  } catch (err) {
    next(err);
  }
});

export default router;
