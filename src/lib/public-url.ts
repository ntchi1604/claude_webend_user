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

  const forwardedProto = cleanHeader(headerStore.get('x-forwarded-proto')).toLowerCase();
  const protocol = forwardedProto === 'http' || forwardedProto === 'https'
    ? forwardedProto
    : host.startsWith('localhost') || host.startsWith('127.0.0.1')
      ? 'http'
      : 'https';

  return host ? `${protocol}://${host}` : '';
}

