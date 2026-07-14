import { headers } from 'next/headers';

function cleanHeader(value: string | null) {
  return value?.split(',')[0]?.replace(/[\r\n]/g, '').trim() || '';
}

function cleanHost(value: string | null) {
  const host = cleanHeader(value).toLowerCase();
  return /^(\[[0-9a-f:.]+\]|[a-z0-9.-]+)(:\d{1,5})?$/i.test(host) ? host : '';
}

export function getPublicOrigin() {
  const headerStore = headers();
  const host =
    cleanHost(headerStore.get('x-forwarded-host')) ||
    cleanHost(headerStore.get('host'));

  const hostname = host.startsWith('[')
    ? host.slice(1, host.indexOf(']')).toLowerCase()
    : host.split(':')[0].toLowerCase();
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  const protocol = isLocal ? 'http' : 'https';

  return host ? `${protocol}://${host}` : '';
}
