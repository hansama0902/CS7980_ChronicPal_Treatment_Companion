import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/routeAuth';
import { updateSymptom, deleteSymptom } from '@/services/symptomService';
import { UpdateSymptomSchema } from '@/validators/symptomValidator';

export const PUT = withAuth<{ id: string }>(async (userId, req: NextRequest, params) => {
  const body = await req.json();
  const parsed = UpdateSymptomSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const symptom = await updateSymptom(userId, params.id, parsed.data);
  return NextResponse.json({ success: true, data: symptom });
});

export const DELETE = withAuth<{ id: string }>(async (userId, _req, params) => {
  await deleteSymptom(userId, params.id);
  return NextResponse.json({ success: true });
});
