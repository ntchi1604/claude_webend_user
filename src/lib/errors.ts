/**
 * Strip upstream model names and internal details from error messages
 * before returning them to clients.
 */
export function sanitizeUpstreamError(raw: string, ...sensitiveNames: string[]): string {
  if (!raw) return 'Lỗi upstream không xác định';

  let text = raw;

  // 1. Remove bracketed model references: [xiaomi-mimo/mimo-v2.5-pro], (model: xxx), etc.
  text = text.replace(/\[[^\]]*\/[^\]]*\]/g, '');           // [provider/model]
  text = text.replace(/\[[^\]]{3,}\]/g, '');                 // [any-long-token]
  text = text.replace(/\(model[:\s]+[^)]+\)/gi, '');         // (model: xxx)

  // 2. Remove all known sensitive names (upstreamName, modelName)
  for (const name of sensitiveNames) {
    if (!name) continue;
    // Case-insensitive replace all occurrences
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(escaped, 'gi'), '');
  }

  // 3. Remove residual model-like patterns: org/model, provider/model-v1.2.3
  text = text.replace(/\b[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+\b/g, '');

  // 4. Remove internal URLs / base endpoints
  text = text.replace(/https?:\/\/[^\s"'`]+/g, '');

  // 5. Clean up leftover punctuation, extra spaces, empty brackets
  text = text.replace(/\[\s*\]/g, '');
  text = text.replace(/\(\s*\)/g, '');
  text = text.replace(/\s{2,}/g, ' ');
  text = text.replace(/^\s*[\[\(]\s*/, '');
  text = text.replace(/\s*[\]\)]\s*$/, '');
  text = text.trim();

  return text || 'Lỗi upstream không xác định';
}
