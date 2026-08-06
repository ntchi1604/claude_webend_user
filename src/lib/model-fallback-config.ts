export class FallbackConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FallbackConfigError';
  }
}

// Private / link-local / metadata ranges that must never be fetched server-side.
const PRIVATE_HOST_RE =
  /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|::1$|fe80:|fc|fd)/i;
const LOCAL_LABELS = ['localhost', 'metadata', 'metadata.google.internal', 'instance-data'];

export function validateEndpoint(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || !value.trim()) {
    throw new FallbackConfigError('Endpoint phải là một URL hợp lệ');
  }
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new FallbackConfigError('Endpoint phải là một URL hợp lệ');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new FallbackConfigError('Endpoint chỉ hỗ trợ http/https');
  }
  const host = url.hostname.toLowerCase();
  if (PRIVATE_HOST_RE.test(host) || LOCAL_LABELS.some((l) => host === l || host.endsWith(`.${l}`))) {
    throw new FallbackConfigError('Endpoint không được trỏ tới địa chỉ nội bộ/metadata');
  }
  return value.trim().replace(/\/+$/, '');
}

export function normalizeFallbackUpstreams(value: unknown) {
  let parsed: unknown = value == null ? [] : value;
  if (typeof value === 'string') {
    if (!value.trim()) parsed = [];
    else {
      try {
        parsed = JSON.parse(value);
      } catch {
        throw new FallbackConfigError('Fallback upstream phải là một mảng JSON');
      }
    }
  }

  if (!Array.isArray(parsed)) {
    throw new FallbackConfigError('Fallback upstream phải là một mảng JSON');
  }

  const upstreamNames = Array.from(new Set(parsed.map((item) => {
    if (typeof item !== 'string' || !item.trim()) {
      throw new FallbackConfigError('Mỗi fallback upstream phải là một Model.upstreamName');
    }
    return item.trim();
  })));

  return { upstreamNames, serialized: JSON.stringify(upstreamNames) };
}

export function normalizeImageFallbackUpstream(value: unknown) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || !value.trim()) {
    throw new FallbackConfigError('Fallback ảnh phải là một Model.upstreamName');
  }
  return value.trim();
}
