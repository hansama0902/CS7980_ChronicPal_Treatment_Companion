import { NextRequest, NextResponse } from 'next/server';
import { APIError } from '@anthropic-ai/sdk';
import { withAuth } from '@/lib/routeAuth';
import { generateVisitSummary } from '@/services/summaryGenerator';
import { GenerateSummarySchema } from '@/validators/summaryValidator';
import { AppError } from '@/lib/errors';

export const POST = withAuth(async (userId, req: NextRequest) => {
  const body = await req.json();
  const parsed = GenerateSummarySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  try {
    const result = await generateVisitSummary(
      userId,
      new Date(parsed.data.startDate),
      new Date(parsed.data.endDate),
    );
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode });
    }
    if (err instanceof APIError) {
      console.error('[summary] Anthropic API error', { status: err.status, name: err.name });
      if (err.status === 529) {
        return NextResponse.json(
          {
            success: false,
            error: 'AI service is temporarily busy. Please try again in a moment.',
          },
          { status: 503 },
        );
      }
      return NextResponse.json(
        { success: false, error: 'AI service error. Please try again.' },
        { status: 502 },
      );
    }
    console.error('[summary] Unexpected error', err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { success: false, error: 'Summary generation failed' },
      { status: 500 },
    );
  }
});
