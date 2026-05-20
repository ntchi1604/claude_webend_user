export function checkRateLimit(_keyId: string, _estimatedTokens = 0): { ok: boolean; reason?: string } {
  return { ok: true };
}

export function recordTokens(_keyId: string, _tokens: number) {
  // Rate limiting is enforced per user API key in the server.
}
