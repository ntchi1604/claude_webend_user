type OpenAIContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

type AnthropicContentPart =
  | { type: 'text'; text: string }
  | {
      type: 'image';
      source: {
        type: 'base64';
        media_type: string;
        data: string;
      };
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseDataUrlImage(url: string) {
  const match = url.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;

  return {
    mediaType: match[1],
    data: match[2]
  };
}

function normalizeTextPart(part: Record<string, unknown>) {
  return typeof part.text === 'string' ? part.text : '';
}

export function normalizeOpenAIMessageContent(content: unknown): string | OpenAIContentPart[] {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return typeof content === 'number' || typeof content === 'boolean' ? String(content) : '';

  const parts: OpenAIContentPart[] = [];
  for (const part of content) {
    if (!isRecord(part) || typeof part.type !== 'string') continue;

    if (part.type === 'text') {
      const text = normalizeTextPart(part);
      if (text) parts.push({ type: 'text', text });
      continue;
    }

    if (part.type === 'image_url' && isRecord(part.image_url) && typeof part.image_url.url === 'string') {
      parts.push({ type: 'image_url', image_url: { url: part.image_url.url } });
    }
  }

  return parts.length > 0 ? parts : '';
}

export function normalizeAnthropicMessageContent(content: unknown): string | AnthropicContentPart[] {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return typeof content === 'number' || typeof content === 'boolean' ? String(content) : '';

  const parts: AnthropicContentPart[] = [];
  for (const part of content) {
    if (!isRecord(part) || typeof part.type !== 'string') continue;

    if (part.type === 'text') {
      const text = normalizeTextPart(part);
      if (text) parts.push({ type: 'text', text });
      continue;
    }

    if (part.type === 'image_url' && isRecord(part.image_url) && typeof part.image_url.url === 'string') {
      const parsed = parseDataUrlImage(part.image_url.url);
      if (!parsed) continue;
      parts.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: parsed.mediaType,
          data: parsed.data
        }
      });
    }
  }

  return parts.length > 0 ? parts : '';
}
