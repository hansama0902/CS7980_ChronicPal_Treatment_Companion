import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/routeAuth';
import { createSymptom, getSymptoms } from '@/services/symptomService';
import { CreateSymptomSchema, SymptomQuerySchema } from '@/validators/symptomValidator';

export const GET = withAuth(async (userId, req) => {
  const { searchParams } = new URL(req.url);
  const query = SymptomQuerySchema.safeParse({
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
  });
  if (!query.success) {
    return NextResponse.json(
      { success: false, error: query.error.issues[0].message },
      { status: 400 },
    );
  }
  const symptoms = await getSymptoms(userId, query.data);
  return NextResponse.json({ success: true, data: symptoms });
});

export const POST = withAuth(async (userId, req: NextRequest) => {
  const body = await req.json();
  const parsed = CreateSymptomSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const symptom = await createSymptom(userId, parsed.data);
  return NextResponse.json({ success: true, data: symptom }, { status: 201 });
});
