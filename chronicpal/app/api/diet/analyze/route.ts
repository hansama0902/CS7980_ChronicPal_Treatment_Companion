import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/routeAuth';
import { analyzeDiet } from '@/services/dietAnalysisService';
import { AnalyzeDietSchema } from '@/validators/dietValidator';
import { AppError } from '@/lib/errors';

export const POST = withAuth(async (userId, req: NextRequest) => {
  const body = await req.json();
  const parsed = AnalyzeDietSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  try {
    const result = await analyzeDiet(
      userId,
      parsed.data.meal ?? '',
      parsed.data.mealType,
      parsed.data.date,
      parsed.data.imageBase64,
      parsed.data.imageMimeType,
    );
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
