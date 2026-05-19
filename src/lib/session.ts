import { cookies } from 'next/headers';
import { verifySession, type SessionPayload } from './auth';
import { prisma } from './prisma';

export const SESSION_COOKIE = 'cw_session';

export async function getSession(): Promise<SessionPayload | null> {
  const c = (await cookies()).get(SESSION_COOKIE);
  if (!c?.value) return null;
  return verifySession(c.value);
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
