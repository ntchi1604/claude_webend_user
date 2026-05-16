import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

function clearAndRedirect(req: NextRequest) {
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const base = `${proto}://${host}`;
  const url = new URL('/login', base);
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
