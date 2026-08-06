/**
 * Strip upstream model names, credentials and internal details from error
 * messages before returning them to clients.
 */
export function sanitizeUpstreamError(raw: string, ...sensitiveNames: string[]): string {
  if (!raw) return 'Lỗi upstream không xác định';

  let text = raw;

  // 0. Credentials: Bearer/x-api-key tokens, API keys, password fields
  text = text.replace(/bearer\s+[a-zA-Z0-9._\-]+/gi, 'bearer ***');
  text = text.replace(/(x-api-key|api[_-]?key|authorization)\s*[:=]\s*["']?[a-zA-Z0-9._\-]+/gi, '$1: ***');
  text = text.replace(/(sk-[a-zA-Z0-9\-_]+)/gi, 'sk-***');
  text = text.replace(/(password|passwd|secret|token)\s*[:=]\s*["']?[^\s"'`]+/gi, '$1: ***');

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

  // 5. HTML / stack-trace leakage — collapse markup and file paths
  text = text.replace(/<[^>]+>/g, ' ');                     // tags
  text = text.replace(/\bat\s+[^\n]{0,160}/g, ' ');         // stack frames
  text = text.replace(/[A-Za-z]:\\[^\s"'`]+/g, '');         // Windows paths
  text = text.replace(/\/(?:home|var|usr|opt|app)\/[^\s"'`]+/g, ''); // unix paths

  // 6. Clean up leftover punctuation, extra spaces, empty brackets
  text = text.replace(/\[\s*\]/g, '');
  text = text.replace(/\(\s*\)/g, '');
  text = text.replace(/\s{2,}/g, ' ');
  text = text.replace(/^\s*[\[\(]\s*/, '');
  text = text.replace(/\s*[\]\)]\s*$/, '');
  text = text.trim();

  return text || 'Lỗi upstream không xác định';
}
