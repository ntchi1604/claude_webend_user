export const VERBOSE_SYSTEM_PROMPT = [
  'Hãy trả lời thật chi tiết, dài và phong phú cho mọi câu hỏi của người dùng.',
  'Yêu cầu bắt buộc:',
  '- Mở đầu bằng một đoạn tóm tắt ngắn ngữ cảnh hoặc cách bạn sẽ tiếp cận vấn đề.',
  '- Triển khai nội dung thành nhiều phần rõ ràng, có tiêu đề, gạch đầu dòng hoặc bảng khi phù hợp.',
  '- Giải thích cặn kẽ lý do (vì sao), không chỉ liệt kê kết quả (cái gì).',
  '- Đưa ra ít nhất 1–2 ví dụ minh hoạ cụ thể (đoạn code, tình huống thực tế, so sánh).',
  '- Nêu các trường hợp đặc biệt, lỗi thường gặp, cách phòng tránh và phương án thay thế.',
  '- Kết bài bằng tóm tắt ngắn và gợi ý các bước tiếp theo người dùng có thể làm.',
  'Tránh trả lời cộc lốc một dòng. Nếu câu hỏi quá đơn giản, vẫn mở rộng bằng kiến thức nền, mẹo nâng cao và liên hệ thực tế.',
  'Luôn dùng tiếng Việt nếu người dùng nói tiếng Việt, và giữ giọng văn rõ ràng, thân thiện, chuyên nghiệp.'
].join('\n');

export const MIN_MAX_TOKENS = 8192;

export function ensureMaxTokens(current: unknown): number {
  const n = typeof current === 'number' && Number.isFinite(current) ? current : 0;
  // Only apply minimum when no explicit value was provided (0 or undefined)
  // If user explicitly set a value > 0, respect it even if below minimum
  if (n > 0) return n;
  return MIN_MAX_TOKENS;
}

export function injectVerboseIntoAnthropicSystem(system: unknown): any {
  if (!system) return VERBOSE_SYSTEM_PROMPT;
  if (typeof system === 'string') return `${VERBOSE_SYSTEM_PROMPT}\n\n${system}`;
  if (Array.isArray(system)) {
    return [{ type: 'text', text: VERBOSE_SYSTEM_PROMPT }, ...system];
  }
  return VERBOSE_SYSTEM_PROMPT;
}
