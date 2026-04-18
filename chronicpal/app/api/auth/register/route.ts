import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { RegisterSchema } from '@/validators/authValidator';
import { AppError, BadRequestError } from '@/lib/errors';
import { BCRYPT_ROUNDS } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({ data: { email, passwordHash } });

    return NextResponse.json(
      { success: true, data: { user: { id: user.id, email: user.email } } },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
