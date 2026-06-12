import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkQuota, quotaMessage } from '@/lib/quota';
import { countMessagesTokens, countTokens } from '@/lib/tokens';
import { resolveModelEndpoint, tryCandidates, UpstreamError } from '@/lib/router';
import { checkRateLimit, getUserRequestsPerMinute } from '@/lib/rate-limit';
import { VERBOSE_SYSTEM_PROMPT, ensureMaxTokens, injectVerboseIntoAnthropicSystem } from '@/lib/verbose';
import { sanitizeUpstreamError } from '@/lib/errors';
import { authKeyHeaderOnly, logUsage, estimateCompletion } from '@/lib/api-gateway';
import { buildLanguageInstruction, sanitizeChineseOutput } from '@/lib/language';
import { buildGatewayIdentity } from '@/lib/identity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errJson(message: string, type = 'invalid_request_error', status = 400) {
  return new Response(JSON.stringify({ type: 'error', error: { type, message } }), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

function errSSEAnthropic(message: string, type = 'overloaded_error') {
  const enc = new TextEncoder();
  const payload = JSON.stringify({ type: 'error', error: { type, message } });
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(enc.encode(`event: error\ndata: ${payload}\n\n`));
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

function errOut(stream: boolean, message: string, type: string, status: number) {
  if (stream) return errSSEAnthropic(message, type);
  return errJson(message, type, status);
}


function msgsToOpenAIFormat(messages: any[], system?: any) {
  const out: any[] = [];
  const languageRule = buildLanguageInstruction(messages);
  const sysParts: string[] = [buildGatewayIdentity('the requested model', languageRule.instruction), VERBOSE_SYSTEM_PROMPT];
  if (system) {
    const sysContent = typeof system === 'string' ? system : Array.isArray(system) ? system.map((b: any) => b.text || '').join('\n') : '';
    if (sysContent) sysParts.push(sysContent);
  }
  out.push({ role: 'system', content: sysParts.join('\n\n') });
  for (const m of messages) {
    out.push({ role: m.role, content: m.content });
  }
  return out;
}

export async function POST(req: NextRequest) {
  const key = await authKeyHeaderOnly(req);
  if (!key) return errJson('API key không hợp lệ', 'authentication_error', 401);

  let body: any;
  try { body = await req.json(); } catch { return errJson('Body JSON không hợp lệ'); }
  const stream = !!body?.stream;

  const rl = checkRateLimit(key.userId, await getUserRequestsPerMinute(key.userId));
  if (!rl.ok) return errOut(stream, `Vượt giới hạn tần suất (${rl.reason})`, 'rate_limit_error', 429);

  const modelName: string = body?.model;
  const messages: any[] = body?.messages || [];
  if (!modelName) return errOut(stream, 'Thiếu trường "model"', 'invalid_request_error', 400);

  const promptTokens = countMessagesTokens([
    ...(body?.system ? [{ role: 'system', content: body.system }] : []),
    ...messages
  ]);

  const quota = await checkQuota(key.userId, modelName, promptTokens);
  if (!quota.allowed) {
    const status = 403;
    const msg = quotaMessage(quota);
    return errOut(stream, msg, 'rate_limit_error', status);
  }

  const resolved = await resolveModelEndpoint(modelName);
  if (!resolved) return errOut(stream, 'Model chưa được cấu hình', 'not_found_error', 404);

  const isAnthropic = resolved.model.provider === 'anthropic';
  const languageRule = buildLanguageInstruction(messages);
  const identity = buildGatewayIdentity(modelName, languageRule.instruction);

  let upstreamPath: string;
  let upstreamBody: any;
  let upstreamHeaders: Record<string, string> = { 'content-type': 'application/json' };

  if (isAnthropic) {
    upstreamHeaders['x-claude-code-disable-nonessential-traffic'] = '1';
    upstreamPath = '/v1/messages';
    const { context_management, ...rest } = body;
    upstreamBody = {
      ...rest,
      model: resolved.upstreamName,
      stream,
      system: injectVerboseIntoAnthropicSystem(
        body.system
          ? `${identity}\n\n${typeof body.system === 'string' ? body.system : JSON.stringify(body.system)}`
          : identity
      ),
      max_tokens: ensureMaxTokens(body.max_tokens)
    };
    upstreamHeaders['anthropic-version'] = req.headers.get('anthropic-version') || '2023-06-01';
  } else {
    upstreamPath = '/v1/chat/completions';
    upstreamBody = {
      model: resolved.upstreamName,
      messages: msgsToOpenAIFormat(messages, body.system),
      max_tokens: ensureMaxTokens(body.max_tokens),
      temperature: body.temperature,
      top_p: body.top_p,
      stream
    };
  }

  let upstream: Response;
  try {
    const result = await tryCandidates(resolved.candidates, upstreamPath, {
      headers: upstreamHeaders,
      body: JSON.stringify(upstreamBody),
      isAnthropic,
    });
    upstream = result.response;
    const usedBase = result.candidate.baseUrl?.replace(/\/$/, '');
    console.log(`[messages] upstream status=${upstream.status} base=${usedBase} model=${modelName} -> ${resolved.upstreamName}`);
  } catch (e: any) {
    const isAbort = e?.name === 'AbortError';
    const code = isAbort ? 504 : e instanceof UpstreamError ? e.status : 502;
    const errMsg = e instanceof UpstreamError ? e.body : (isAbort ? 'Upstream timeout (60s)' : e?.message || 'Upstream không khả dụng');
    await logUsage(key.id, key.userId, resolved.model.id, modelName, promptTokens, 0, code, errMsg.slice(0, 500)).catch(() => {});
    return errOut(stream, sanitizeUpstreamError(errMsg, resolved.upstreamName, modelName) || 'Upstream không khả dụng', 'api_error', code);
  }

  prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => { });

  if (!stream) {
    const text = await upstream.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch { }
    let pt = promptTokens, ct = 0;
    if (isAnthropic) {
      pt = parsed?.usage?.input_tokens ?? promptTokens;
      ct = parsed?.usage?.output_tokens ?? 0;
      await logUsage(key.id, key.userId, resolved.model.id, modelName, pt, ct, upstream.status, !upstream.ok ? text.slice(0, 500) : null);
      let responseText = parsed && parsed.model ? JSON.stringify({ ...parsed, model: modelName }) : text;
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
      return new Response(responseText, { status: upstream.status, headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' } });
    } else {
      pt = parsed?.usage?.prompt_tokens ?? promptTokens;
      ct = parsed?.usage?.completion_tokens ?? estimateCompletion(parsed);
      const anthropic = openAIToAnthropic({
        ...parsed,
        choices: [{
          ...(parsed?.choices?.[0] || {}),
          message: {
            ...(parsed?.choices?.[0]?.message || {}),
            content: sanitizeChineseOutput(parsed?.choices?.[0]?.message?.content ?? '', languageRule.allowChinese)
          }
        }]
      }, modelName);
      await logUsage(key.id, key.userId, resolved.model.id, modelName, pt, ct, upstream.status, !upstream.ok ? text.slice(0, 500) : null);
      return new Response(JSON.stringify(anthropic), { status: upstream.status, headers: { 'content-type': 'application/json' } });
    }
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text();
    await logUsage(key.id, key.userId, resolved.model.id, modelName, promptTokens, 0, upstream.status, text.slice(0, 500));
    return errSSEAnthropic(sanitizeUpstreamError(text, resolved.upstreamName, modelName) || 'Lỗi upstream', 'api_error');
  }

  if (isAnthropic) {
    return passthroughAnthropicStream(upstream, key, resolved, modelName, promptTokens, languageRule.allowChinese);
  } else {
    return translateOpenAIToAnthropicStream(upstream, key, resolved, modelName, promptTokens, languageRule.allowChinese);
  }
}


function openAIToAnthropic(parsed: any, model: string) {
  const choice = parsed?.choices?.[0];
  const text = choice?.message?.content ?? '';
  return {
    id: parsed?.id ?? 'msg_' + Math.random().toString(36).slice(2, 12),
    type: 'message',
    role: 'assistant',
    model,
    content: [{ type: 'text', text }],
    stop_reason: choice?.finish_reason === 'stop' ? 'end_turn' : choice?.finish_reason ?? 'end_turn',
    stop_sequence: null,
    usage: {
      input_tokens: parsed?.usage?.prompt_tokens ?? 0,
      output_tokens: parsed?.usage?.completion_tokens ?? 0
    }
  };
}


const STREAM_IDLE_TIMEOUT_MS = 3 * 60 * 1000; // 3 phút — reasoning models có thể nghĩ lâu trước khi output
const STREAM_HEARTBEAT_MS = 15 * 1000;        // cứ 15s ping client để giữ kết nối

function passthroughAnthropicStream(upstream: Response, key: any, resolved: any, modelName: string, promptTokens: number, allowChinese: boolean) {
  const reader = upstream.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let completionBuf = '';
  let inputTokens = promptTokens;
  let outputTokens = 0;
  let streamFailed = false;

  function emit(controller: ReadableStreamDefaultController, event: string, data: any) {
    controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
  }

  const stream = new ReadableStream({
    async start(controller) {
      let idleTimer: ReturnType<typeof setTimeout> | null = null;
      let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
      let timedOut = false;
      let sawMessageStart = false;
      let sawMessageStop = false;
      let sawError = false;
      // Track content blocks per index — prevents duplicate content_block_start
      // from corrupting the SDK's internal block map (causes "Content block not found")
      const startedBlocks = new Set<number>();
      const stoppedBlocks = new Set<number>();

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

      const msgId = 'msg_' + Math.random().toString(36).slice(2, 12);

      function ensureMessageStart() {
        if (sawMessageStart) return;
        sawMessageStart = true;
        emit(controller, 'message_start', {
          type: 'message_start',
          message: {
            id: msgId, type: 'message', role: 'assistant', model: modelName,
            content: [], stop_reason: null, stop_sequence: null,
            usage: { input_tokens: promptTokens, output_tokens: 0 }
          }
        });
      }

      function ensureContentBlockStart() {
        if (startedBlocks.has(0)) return;
        ensureMessageStart();
        startedBlocks.add(0);
        emit(controller, 'content_block_start', {
          type: 'content_block_start', index: 0,
          content_block: { type: 'text', text: '' }
        });
      }

      function finalizeStream(stopReason: string) {
        if (sawMessageStop) return;
        // Close any open content blocks
        for (const idx of startedBlocks) {
          if (!stoppedBlocks.has(idx)) {
            emit(controller, 'content_block_stop', { type: 'content_block_stop', index: idx });
            stoppedBlocks.add(idx);
          }
        }
        const ct = outputTokens || countTokens(completionBuf);
        emit(controller, 'message_delta', {
          type: 'message_delta',
          delta: { stop_reason: stopReason, stop_sequence: null },
          usage: { output_tokens: ct }
        });
        emit(controller, 'message_stop', { type: 'message_stop' });
        sawMessageStop = true;
      }

      try {
        let buf = '';
        resetIdle();
        while (true) {
          const { done, value } = await reader.read();
          if (done || timedOut) break;
          resetIdle();
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split('\n\n');
          buf = parts.pop() || '';
          for (const evt of parts) {
            const eventLine = evt.split('\n').find((l) => l.startsWith('event:'));
            const dataLine = evt.split('\n').find((l) => l.startsWith('data:'));
            if (dataLine) {
              const payload = dataLine.slice(5).trim();
              if (payload) {
                try {
                  const j = JSON.parse(payload);

                  if (j.type === 'error') {
                    sawError = true;
                    streamFailed = true;
                    console.error(`[passthrough] upstream error event: ${j.error?.message}`);
                    ensureMessageStart();
                    ensureContentBlockStart();
                    completionBuf += sanitizeChineseOutput(`[Error: ${j.error?.message || 'upstream error'}]`, allowChinese);
                    emit(controller, 'content_block_delta', {
                      type: 'content_block_delta', index: 0,
                      delta: { type: 'text_delta', text: completionBuf }
                    });
                    finalizeStream('error');
                    break;
                  }

                  if (j.type === 'message_start') {
                    if (sawMessageStart) continue;
                    sawMessageStart = true;
                    if (j.message?.usage?.input_tokens) inputTokens = j.message.usage.input_tokens;
                    if (j.message?.model) j.message.model = modelName;
                  }

                  if (j.type === 'content_block_start') {
                    const idx = j.index ?? 0;
                    if (startedBlocks.has(idx)) continue; // duplicate — skip
                    startedBlocks.add(idx);
                  }

                  if (j.type === 'content_block_stop') {
                    const idx = j.index ?? 0;
                    stoppedBlocks.add(idx);
                  }

                  if (j.type === 'content_block_delta') {
                    if (sawMessageStop) continue;
                    const idx = j.index ?? 0;
                    // If block wasn't started, synthesize it
                    if (!startedBlocks.has(idx)) {
                      ensureContentBlockStart();
                    }
                    if (j.delta?.text) completionBuf += sanitizeChineseOutput(j.delta.text, allowChinese);
                    if (j.delta?.thinking) completionBuf += sanitizeChineseOutput(j.delta.thinking, allowChinese);
                  }

                  if (j.type === 'message_delta') {
                    if (j.delta?.stop_reason) sawMessageStop = true;
                    if (j.usage?.output_tokens) outputTokens = j.usage.output_tokens;
                  }
                  if (j.type === 'message_stop') sawMessageStop = true;

                  const eventName = eventLine ? eventLine.slice(6).trim() : j.type;
                  controller.enqueue(encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(j)}\n\n`));
                  if (sawMessageStop) break;
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
          if (sawError || sawMessageStop) break;
        }
        // Drain remaining buffer — last SSE event may still be in buf
        if (buf.trim() && !sawError && !sawMessageStop) {
          const dataLine = buf.split('\n').find((l) => l.startsWith('data:'));
          if (dataLine) {
            const payload = dataLine.slice(5).trim();
            if (payload) {
              try {
                const j = JSON.parse(payload);
                if (j.type === 'content_block_delta' && j.delta?.text) {
                  completionBuf += sanitizeChineseOutput(j.delta.text, allowChinese);
                }
                if (j.type === 'message_delta' && j.usage?.output_tokens) outputTokens = j.usage.output_tokens;
                if (j.type === 'message_stop') sawMessageStop = true;
              } catch {}
            }
          }
        }
        if (!sawMessageStop) {
          finalizeStream(timedOut ? 'timeout' : 'end_turn');
        }
        if (idleTimer) clearTimeout(idleTimer);
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        controller.close();
      } catch (e) {
        streamFailed = true;
        if (idleTimer) clearTimeout(idleTimer);
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        try {
          if (!sawMessageStop) {
            finalizeStream('error');
          }
          controller.close();
        } catch { }
      } finally {
        const ct = outputTokens || countTokens(completionBuf);
        logUsage(key.id, key.userId, resolved.model.id, modelName, inputTokens, ct, streamFailed ? 500 : 200, streamFailed ? 'stream_error' : null).catch(() => { });
      }
    }
  });
  return new Response(stream, {
    status: 200,
    headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache, no-transform', connection: 'keep-alive', 'x-accel-buffering': 'no' }
  });
}

function translateOpenAIToAnthropicStream(upstream: Response, key: any, resolved: any, modelName: string, promptTokens: number, allowChinese: boolean) {
  const reader = upstream.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let completionBuf = '';
  const msgId = 'msg_' + Math.random().toString(36).slice(2, 12);
  let streamFailed = false;

  function sse(event: string, data: any) {
    return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  const stream = new ReadableStream({
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
      try {
        controller.enqueue(sse('message_start', {
          type: 'message_start',
          message: {
            id: msgId, type: 'message', role: 'assistant', model: modelName,
            content: [], stop_reason: null, stop_sequence: null,
            usage: { input_tokens: promptTokens, output_tokens: 0 }
          }
        }));
        controller.enqueue(sse('content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }));

        let buf = '';
        resetIdle();
        while (true) {
          const { done, value } = await reader.read();
          if (done || timedOut) break;
          resetIdle();
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split('\n\n');
          buf = parts.pop() || '';
          for (const evt of parts) {
            const dataLine = evt.split('\n').find((l) => l.startsWith('data:'));
            if (!dataLine) continue;
            const payload = dataLine.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              const j = JSON.parse(payload);
              const delta = j?.choices?.[0]?.delta?.content;
              if (typeof delta === 'string' && delta.length > 0) {
                const sanitizedDelta = sanitizeChineseOutput(delta, allowChinese);
                if (!sanitizedDelta) continue;
                completionBuf += sanitizedDelta;
                controller.enqueue(sse('content_block_delta', {
                  type: 'content_block_delta', index: 0,
                  delta: { type: 'text_delta', text: sanitizedDelta }
                }));
              }
            } catch { }
          }
        }
        // Drain remaining buffer
        if (buf.trim()) {
          const dataLine = buf.split('\n').find((l) => l.startsWith('data:'));
          if (dataLine) {
            const payload = dataLine.slice(5).trim();
            if (payload && payload !== '[DONE]') {
              try {
                const j = JSON.parse(payload);
                const delta = j?.choices?.[0]?.delta?.content;
                if (typeof delta === 'string' && delta.length > 0) {
                  const sanitizedDelta = sanitizeChineseOutput(delta, allowChinese);
                  if (sanitizedDelta) completionBuf += sanitizedDelta;
                }
              } catch {}
            }
          }
        }
        if (idleTimer) clearTimeout(idleTimer);
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        const ct = countTokens(completionBuf);
        controller.enqueue(sse('content_block_stop', { type: 'content_block_stop', index: 0 }));
        controller.enqueue(sse('message_delta', {
          type: 'message_delta', delta: { stop_reason: timedOut ? 'timeout' : 'end_turn', stop_sequence: null },
          usage: { output_tokens: ct }
        }));
        controller.enqueue(sse('message_stop', { type: 'message_stop' }));
        controller.close();
      } catch (e) {
        streamFailed = true;
        if (idleTimer) clearTimeout(idleTimer);
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        try { controller.close(); } catch { }
      } finally {
        if (idleTimer) clearTimeout(idleTimer);
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        const ct = countTokens(completionBuf);
        logUsage(key.id, key.userId, resolved.model.id, modelName, promptTokens, ct, streamFailed ? 500 : 200, streamFailed ? 'stream_error' : null).catch(() => { });
      }
    }
  });
  return new Response(stream, {
    status: 200,
    headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache, no-transform', connection: 'keep-alive', 'x-accel-buffering': 'no' }
  });
}
