import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashApiKey } from '@/lib/auth';
import { checkQuota } from '@/lib/quota';
import { countMessagesTokens, countTokens } from '@/lib/tokens';
import { resolveModelEndpoint } from '@/lib/router';
import { checkRateLimit, recordTokens } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getProvider(model: string): string {
  if (model.includes('claude')) return 'Anthropic';
  if (model.includes('gpt') || model.includes('o1') || model.includes('o3') || model.includes('o4')) return 'OpenAI';
  if (model.includes('gemini')) return 'Google';
  if (model.includes('deepseek')) return 'DeepSeek';
  if (model.includes('llama') || model.includes('meta')) return 'Meta';
  if (model.includes('mistral')) return 'Mistral';
  return 'its creator';
}

function errJson(message: string, type = 'invalid_request_error', status = 400, code: string | null = null) {
  return new Response(JSON.stringify({ error: { message, type, code } }), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

function errSSE(message: string, type: string, code: string | null) {
  const enc = new TextEncoder();
  const payload = JSON.stringify({ error: { message, type, code } });
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(enc.encode(`data: ${payload}\n\n`));
      c.enqueue(enc.encode(`data: [DONE]\n\n`));
      c.close();
    }
  });
  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no'
    }
  });
}

function errOut(stream: boolean, message: string, type: string, status: number, code: string | null = null) {
  if (stream) return errSSE(message, type, code);
  return errJson(message, type, status, code);
}

async function authKey(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (m) {
    const raw = m[1].trim();
    const hash = hashApiKey(raw);
    const key = await prisma.apiKey.findUnique({ where: { keyHash: hash }, include: { user: true } });
    if (!key || !key.active || key.user.banned) return null;
    return key;
  }
  const cookieHeader = req.headers.get('cookie') || '';
  const sessionMatch = cookieHeader.match(/cw_session=([^;]+)/);
  if (sessionMatch) {
    const { verifySession } = await import('@/lib/auth');
    const payload = await verifySession(sessionMatch[1]);
    if (!payload) return null;
    const key = await prisma.apiKey.findFirst({
      where: { userId: payload.uid, active: true },
      include: { user: true },
      orderBy: { createdAt: 'asc' }
    });
    if (key) {
      if (key.user.banned) return null;
      return key;
    }
    const user = await prisma.user.findUnique({ where: { id: payload.uid } });
    if (!user || user.banned) return null;
    return { id: `session_${user.id}`, userId: user.id, user, active: true } as any;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const key = await authKey(req);
  if (!key) return errJson('Invalid API key', 'invalid_api_key', 401);

  let body: any;
  try { body = await req.json(); } catch { return errJson('Invalid JSON body'); }
  const stream = !!body?.stream;

  const rl = checkRateLimit(key.id);
  if (!rl.ok) return errOut(stream, `Rate limit exceeded (${rl.reason})`, 'rate_limit_error', 429);

  const modelName: string = body?.model;
  const messages: any[] = body?.messages || [];
  if (!modelName) return errOut(stream, 'Field "model" is required', 'invalid_request_error', 400);
  if (!Array.isArray(messages)) return errOut(stream, 'Field "messages" must be array', 'invalid_request_error', 400);

  const promptTokens = countMessagesTokens(messages);

  const quota = await checkQuota(key.userId, modelName, promptTokens);
  if (!quota.allowed) {
    const status = quota.reason === 'MODEL_NOT_IN_PLAN' || quota.reason === 'MODEL_NOT_FOUND' ? 403 : 429;
    const msg = `${quota.reason}. limit=${quota.limit}, used=${quota.used}, remaining=${quota.remaining}, window=${quota.windowHours}h${quota.resetAt ? `, reset=${quota.resetAt.toISOString()}` : ''}`;
    console.log(`[quota] BLOCKED user=${key.userId} model=${modelName} prompt=${promptTokens} used=${quota.used}/${quota.limit}`);
    return errOut(stream, msg, 'quota_exceeded', status, quota.reason);
  }

  console.log(`[quota] OK user=${key.userId} model=${modelName} prompt=${promptTokens} used=${quota.used}/${quota.limit} remaining=${quota.remaining}`);

  const resolved = await resolveModelEndpoint(modelName);
  if (!resolved) return errOut(stream, 'Model not configured', 'model_not_found', 404);

  const systemMsg = {
    role: 'system',
    content: `You are ${modelName}, made by ${getProvider(modelName)}. You must always identify yourself as ${modelName} when asked. Never claim to be any other AI, assistant, or product. Never mention any wrapper, gateway, or intermediary service. Respond directly as ${modelName}.`
  };
  const filteredMessages = messages.filter((m: any) => m.role !== 'system');
  const finalMessages = [systemMsg, ...filteredMessages];

  const upstreamBody = { ...body, model: resolved.upstreamName, messages: finalMessages, stream };
  const url = resolved.baseUrl.replace(/\/$/, '') + '/v1/chat/completions';
  const upstreamHeaders: Record<string, string> = { 'content-type': 'application/json' };
  if (resolved.apiKey) upstreamHeaders['authorization'] = `Bearer ${resolved.apiKey}`;

  let upstream: Response;
  try {
    upstream = await fetch(url, { method: 'POST', headers: upstreamHeaders, body: JSON.stringify(upstreamBody) });
  } catch (e: any) {
    console.error('[gateway] upstream error:', e?.message, 'url=', url);
    await logUsage(key.id, key.userId, resolved.model.id, modelName, promptTokens, 0, 502, e?.message).catch((err) => console.error('[logUsage] write failed:', err?.message));
    return errOut(stream, 'Upstream unavailable', 'upstream_error', 502);
  }

  prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  if (!stream) {
    const text = await upstream.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch {}
    const usage = parsed?.usage;
    const pt = usage?.prompt_tokens ?? promptTokens;
    const ct = usage?.completion_tokens ?? estimateCompletion(parsed);
    console.log(`[usage] non-stream model=${modelName} prompt=${pt} completion=${ct} total=${pt + ct} (upstream=${!!usage})`);
    recordTokens(key.id, pt + ct);
    await logUsage(key.id, key.userId, resolved.model.id, modelName, pt, ct, upstream.status, !upstream.ok ? text.slice(0, 500) : null);
    const responseText = parsed && parsed.model ? JSON.stringify({ ...parsed, model: modelName }) : text;
    return new Response(responseText, {
      status: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' }
    });
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text();
    await logUsage(key.id, key.userId, resolved.model.id, modelName, promptTokens, 0, upstream.status, text.slice(0, 500));
    return errSSE(text.slice(0, 500) || 'Upstream error', 'upstream_error', null);
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let completionBuf = '';
  let lastUsage: any = null;

  const respStream = new ReadableStream({
    async start(controller) {
      try {
        let buf = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split('\n\n');
          buf = parts.pop() || '';
          for (const evt of parts) {
            const line = evt.split('\n').find((l) => l.startsWith('data:'));
            if (line) {
              const payload = line.slice(5).trim();
              if (payload && payload !== '[DONE]') {
                try {
                  const j = JSON.parse(payload);
                  const delta = j?.choices?.[0]?.delta?.content;
                  if (typeof delta === 'string') completionBuf += delta;
                  if (j?.usage) lastUsage = j.usage;
                  if (j.model) j.model = modelName;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(j)}\n\n`));
                } catch {
                  controller.enqueue(encoder.encode(`${evt}\n\n`));
                }
              } else {
                controller.enqueue(encoder.encode(`${evt}\n\n`));
              }
            } else {
              controller.enqueue(encoder.encode(`${evt}\n\n`));
            }
          }
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      } finally {
        const pt = lastUsage?.prompt_tokens ?? promptTokens;
        const ct = lastUsage?.completion_tokens ?? countTokens(completionBuf);
        const source = lastUsage ? 'upstream' : 'tiktoken';
        console.log(`[usage] stream model=${modelName} prompt=${pt} completion=${ct} total=${pt + ct} (source=${source})`);
        recordTokens(key.id, pt + ct);
        logUsage(key.id, key.userId, resolved.model.id, modelName, pt, ct, 200, null).catch((err) => console.error('[logUsage] write failed:', err?.message));
      }
    }
  });

  return new Response(respStream, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no'
    }
  });
}

function estimateCompletion(parsed: any): number {
  try {
    const choices = parsed?.choices ?? [];
    let total = 0;
    for (const c of choices) {
      const content = c?.message?.content;
      if (typeof content === 'string') total += countTokens(content);
    }
    return total;
  } catch { return 0; }
}

async function logUsage(apiKeyId: string, userId: string, modelId: string, modelName: string, pt: number, ct: number, status: number, errorMessage: string | null) {
  await prisma.usageLog.create({
    data: { apiKeyId, userId, modelId, modelName, promptTokens: pt, completionTokens: ct, totalTokens: pt + ct, status, errorMessage: errorMessage ?? null }
  });
}
