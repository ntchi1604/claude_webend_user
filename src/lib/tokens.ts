import { getEncoding, Tiktoken } from 'js-tiktoken';

let enc: Tiktoken | null = null;
function getEnc() {
  if (!enc) enc = getEncoding('cl100k_base');
  return enc;
}

export function countTokens(text: string): number {
  if (!text) return 0;
  try {
    return getEnc().encode(text).length;
  } catch {
    return Math.ceil(text.length / 4);
  }
}

export function countMessagesTokens(messages: Array<{ role: string; content: any }>): number {
  let total = 0;
  for (const m of messages) {
    if (typeof m.content === 'string') total += countTokens(m.content);
    else if (Array.isArray(m.content)) {
      for (const part of m.content) {
        if (typeof part?.text === 'string') total += countTokens(part.text);
      }
    }
    total += 4; // role + separators overhead
  }
  return total + 2;
}
