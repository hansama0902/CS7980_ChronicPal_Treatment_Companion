import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({ success: false, error: 'Not implemented' }, { status: 501 });
}
