import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/routeAuth';
import { createDietEntry, getDietEntries } from '@/services/dietService';
import { CreateDietSchema, DietQuerySchema } from '@/validators/dietValidator';

export const GET = withAuth(async (userId, req) => {
  const { searchParams } = new URL(req.url);
  const query = DietQuerySchema.safeParse({
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
  });
  if (!query.success) {
    return NextResponse.json(
      { success: false, error: query.error.issues[0].message },
      { status: 400 },
    );
  }
  const entries = await getDietEntries(userId, query.data);
  return NextResponse.json({ success: true, data: entries });
});

export const POST = withAuth(async (userId, req: NextRequest) => {
  const body = await req.json();
  const parsed = CreateDietSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const entry = await createDietEntry(userId, parsed.data);
  return NextResponse.json({ success: true, data: entry }, { status: 201 });
});
