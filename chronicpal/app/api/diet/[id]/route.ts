import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/routeAuth';
import { softDeleteDietEntry, updateDietEntry } from '@/services/dietService';
import { UpdateDietSchema } from '@/validators/dietValidator';

export const DELETE = withAuth<{ id: string }>(async (userId, _req, params) => {
  await softDeleteDietEntry(userId, params.id);
  return NextResponse.json({ success: true });
});

export const PUT = withAuth<{ id: string }>(async (userId, req: NextRequest, params) => {
  const body = await req.json();
  const parsed = UpdateDietSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const entry = await updateDietEntry(userId, params.id, parsed.data);
  return NextResponse.json({ success: true, data: entry });
});
