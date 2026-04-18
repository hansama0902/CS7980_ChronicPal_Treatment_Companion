import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/routeAuth';
import { createTreatment, getTreatments } from '@/services/treatmentService';
import { CreateTreatmentSchema, TreatmentQuerySchema } from '@/validators/treatmentValidator';

export const GET = withAuth(async (userId, req) => {
  const { searchParams } = new URL(req.url);
  const query = TreatmentQuerySchema.safeParse({
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
  });
  if (!query.success) {
    return NextResponse.json(
      { success: false, error: query.error.issues[0].message },
      { status: 400 },
    );
  }
  const treatments = await getTreatments(userId, query.data);
  return NextResponse.json({ success: true, data: treatments });
});

export const POST = withAuth(async (userId, req: NextRequest) => {
  const body = await req.json();
  const parsed = CreateTreatmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const treatment = await createTreatment(userId, parsed.data);
  return NextResponse.json({ success: true, data: treatment }, { status: 201 });
});
