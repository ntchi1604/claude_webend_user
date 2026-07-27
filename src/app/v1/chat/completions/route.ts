import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkQuota, quotaMessage } from '@/lib/quota';
import { countMessagesTokens, countTokens } from '@/lib/tokens';
import { resolveModelEndpoint, tryCandidates, UpstreamError } from '@/lib/router';
import { prepareModelMessages } from '@/lib/image-fallback';
import { checkRateLimit, getUserRequestsPerMinute } from '@/lib/rate-limit';
import { VERBOSE_SYSTEM_PROMPT, ensureMaxTokens } from '@/lib/verbose';
import { sanitizeUpstreamError } from '@/lib/errors';
import { authKeyWithCookie, logUsage, estimateCompletion } from '@/lib/api-gateway';
import { stringifyChatContent } from '@/lib/chat-content';
import { normalizeAnthropicMessageContent, normalizeOpenAIMessageContent } from '@/lib/chat-attachments';
import { buildLanguageInstruction, sanitizeChineseOutput } from '@/lib/language';
import { buildGatewayIdentity } from '@/lib/identity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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


function decodeSseText(text: string) {
  const chunks: string[] = [];
  let buf = '';
  for (const part of text.split(/\n\n/)) {
    buf = part.trim();
    if (!buf) continue;
    const line = buf.split('\n').find((l) => l.startsWith('data:'));
    if (!line) continue;
    const payload = line.slice(5).trim();
    if (payload && payload !== '[DONE]') chunks.push(payload);
  }
  return chunks;
}

function flattenOpenAIContent(content: unknown): string {
  return stringifyChatContent(content);
}

function normalizeMessagesForOpenAI(messages: any[]) {
  return messages.map((message) => ({
    ...message,
    content: normalizeOpenAIMessageContent(message.content)
  }));
}

function normalizeMessagesForAnthropic(messages: any[]) {
  return messages.map((message) => ({
    ...message,
    content: normalizeAnthropicMessageContent(message.content)
  }));
}


export async function POST(req: NextRequest) {
  const key = await authKeyWithCookie(req);
  if (!key) return errJson('API key không hợp lệ', 'invalid_api_key', 401);

  let body: any;
  try { body = await req.json(); } catch { return errJson('Body JSON không hợp lệ'); }
  const stream = !!body?.stream;

  const rl = checkRateLimit(key.userId, await getUserRequestsPerMinute(key.userId));
  if (!rl.ok) return errOut(stream, `Vượt giới hạn tần suất (${rl.reason})`, 'rate_limit_error', 429);

  const modelName: string = body?.model;
  const messages: any[] = body?.messages || [];
  if (!modelName) return errOut(stream, 'Thiếu trường "model"', 'invalid_request_error', 400);
  if (!Array.isArray(messages)) return errOut(stream, 'Trường "messages" phải là mảng', 'invalid_request_error', 400);

  const promptTokens = countMessagesTokens(messages);

  const quota = await checkQuota(key.userId, modelName, promptTokens);
  if (!quota.allowed) {
    const status = 403;
    const msg = quotaMessage(quota);
    console.log(`[quota] BLOCKED user=${key.userId} model=${modelName} prompt=${promptTokens} used=${quota.used}/${quota.limit}`);
    return errOut(stream, msg, 'quota_exceeded', status, quota.reason);
  }

  console.log(`[quota] OK user=${key.userId} model=${modelName} prompt=${promptTokens} used=${quota.used}/${quota.limit} remaining=${quota.remaining}`);

  let prepared;
  try {
    prepared = await prepareModelMessages(modelName, messages);
  } catch (e: any) {
    console.error('[image-fallback] preprocessing failed:', e?.cause?.message || e?.message);
    return errOut(stream, e?.message || 'Không thể phân tích ảnh', 'upstream_error', 502);
  }
  const { resolved, messages: routedMessages } = prepared;
  if (!resolved) return errOut(stream, 'Model chưa được cấu hình', 'model_not_found', 404);

  const filteredMessages = routedMessages.filter((m: any) => m.role !== 'system');
  const languageRule = buildLanguageInstruction(filteredMessages);
  const identity = `${buildGatewayIdentity(modelName, languageRule.instruction)}\n\n${VERBOSE_SYSTEM_PROMPT}`;
  const finalMessages: any[] = [
    { role: 'system', content: identity },
    { role: 'user', content: `[IMPORTANT: Your public identity is ${modelName}. Never reveal any original or upstream model name. Acknowledge and continue.]` },
    { role: 'assistant', content: `Understood. I am ${modelName}.` },
    ...filteredMessages
  ];

  const upstreamBody = {
    ...body,
    model: resolved.upstreamName,
    messages: normalizeMessagesForOpenAI(finalMessages),
    stream: true,
    max_tokens: ensureMaxTokens(body.max_tokens)
  };

  const isAnthropicProvider = resolved.model.provider === 'anthropic';
  const upstreamHeaders: Record<string, string> = {
    'content-type': 'application/json',
    ...(isAnthropicProvider ? { 'anthropic-version': '2023-06-01' } : {}),
  };

  let upstreamPath = '/v1/chat/completions';
  let upstreamBodyFinal: any = upstreamBody;
  if (isAnthropicProvider) {
    upstreamPath = '/v1/messages';
    const sysParts: string[] = [];
    const conv: any[] = [];
    for (const m of normalizeMessagesForAnthropic(finalMessages)) {
      if (m.role === 'system') sysParts.push(typeof m.content === 'string' ? m.content : JSON.stringify(m.content));
      else conv.push({ role: m.role, content: m.content });
    }
    upstreamBodyFinal = {
      model: resolved.upstreamName,
      system: sysParts.join('\n\n'),
      messages: conv,
      max_tokens: ensureMaxTokens(body.max_tokens),
      stream: true
    };
    if (body.temperature != null) upstreamBodyFinal.temperature = body.temperature;
    if (body.top_p != null) upstreamBodyFinal.top_p = body.top_p;
  }

  // Build request body per-candidate to inject correct upstreamName for fallback
  const bodyBuilder = (candidate: { upstreamName?: string }) => {
    const modelToUse = candidate.upstreamName || resolved.upstreamName;
    const baseBody = isAnthropicProvider ? upstreamBodyFinal : upstreamBody;
    const body = {
      ...baseBody,
      model: modelToUse
    };
    return JSON.stringify(body);
  };

  let upstream: Response;
  try {
    const result = await tryCandidates(resolved.candidates, upstreamPath, {
      headers: upstreamHeaders,
      bodyBuilder,
      isAnthropic: isAnthropicProvider,
    });
    upstream = result.response;
    const usedBase = result.candidate.baseUrl?.replace(/\/$/, '');
    const usedUpstream = result.candidate.upstreamName || resolved.upstreamName;
    console.log(`[gateway] upstream status=${upstream.status} base=${usedBase}${upstreamPath} model=${modelName} -> ${usedUpstream}`);
  } catch (e: any) {
    const isAbort = e?.name === 'AbortError';
    const code = isAbort ? 504 : e instanceof UpstreamError ? e.status : 502;
    const errMsg = e instanceof UpstreamError ? e.body : (isAbort ? 'Upstream timeout (60s)' : e?.message || 'Upstream không khả dụng');
    console.error('[gateway] upstream error:', errMsg.slice(0, 200));
    await logUsage(key.id, key.userId, resolved.model.id, modelName, promptTokens, 0, code, errMsg.slice(0, 500)).catch(() => {});
    return errOut(stream, isAbort ? 'Upstream timeout (60s)' : 'Upstream không khả dụng', isAbort ? 'api_error' : 'upstream_error', code);
  }

  prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  if (!stream) {
    const text = await upstream.text();
    let parsed: any = null;
    let sseJsons: any[] = [];
    try { parsed = JSON.parse(text); } catch {
      sseJsons = decodeSseText(text).flatMap((line) => {
        try { return [JSON.parse(line)]; } catch { return []; }
      });
    }

    if (isAnthropicProvider) {
      const rawContentText = Array.isArray(parsed?.content)
        ? parsed.content.map((b: any) => b?.text || '').join('')
        : sseJsons
            .map((j) => j?.type === 'content_block_delta' ? j?.delta?.text || '' : '')
            .join('');
      const contentText = sanitizeChineseOutput(rawContentText, languageRule.allowChinese);
      const pt = parsed?.usage?.input_tokens ?? promptTokens;
      const ct = parsed?.usage?.output_tokens ?? countTokens(contentText);
      console.log(`[usage] non-stream model=${modelName} prompt=${pt} completion=${ct} total=${pt + ct} (upstream=anthropic)`);
  
      await logUsage(key.id, key.userId, resolved.model.id, modelName, pt, ct, upstream.status, !upstream.ok ? text.slice(0, 500) : null);
      if (!upstream.ok) {
        let sanitized = text;
        try {
          const obj = JSON.parse(text);
          if (obj?.error?.message) obj.error.message = sanitizeUpstreamError(obj.error.message, resolved.upstreamName, modelName);
          if (obj?.message) obj.message = sanitizeUpstreamError(obj.message, resolved.upstreamName, modelName);
          sanitized = JSON.stringify(obj);
        } catch {
          sanitized = sanitizeUpstreamError(text, resolved.upstreamName, modelName);
        }
        return new Response(sanitized, { status: upstream.status, headers: { 'content-type': 'application/json' } });
      }
      const openAIShape = {
        id: parsed?.id ?? 'chatcmpl_' + Math.random().toString(36).slice(2, 12),
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: modelName,
        choices: [{
          index: 0,
          message: { role: 'assistant', content: contentText },
          finish_reason: parsed?.stop_reason === 'end_turn' ? 'stop' : parsed?.stop_reason ?? 'stop'
        }],
        usage: { prompt_tokens: pt, completion_tokens: ct, total_tokens: pt + ct }
      };
      return new Response(JSON.stringify(openAIShape), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }

    const usage = parsed?.usage ?? sseJsons.find((j) => j?.usage)?.usage;
    const pt = usage?.prompt_tokens ?? promptTokens;
    const ct = usage?.completion_tokens ?? estimateCompletion(parsed);
    const rawContentText = parsed?.choices?.[0]?.message?.content != null
      ? flattenOpenAIContent(parsed.choices[0].message.content)
      : sseJsons.map((j) => flattenOpenAIContent(j?.choices?.[0]?.delta?.content)).join('');
    const contentText = sanitizeChineseOutput(rawContentText, languageRule.allowChinese);
    const finalContent = contentText || (parsed && parsed.model ? JSON.stringify({ ...parsed, model: modelName }) : text);
    console.log(`[usage] non-stream model=${modelName} prompt=${pt} completion=${ct} total=${pt + ct} (upstream=${!!usage})`);

    await logUsage(key.id, key.userId, resolved.model.id, modelName, pt, ct, upstream.status, !upstream.ok ? text.slice(0, 500) : null);
    let responseText = parsed && parsed.model ? JSON.stringify({ ...parsed, model: modelName }) : finalContent;
    if (!upstream.ok) {
      try {
        const obj = typeof responseText === 'string' ? JSON.parse(responseText) : responseText;
        if (obj?.error?.message) obj.error.message = sanitizeUpstreamError(obj.error.message, resolved.upstreamName, modelName);
        if (obj?.message) obj.message = sanitizeUpstreamError(obj.message, resolved.upstreamName, modelName);
        responseText = JSON.stringify(obj);
      } catch {
        responseText = sanitizeUpstreamError(String(responseText), resolved.upstreamName, modelName);
      }
    }
    return new Response(responseText, {
      status: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' }
    });
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text();
    await logUsage(key.id, key.userId, resolved.model.id, modelName, promptTokens, 0, upstream.status, text.slice(0, 500));
    return errSSE(sanitizeUpstreamError(text, resolved.upstreamName, modelName) || 'Lỗi upstream', 'upstream_error', null);
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let completionBuf = '';
  let lastUsage: any = null;
  let streamFailed = false;

  const STREAM_IDLE_TIMEOUT_MS = 3 * 60 * 1000; // 3 phút — reasoning models có thể nghĩ lâu
  const STREAM_HEARTBEAT_MS = 15 * 1000;

  const respStream = new ReadableStream({
    async start(controller) {
      let idleTimer: ReturnType<typeof setTimeout> | null = null;
      let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
      let timedOut = false;
      const resetIdle = () => {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          timedOut = true;
          streamFailed = true;
          reader.cancel('idle_timeout').catch(() => { });
        }, STREAM_IDLE_TIMEOUT_MS);
      };
      heartbeatTimer = setInterval(() => {
        try { controller.enqueue(encoder.encode(`: ping\n\n`)); } catch { }
      }, STREAM_HEARTBEAT_MS);
      const chatId = 'chatcmpl_' + Math.random().toString(36).slice(2, 12);
      const created = Math.floor(Date.now() / 1000);
      const emitOpenAIChunk = (delta: any, finish: string | null = null) => {
        const chunk = {
          id: chatId, object: 'chat.completion.chunk', created, model: modelName,
          choices: [{ index: 0, delta, finish_reason: finish }]
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      };
      try {
        let buf = '';
        resetIdle();
        if (isAnthropicProvider) emitOpenAIChunk({ role: 'assistant', content: '' });
        while (true) {
          const { done, value } = await reader.read();
          if (done || timedOut) break;
          resetIdle();
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split('\n\n');
          buf = parts.pop() || '';
          for (const evt of parts) {
            const line = evt.split('\n').find((l) => l.startsWith('data:'));
            if (!line) {
              if (!isAnthropicProvider) controller.enqueue(encoder.encode(`${evt}\n\n`));
              continue;
            }
            const payload = line.slice(5).trim();
            if (!payload || payload === '[DONE]') {
              if (!isAnthropicProvider) controller.enqueue(encoder.encode(`${evt}\n\n`));
              continue;
            }
            try {
              const j = JSON.parse(payload);
              if (isAnthropicProvider) {
                if (j.type === 'content_block_delta' && j.delta?.text) {
                  const sanitizedText = sanitizeChineseOutput(j.delta.text, languageRule.allowChinese);
                  if (sanitizedText) {
                    completionBuf += sanitizedText;
                    emitOpenAIChunk({ content: sanitizedText });
                  }
                } else if (j.type === 'message_start' && j.message?.usage?.input_tokens) {
                  lastUsage = { ...(lastUsage || {}), prompt_tokens: j.message.usage.input_tokens };
                } else if (j.type === 'message_delta' && j.usage?.output_tokens) {
                  lastUsage = { ...(lastUsage || {}), completion_tokens: j.usage.output_tokens };
                }
              } else {
                const deltaText = sanitizeChineseOutput(
                  flattenOpenAIContent(j?.choices?.[0]?.delta?.content),
                  languageRule.allowChinese
                );
                if (deltaText) completionBuf += deltaText;
                if (j?.usage) lastUsage = j.usage;
                if (j.model) j.model = modelName;
                if (j?.choices?.[0]?.delta && j.choices[0].delta.content != null) {
                  j.choices[0].delta.content = deltaText;
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(j)}\n\n`));
              }
            } catch {
              if (!isAnthropicProvider) controller.enqueue(encoder.encode(`${evt}\n\n`));
            }
          }
        }
        // Drain remaining buffer — critical: last SSE chunk may still be in buf
        if (buf.trim()) {
          const line = buf.split('\n').find((l) => l.startsWith('data:'));
          if (line) {
            const payload = line.slice(5).trim();
            if (payload && payload !== '[DONE]') {
              try {
                const j = JSON.parse(payload);
                if (isAnthropicProvider) {
                  if (j.type === 'content_block_delta' && j.delta?.text) {
                    const sanitizedText = sanitizeChineseOutput(j.delta.text, languageRule.allowChinese);
                    if (sanitizedText) completionBuf += sanitizedText;
                  }
                  if (j.type === 'message_delta' && j.usage?.output_tokens) lastUsage = { ...(lastUsage || {}), completion_tokens: j.usage.output_tokens };
                } else {
                  const deltaText = sanitizeChineseOutput(
                    flattenOpenAIContent(j?.choices?.[0]?.delta?.content),
                    languageRule.allowChinese
                  );
                  if (deltaText) completionBuf += deltaText;
                  if (j?.usage) lastUsage = j.usage;
                }
              } catch {}
            }
          }
        }
        if (isAnthropicProvider) {
          emitOpenAIChunk({}, 'stop');
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        } else {
          // Ensure non-Anthropic streams also get [DONE]
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        }
        if (idleTimer) clearTimeout(idleTimer);
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        controller.close();
      } catch (e) {
        streamFailed = true;
        if (idleTimer) clearTimeout(idleTimer);
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        try {
          if (isAnthropicProvider) {
            emitOpenAIChunk({}, 'stop');
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch {}
      } finally {
        const pt = lastUsage?.prompt_tokens ?? promptTokens;
        const ct = lastUsage?.completion_tokens ?? countTokens(completionBuf);
        const source = lastUsage ? 'upstream' : 'tiktoken';
        console.log(`[usage] stream model=${modelName} prompt=${pt} completion=${ct} total=${pt + ct} (source=${source})`);

        logUsage(key.id, key.userId, resolved.model.id, modelName, pt, ct, streamFailed ? 500 : 200, streamFailed ? 'stream_error' : null).catch((err) => console.error('[logUsage] write failed:', err?.message));
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
