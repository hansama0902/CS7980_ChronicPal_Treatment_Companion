import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/routeAuth';
import { updateLab, deleteLab } from '@/services/labService';
import { UpdateLabSchema } from '@/validators/labValidator';

export const PUT = withAuth<{ id: string }>(async (userId, req: NextRequest, params) => {
  const body = await req.json();
  const parsed = UpdateLabSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const lab = await updateLab(userId, params.id, parsed.data);
  return NextResponse.json({ success: true, data: lab });
});

export const DELETE = withAuth<{ id: string }>(async (userId, _req, params) => {
  await deleteLab(userId, params.id);
  return NextResponse.json({ success: true });
});
