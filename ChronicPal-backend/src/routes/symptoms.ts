import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  CreateSymptomSchema,
  SymptomQuerySchema,
  UpdateSymptomSchema,
} from '../middleware/validators/symptomValidator';
import {
  createSymptom,
  deleteSymptom,
  getSymptoms,
  updateSymptom,
} from '../services/symptomService';
import { ICreateSymptomDto, IUpdateSymptomDto } from '../types/symptom';
import { DateRangeQuery } from '../middleware/validators/shared';
import { UnauthorizedError } from '../utils/errors';

const router = Router();

// All symptom routes require authentication
router.use(authMiddleware);

// GET /api/symptoms?from=<iso>&to=<iso>
router.get(
  '/',
  validate(SymptomQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    const entries = await getSymptoms(req.user.id, req.query as DateRangeQuery);
    res.json({ success: true, data: entries });
  }),
);

// POST /api/symptoms
router.post(
  '/',
  validate(CreateSymptomSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    const entry = await createSymptom(req.user.id, req.body as ICreateSymptomDto);
    res.status(201).json({ success: true, data: entry });
  }),
);

// PUT /api/symptoms/:id
router.put(
  '/:id',
  validate(UpdateSymptomSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    const entry = await updateSymptom(req.user.id, req.params.id, req.body as IUpdateSymptomDto);
    res.json({ success: true, data: entry });
  }),
);

// DELETE /api/symptoms/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    await deleteSymptom(req.user.id, req.params.id);
    res.json({ success: true, data: null });
  }),
);

export default router;
