import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const ActionSchema = z.object({
  linkId: z.string().min(1),
  action: z.enum(['APPROVE', 'REJECT', 'REVOKE']),
});

/** GET /api/patient/links — list pending (non-expired) and active caregiver link requests */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'PATIENT') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date();

  const [pending, active] = await Promise.all([
    prisma.caregiverLink.findMany({
      where: {
        patientId: session.user.id,
        status: 'PENDING',
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: { caregiver: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.caregiverLink.findMany({
      where: { patientId: session.user.id, status: 'ACTIVE' },
      include: { caregiver: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      pending: pending.map((l) => ({
        id: l.id,
        caregiverEmail: l.caregiver.email,
        requestedAt: l.createdAt,
        expiresAt: l.expiresAt,
      })),
      active: active.map((l) => ({
        id: l.id,
        caregiverEmail: l.caregiver.email,
        linkedSince: l.createdAt,
      })),
    },
  });
}

/** PATCH /api/patient/links — approve, reject, or revoke a caregiver link */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'PATIENT') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { linkId, action } = parsed.data;

  const link = await prisma.caregiverLink.findUnique({ where: { id: linkId } });
  if (!link || link.patientId !== session.user.id) {
    return NextResponse.json({ success: false, error: 'Link not found' }, { status: 404 });
  }

  if (action === 'REVOKE') {
    if (link.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Only active links can be revoked' },
        { status: 409 },
      );
    }
    await prisma.caregiverLink.update({ where: { id: linkId }, data: { status: 'REVOKED' } });
    return NextResponse.json({ success: true });
  }

  // APPROVE / REJECT only valid for PENDING
  if (link.status !== 'PENDING') {
    return NextResponse.json({ success: false, error: 'Link is not pending' }, { status: 409 });
  }

  // Check expiry before approving
  if (action === 'APPROVE' && link.expiresAt && link.expiresAt < new Date()) {
    await prisma.caregiverLink.delete({ where: { id: linkId } });
    return NextResponse.json(
      {
        success: false,
        error: 'This invite has expired. Ask the caregiver to send a new request.',
      },
      { status: 410 },
    );
  }

  if (action === 'APPROVE') {
    await prisma.caregiverLink.update({ where: { id: linkId }, data: { status: 'ACTIVE' } });
  } else {
    await prisma.caregiverLink.delete({ where: { id: linkId } });
  }

  return NextResponse.json({ success: true });
}
