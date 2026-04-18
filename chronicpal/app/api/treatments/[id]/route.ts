import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/routeAuth';
import { updateTreatment, deleteTreatment } from '@/services/treatmentService';
import { UpdateTreatmentSchema } from '@/validators/treatmentValidator';

export const PUT = withAuth<{ id: string }>(async (userId, req: NextRequest, params) => {
  const body = await req.json();
  const parsed = UpdateTreatmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const treatment = await updateTreatment(userId, params.id, parsed.data);
  return NextResponse.json({ success: true, data: treatment });
});

export const DELETE = withAuth<{ id: string }>(async (userId, _req, params) => {
  await deleteTreatment(userId, params.id);
  return NextResponse.json({ success: true });
});
