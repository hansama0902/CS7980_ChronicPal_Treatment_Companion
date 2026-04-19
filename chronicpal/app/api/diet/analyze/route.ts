import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/routeAuth';
import { analyzeDiet } from '@/services/aiService';
import { AnalyzeDietSchema } from '@/validators/dietValidator';

export const POST = withAuth(async (userId, req: NextRequest) => {
  const body = await req.json();
  const parsed = AnalyzeDietSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const result = await analyzeDiet(userId, parsed.data.meal, parsed.data.mealType, parsed.data.date);
  return NextResponse.json({ success: true, data: result });
});
