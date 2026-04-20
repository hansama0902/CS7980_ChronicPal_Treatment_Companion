import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';

const LinkRequestSchema = z.object({
  patientEmail: z.string().email({ message: 'Please provide a valid patient email' }),
});

const INVITE_TTL_MS = 48 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'CAREGIVER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = LinkRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { patientEmail } = parsed.data;
    const caregiverId = session.user.id;

    const patient = await prisma.user.findUnique({ where: { email: patientEmail } });
    if (!patient || patient.role !== 'PATIENT') {
      return NextResponse.json(
        { success: false, error: 'No patient account found with that email' },
        { status: 404 },
      );
    }

    const existing = await prisma.caregiverLink.findUnique({
      where: { caregiverId_patientId: { caregiverId, patientId: patient.id } },
    });
    if (existing) {
      if (existing.status === 'ACTIVE') {
        return NextResponse.json(
          { success: false, error: 'You are already linked to this patient' },
          { status: 409 },
        );
      }
      if (existing.status === 'PENDING') {
        return NextResponse.json(
          { success: false, error: 'A link request is already pending for this patient' },
          { status: 409 },
        );
      }
      // REVOKED — allow re-requesting by deleting and recreating
      await prisma.caregiverLink.delete({ where: { id: existing.id } });
    }

    await prisma.caregiverLink.create({
      data: {
        caregiverId,
        patientId: patient.id,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
