export class FallbackConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FallbackConfigError';
  }
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
