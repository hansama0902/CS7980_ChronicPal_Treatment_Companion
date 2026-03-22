import bcrypt from 'bcrypt';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client';
import { ILoginDto, IRegisterDto, ITokenPayload } from '../types/auth';
import { BCRYPT_ROUNDS, JWT_ACCESS_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } from '../utils/constants';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import { LoginSchema, RegisterSchema } from '../middleware/validators/authValidator';

const router = Router();

router.post(
  '/register',
  validate(RegisterSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as IRegisterDto;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({ data: { email, passwordHash } });

    const payload: ITokenPayload = { sub: user.id, email: user.email };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: JWT_ACCESS_EXPIRES_IN,
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });

    res.status(201).json({
      success: true,
      data: { accessToken, user: { id: user.id, email: user.email } },
    });
  }),
);

router.post(
  '/login',
  validate(LoginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as ILoginDto;

    const user = await prisma.user.findUnique({ where: { email } });
    const passwordMatch = user ? await bcrypt.compare(password, user.passwordHash) : false;

    // Constant-time rejection — same error whether email or password is wrong
    if (!user || !passwordMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const payload: ITokenPayload = { sub: user.id, email: user.email };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: JWT_ACCESS_EXPIRES_IN,
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { accessToken, user: { id: user.id, email: user.email } },
    });
  }),
);

export default router;
