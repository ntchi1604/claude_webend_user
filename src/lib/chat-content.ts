export type ChatContentBlock = {
  type?: string;
  text?: unknown;
  content?: unknown;
  image_url?: { url?: string };
  [key: string]: unknown;
};

export function stringifyChatContent(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value == null) return '';

  if (Array.isArray(value)) {
    return value
      .map((item) => stringifyChatContent(item))
      .filter(Boolean)
      .join('');
  }

  if (typeof value === 'object') {
    const block = value as ChatContentBlock;

    if (typeof block.text === 'string') return block.text;
    if (block.type === 'input_text' || block.type === 'output_text' || block.type === 'text') {
      return stringifyChatContent(block.text ?? block.content ?? '');
    }
    if ('content' in block) return stringifyChatContent(block.content);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function parseStoredChatContent(raw: string): string | ChatContentBlock[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : stringifyChatContent(parsed);
  } catch {
    return raw;
  }
}

