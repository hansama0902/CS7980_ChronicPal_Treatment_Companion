import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateLabSchema, LabQuerySchema } from '../middleware/validators/labValidator';
import { createLab, getLabs } from '../services/labService';
import { ICreateLabDto, ILabQuery } from '../types/lab';
import { UnauthorizedError } from '../utils/errors';

const router = Router();

router.use(authMiddleware);

// GET /api/labs?from=<iso>&to=<iso>
router.get(
  '/',
  validate(LabQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    const results = await getLabs(req.user.id, req.query as ILabQuery);
    res.json({ success: true, data: results });
  }),
);

// POST /api/labs
router.post(
  '/',
  validate(CreateLabSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await createLab(req.user.id, req.body as ICreateLabDto);
    res.status(201).json({ success: true, data: result });
  }),
);

export default router;
