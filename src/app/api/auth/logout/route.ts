import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

function clearAndRedirect() {
  const res = NextResponse.redirect('/login', 303);
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}

export async function POST() {
  return clearAndRedirect();
}

export async function GET() {
  return clearAndRedirect();
}
