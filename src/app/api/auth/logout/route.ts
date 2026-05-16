import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

function clearAndRedirect(req: NextRequest) {
  const url = new URL('/login', req.url);
  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}

export async function POST(req: NextRequest) {
  return clearAndRedirect(req);
}

export async function GET(req: NextRequest) {
  return clearAndRedirect(req);
}
