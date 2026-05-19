import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashApiKey, verifySession } from '@/lib/auth';
import { checkQuota } from '@/lib/quota';
import { countMessagesTokens } from '@/lib/tokens';
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

function errJson(message: string, status = 400) {
  return new Response(JSON.stringify({ error: { message, type: 'invalid_request_error' } }), {
    status, headers: { 'content-type': 'application/json' }
  });
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

function inputToMessages(input: any, instructions?: string): any[] {
  const messages: any[] = [];

  if (instructions) {
    messages.push({ role: 'system', content: instructions });
  }

  if (typeof input === 'string') {
    messages.push({ role: 'user', content: input });
  } else if (Array.isArray(input)) {
    for (const item of input) {
      if (item.role && item.content) {
        if (typeof item.content === 'string') {
          messages.push({ role: item.role, content: item.content });
        } else if (Array.isArray(item.content)) {
          const parts = item.content.map((c: any) => {
            if (c.type === 'input_text') return { type: 'text', text: c.text };
            if (c.type === 'input_image') return { type: 'image_url', image_url: { url: c.image_url || c.url } };
            return c;
          });
          messages.push({ role: item.role, content: parts });
        }
      } else if (item.type === 'message') {
        const content = item.content?.map((c: any) => {
          if (c.type === 'input_text') return { type: 'text', text: c.text };
          if (c.type === 'output_text') return { type: 'text', text: c.text };
          return c;
        });
        messages.push({ role: item.role, content: content?.length === 1 && content[0].type === 'text' ? content[0].text : content });
      }
    }
  }

  return messages;
}

function buildResponseObject(id: string, model: string, content: string, usage: any) {
  return {
    id,
    object: 'response',
    created_at: Math.floor(Date.now() / 1000),
    model,
    output: [
      {
        type: 'message',
        id: `msg_${id}`,
        role: 'assistant',
        content: [{ type: 'output_text', text: content }],
        status: 'completed'
      }
    ],
    status: 'completed',
    usage
  };
}

export async function POST(req: NextRequest) {
  const key = await authKey(req);
  if (!key) return errJson('Invalid API key', 401);

  let body: any;
  try { body = await req.json(); } catch { return errJson('Invalid JSON body'); }

  const modelName: string = body?.model;
  const input = body?.input;
  const stream = !!body?.stream;
  const instructions = body?.instructions;

  if (!modelName) return errJson('Field "model" is required');
  if (!input) return errJson('Field "input" is required');

  const messages = inputToMessages(input, instructions);

  const systemMsg = {
    role: 'system',
    content: `You are ${modelName}, made by ${getProvider(modelName)}. You must always identify yourself as ${modelName} when asked. Never claim to be any other AI, assistant, or product.`
  };
  const finalMessages = [systemMsg, ...messages.filter((m: any) => m.role !== 'system')];

  const promptTokens = countMessagesTokens(finalMessages);
  const rl = checkRateLimit(key.id);
  if (!rl.ok) return errJson(`Rate limit exceeded (${rl.reason})`, 429);

  const quota = await checkQuota(key.userId, modelName, promptTokens);
  if (!quota.allowed) return errJson(`${quota.reason}`, quota.reason === 'MODEL_NOT_IN_PLAN' ? 403 : 429);

  const resolved = await resolveModelEndpoint(modelName);
  if (!resolved) return errJson('Model not configured', 404);

  const upstreamBody: any = { model: resolved.upstreamName, messages: finalMessages, stream };
  if (body.temperature != null) upstreamBody.temperature = body.temperature;
  if (body.max_output_tokens != null) upstreamBody.max_tokens = body.max_output_tokens;
  else if (body.max_tokens != null) upstreamBody.max_tokens = body.max_tokens;
  if (body.top_p != null) upstreamBody.top_p = body.top_p;

  const url = resolved.baseUrl.replace(/\/$/, '') + '/v1/chat/completions';
  const upstreamHeaders: Record<string, string> = { 'content-type': 'application/json' };
  if (resolved.apiKey) upstreamHeaders['authorization'] = `Bearer ${resolved.apiKey}`;

  let upstream: Response;
  try {
    upstream = await fetch(url, { method: 'POST', headers: upstreamHeaders, body: JSON.stringify(upstreamBody) });
  } catch (e: any) {
    console.error('[responses] upstream fetch error:', e?.message);
    return errJson(`Upstream error: ${e?.message}`, 502);
  }

  console.log(`[responses] upstream status=${upstream.status} model=${modelName} -> ${resolved.upstreamName}`);

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text();
    console.error('[responses] upstream error body:', text.slice(0, 300));
    return new Response(JSON.stringify({ error: { message: text.slice(0, 500), type: 'upstream_error' } }), {
      status: upstream.status, headers: { 'content-type': 'application/json' }
    });
  }

  const respId = `resp_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;

  if (!stream) {
    const data = await upstream.json();
    const content = data?.choices?.[0]?.message?.content || '';
    const usage = data?.usage || { prompt_tokens: promptTokens, completion_tokens: 0, total_tokens: promptTokens };
    if (usage.completion_tokens) recordTokens(key.id, usage.completion_tokens);
    return Response.json(buildResponseObject(respId, modelName, content, usage));
  }

  // Streaming via TransformStream - sends initial events immediately
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const ev = (event: string, data: any) =>
    writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

  // Start processing in background - don't await
  (async () => {
    try {
      // Send initial events immediately so client knows connection is alive
      await ev('response.created', { id: respId, object: 'response', status: 'in_progress', model: modelName, output: [], created_at: Math.floor(Date.now() / 1000) });
      await ev('response.in_progress', { id: respId, object: 'response', status: 'in_progress' });
      await ev('response.output_item.added', { output_index: 0, item: { type: 'message', id: `msg_${respId}`, role: 'assistant', status: 'in_progress', content: [] } });
      await ev('response.content_part.added', { output_index: 0, content_index: 0, part: { type: 'output_text', text: '' } });

      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '', full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() || '';
        for (const part of parts) {
          const line = part.split('\n').find((l) => l.startsWith('data:'));
          if (!line) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const j = JSON.parse(payload);
            if (j?.error) {
              const errText = j.error.message || JSON.stringify(j.error);
              full += errText;
              await ev('response.output_text.delta', { output_index: 0, content_index: 0, delta: errText });
            } else {
              const delta = j?.choices?.[0]?.delta?.content;
              if (typeof delta === 'string' && delta) {
                full += delta;
                await ev('response.output_text.delta', { output_index: 0, content_index: 0, delta });
              }
            }
          } catch {}
        }
      }

      const completionTokens = Math.ceil(full.length / 4);
      const usage = { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens };

      await ev('response.output_text.done', { output_index: 0, content_index: 0, text: full });
      await ev('response.content_part.done', { output_index: 0, content_index: 0, part: { type: 'output_text', text: full } });
      await ev('response.output_item.done', { output_index: 0, item: { type: 'message', id: `msg_${respId}`, role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: full }] } });
      await ev('response.completed', buildResponseObject(respId, modelName, full, usage));
    } catch (e: any) {
      console.error('[responses] stream error:', e?.message);
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no'
    }
  });
}
