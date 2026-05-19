import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { verifySession, type SessionPayload } from './auth';
import { prisma } from './prisma';

export const SESSION_COOKIE = 'cw_session';

export async function getSession(): Promise<SessionPayload | null> {
  const store = cookies();
  const c = store.get(SESSION_COOKIE);
  if (!c?.value) return null;
  return verifySession(c.value);
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) return verifySession(token);
  return null;
}

export async function getCurrentUser() {
  const s = await getSession();
  if (!s) return null;
  return prisma.user.findUnique({ where: { id: s.uid } });
}

export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) throw new Error('UNAUTHORIZED');
  if (u.banned) throw new Error('BANNED');
  return u;
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== 'ADMIN') throw new Error('FORBIDDEN');
  return u;
}
