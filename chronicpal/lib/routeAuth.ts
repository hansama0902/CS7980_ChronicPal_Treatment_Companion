import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { AppError } from '@/lib/errors';

type RouteHandler<P = Record<string, string>> = (
  userId: string,
  req: NextRequest,
  params: P,
) => Promise<NextResponse>;

/**
 * Wraps a Route Handler with session auth check and error handling.
 * Injects the authenticated userId and resolved params into the handler.
 */
export function withAuth<P = Record<string, string>>(handler: RouteHandler<P>) {
  return async (req: NextRequest, ctx: { params: Promise<P> }): Promise<NextResponse> => {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      const params = await ctx.params;
      return await handler(session.user.id, req, params);
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode },
        );
      }
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  };
}
