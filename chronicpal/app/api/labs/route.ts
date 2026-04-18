import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/routeAuth';
import { createLab, getLabs } from '@/services/labService';
import { CreateLabSchema, LabQuerySchema } from '@/validators/labValidator';

export const GET = withAuth(async (userId, req) => {
  const { searchParams } = new URL(req.url);
  const query = LabQuerySchema.safeParse({
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
  });
  if (!query.success) {
    return NextResponse.json(
      { success: false, error: query.error.issues[0].message },
      { status: 400 },
    );
  }
  const labs = await getLabs(userId, query.data);
  return NextResponse.json({ success: true, data: labs });
});

export const POST = withAuth(async (userId, req: NextRequest) => {
  const body = await req.json();
  const parsed = CreateLabSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const lab = await createLab(userId, parsed.data);
  return NextResponse.json({ success: true, data: lab }, { status: 201 });
});
