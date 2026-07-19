import { stringifyChatContent } from '@/lib/chat-content';

type LanguageInstruction = {
  targetLabel: string;
  allowChinese: boolean;
  instruction: string;
};

const CHINESE_SCRIPT_RE = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;
const VIETNAMESE_HINT_RE = /[ăâđêôơưĂÂĐÊÔƠƯàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/;

const EXPLICIT_LANGUAGE_PATTERNS: Array<{ pattern: RegExp; label: string; allowChinese?: boolean }> = [
  { pattern: /\b(reply|respond|answer|write|explain|dịch|trả lời|viết|giải thích)\b[\s\S]{0,40}\b(tiếng việt|vietnamese)\b/i, label: 'Vietnamese' },
  { pattern: /\b(reply|respond|answer|write|explain|dịch|trả lời|viết|giải thích)\b[\s\S]{0,40}\b(english|tiếng anh)\b/i, label: 'English' },
  { pattern: /\b(reply|respond|answer|write|explain|dịch|trả lời|viết|giải thích)\b[\s\S]{0,40}\b(chinese|tiếng trung|中文|汉语|漢語)\b/i, label: 'Chinese', allowChinese: true },
  { pattern: /\b(in|bằng|use)\s+(vietnamese|tiếng việt)\b/i, label: 'Vietnamese' },
  { pattern: /\b(in|bằng|use)\s+(english|tiếng anh)\b/i, label: 'English' },
  { pattern: /\b(in|bằng|use)\s+(chinese|tiếng trung|中文|汉语|漢語)\b/i, label: 'Chinese', allowChinese: true }
];

function getLastUserText(messages: Array<{ role?: string; content?: unknown }>) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message?.role !== 'user') continue;
    const text = stringifyChatContent(message.content).trim();
    if (text) return text;
  }
  return '';
}

export function buildLanguageInstruction(messages: Array<{ role?: string; content?: unknown }>): LanguageInstruction {
  const userText = getLastUserText(messages);

  for (const { pattern, label, allowChinese } of EXPLICIT_LANGUAGE_PATTERNS) {
    if (pattern.test(userText)) {
      return {
        targetLabel: label,
        allowChinese: !!allowChinese,
        instruction: allowChinese
          ? `Respond in ${label} because the user explicitly requested it.`
          : `Respond in ${label}. Do not switch to Chinese unless the user explicitly requests Chinese.`
      };
    }
  }

  if (CHINESE_SCRIPT_RE.test(userText)) {
    return {
      targetLabel: 'Chinese',
      allowChinese: true,
      instruction: 'Respond in Chinese because the user is writing in Chinese.'
    };
  }

  if (VIETNAMESE_HINT_RE.test(userText)) {
    return {
      targetLabel: 'Vietnamese',
      allowChinese: false,
      instruction: 'Respond in Vietnamese. Do not switch to Chinese unless the user explicitly requests Chinese.'
    };
  }

  return {
    targetLabel: 'same language as the user',
    allowChinese: false,
    instruction: 'Respond in the same language as the user\'s latest message. Do not switch to Chinese unless the user explicitly requests Chinese.'
  };
}

export function sanitizeChineseOutput(text: string, allowChinese: boolean): string {
  if (allowChinese || !text) return text;
  // Fresh /g each call ? shared /g breaks .test() via lastIndex.
  const cleaned = text.replace(/[㐀-䶿一-鿿豈-﫿]/g, '');
  // Empty reply worse than Chinese. Keep original when strip wipes all content.
  if (!cleaned.trim() && text.trim()) return text;
  return cleaned;
}
