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

  if (!upstream.ok) {
    const text = await upstream.text();
    console.error('[responses] upstream error body:', text.slice(0, 300));
    return new Response(JSON.stringify({ error: { message: text.slice(0, 500), type: 'upstream_error' } }), {
      status: upstream.status, headers: { 'content-type': 'application/json' }
    });
  }

  const respId = `resp_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
  const msgId = `msg_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;

  // --- STREAMING PATH ---
  if (stream) {
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        function send(event: string, data: any) {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        }

        // Send response.created
        send('response.created', {
          type: 'response.created',
          response: {
            id: respId, object: 'response', status: 'in_progress',
            model: modelName, output: []
          }
        });

        // Send output_item.added
        send('response.output_item.added', {
          type: 'response.output_item.added',
          output_index: 0,
          item: { type: 'message', id: msgId, role: 'assistant', content: [], status: 'in_progress' }
        });

        // Send content_part.added
        send('response.content_part.added', {
          type: 'response.content_part.added',
          item_id: msgId,
          output_index: 0,
          content_index: 0,
          part: { type: 'output_text', text: '' }
        });

        let fullContent = '';
        let completionTokens = 0;

        try {
          if (!upstream.body) {
            // No body - treat as empty
            send('response.output_text.done', { type: 'response.output_text.done', item_id: msgId, output_index: 0, content_index: 0, text: '' });
          } else {
            const reader = upstream.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const payload = line.slice(6).trim();
                if (payload === '[DONE]') continue;

                try {
                  const chunk = JSON.parse(payload);
                  const delta = chunk?.choices?.[0]?.delta?.content;
                  if (delta) {
                    fullContent += delta;
                    send('response.output_text.delta', {
                      type: 'response.output_text.delta',
                      item_id: msgId,
                      output_index: 0,
                      content_index: 0,
                      delta
                    });
                  }
                  // Check for usage in final chunk
                  if (chunk?.usage) {
                    completionTokens = chunk.usage.completion_tokens || 0;
                  }
                } catch { /* skip malformed chunks */ }
              }
            }
          }

          if (!completionTokens) completionTokens = Math.ceil(fullContent.length / 4);
          const totalTokens = promptTokens + completionTokens;
          const usage = { input_tokens: promptTokens, output_tokens: completionTokens, total_tokens: totalTokens };

          if (completionTokens) recordTokens(key.id, completionTokens);

          // Send output_text.done
          send('response.output_text.done', {
            type: 'response.output_text.done',
            item_id: msgId,
            output_index: 0,
            content_index: 0,
            text: fullContent
          });

          // Send content_part.done
          send('response.content_part.done', {
            type: 'response.content_part.done',
            item_id: msgId,
            output_index: 0,
            content_index: 0,
            part: { type: 'output_text', text: fullContent }
          });

          // Send output_item.done
          send('response.output_item.done', {
            type: 'response.output_item.done',
            output_index: 0,
            item: {
              type: 'message', id: msgId, role: 'assistant',
              content: [{ type: 'output_text', text: fullContent }],
              status: 'completed'
            }
          });

          // Send response.completed
          send('response.completed', {
            type: 'response.completed',
            response: {
              id: respId, object: 'response', status: 'completed',
              model: modelName,
              output: [{
                type: 'message', id: msgId, role: 'assistant',
                content: [{ type: 'output_text', text: fullContent }],
                status: 'completed'
              }],
              usage
            }
          });

          console.log(`[responses] stream done model=${modelName} content_length=${fullContent.length}`);
        } catch (e: any) {
          console.error('[responses] stream error:', e?.message);
          send('error', { type: 'error', message: e?.message || 'Stream error' });
        }

        controller.close();
      }
    });

    return new Response(readableStream, {
      headers: {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        'connection': 'keep-alive',
        'x-accel-buffering': 'no'
      }
    });
  }

  // --- NON-STREAMING PATH ---
  const data = await upstream.json();
  const content = data?.choices?.[0]?.message?.content || '';
  const upstreamUsage = data?.usage;
  const completionTokens = upstreamUsage?.completion_tokens || Math.ceil(content.length / 4);
  const totalTokens = (upstreamUsage?.prompt_tokens || promptTokens) + completionTokens;
  const usage = { input_tokens: upstreamUsage?.prompt_tokens || promptTokens, output_tokens: completionTokens, total_tokens: totalTokens };

  if (completionTokens) recordTokens(key.id, completionTokens);

  console.log(`[responses] done model=${modelName} content_length=${content.length} stream_requested=${stream}`);

  return Response.json(buildResponseObject(respId, modelName, content, usage));
}
