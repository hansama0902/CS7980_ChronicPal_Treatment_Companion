import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  CreateTreatmentSchema,
  TreatmentQuerySchema,
  UpdateTreatmentSchema,
} from '../middleware/validators/treatmentValidator';
import {
  createTreatment,
  deleteTreatment,
  getTreatments,
  updateTreatment,
} from '../services/treatmentService';
import { ICreateTreatmentDto, ITreatmentQuery, IUpdateTreatmentDto } from '../types/treatment';
import { UnauthorizedError } from '../utils/errors';

const router = Router();

// All treatment routes require authentication
router.use(authMiddleware);

// GET /api/treatments?from=<iso>&to=<iso>
router.get(
  '/',
  validate(TreatmentQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    const entries = await getTreatments(req.user.id, req.query as ITreatmentQuery);
    res.json({ success: true, data: entries });
  }),
);

// POST /api/treatments
router.post(
  '/',
  validate(CreateTreatmentSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    const entry = await createTreatment(req.user.id, req.body as ICreateTreatmentDto);
    res.status(201).json({ success: true, data: entry });
  }),
);

// PUT /api/treatments/:id
router.put(
  '/:id',
  validate(UpdateTreatmentSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    const entry = await updateTreatment(req.user.id, req.params.id, req.body as IUpdateTreatmentDto);
    res.json({ success: true, data: entry });
  }),
);

// DELETE /api/treatments/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    await deleteTreatment(req.user.id, req.params.id);
    res.json({ success: true, data: null });
  }),
);

export default router;
