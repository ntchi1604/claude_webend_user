import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkQuota, quotaMessage } from '@/lib/quota';
import { countMessagesTokens, countTokens } from '@/lib/tokens';
import { resolveModelEndpoint, tryCandidates, UpstreamError } from '@/lib/router';
import { checkRateLimit, getUserRequestsPerMinute } from '@/lib/rate-limit';
import { MIN_MAX_TOKENS, VERBOSE_SYSTEM_PROMPT, ensureMaxTokens, injectVerboseIntoAnthropicSystem } from '@/lib/verbose';
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


function anthropicImageToOpenAI(part: any) {
  if (part?.type === 'image_url' && typeof part?.image_url?.url === 'string') {
    return { type: 'image_url', image_url: { url: part.image_url.url } };
  }
  if (part?.type !== 'image' || !part.source) return null;

  const source = part.source;
  if (
    source.type === 'base64' &&
    typeof source.media_type === 'string' &&
    source.media_type.startsWith('image/') &&
    typeof source.data === 'string' &&
    source.data.length > 0
  ) {
    return {
      type: 'image_url',
      image_url: { url: `data:${source.media_type};base64,${source.data}` }
    };
  }
  if ((source.type === 'url' || typeof source.url === 'string') && typeof source.url === 'string') {
    return { type: 'image_url', image_url: { url: source.url } };
  }
  return null;
}

function anthropicToolResultToOpenAI(content: any) {
  const blocks = Array.isArray(content) ? content : [content];
  const text: string[] = [];
  const images: any[] = [];
  for (const block of blocks) {
    if (typeof block === 'string') {
      if (block) text.push(block);
      continue;
    }
    if (block?.type === 'text' && typeof block.text === 'string') {
      if (block.text) text.push(block.text);
      continue;
    }
    const image = anthropicImageToOpenAI(block);
    if (image) images.push(image);
  }
  return { text: text.join('\n'), images };
}

function openAIMessageContent(parts: any[]) {
  if (parts.some((part) => part?.type === 'image_url')) return parts;
  return parts
    .filter((part) => part?.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('\n');
}

function buildToolAvailabilityInstruction(tools: any[] | undefined) {
  if (!Array.isArray(tools)) return '';
  const names = Array.from(new Set(
    tools
      .map((tool) => typeof tool?.name === 'string' ? tool.name.trim() : '')
      .filter(Boolean)
  ));
  if (names.length === 0) {
    return 'No callable tools are available in this request. Do not emit tool or function calls.';
  }

  const available = new Set(names);
  const rules = [
    `The callable tools for this request are exactly: ${names.join(', ')}.`,
    'Only emit tool or function calls whose name appears in that list, even if earlier instructions mention other tools.',
    'Apply this same restriction when acting as or delegating to an agent or sub-agent.'
  ];
  if (available.has('Bash') && !available.has('Glob')) {
    rules.push('Glob is unavailable. Find files through Bash using find, rg --files, or an equivalent shell command.');
  }
  if (available.has('Bash') && !available.has('Grep')) {
    rules.push('Grep is unavailable. Search file contents through Bash using rg or grep.');
  }
  return rules.join('\n');
}

function msgsToOpenAIFormat(messages: any[], system?: any, tools?: any[]) {
  const out: any[] = [];
  const languageRule = buildLanguageInstruction(messages);
  const sysParts: string[] = [buildGatewayIdentity('the requested model', languageRule.instruction), VERBOSE_SYSTEM_PROMPT];
  if (system) {
    const sysContent = typeof system === 'string' ? system : Array.isArray(system) ? system.map((b: any) => b.text || '').join('\n') : '';
    if (sysContent) sysParts.push(sysContent);
  }
  const toolInstruction = buildToolAvailabilityInstruction(tools);
  if (toolInstruction) sysParts.push(toolInstruction);
  sysParts.push(
    'Always finish with non-empty user-visible assistant content unless you are making a tool call. ' +
    'Never end a response with reasoning or analysis only.'
  );
  out.push({ role: 'system', content: sysParts.join('\n\n') });
  for (const m of messages) {
    if (!Array.isArray(m.content)) {
      const content = typeof m.content === 'string'
        ? m.content
        : m.content == null ? '' : JSON.stringify(m.content);
      out.push({ role: m.role, content });
      continue;
    }

    const contentParts: any[] = [];
    const toolCalls: any[] = [];
    const toolResults: any[] = [];
    const toolResultContentParts: any[] = [];

    for (const part of m.content) {
      if (typeof part === 'string') {
        if (part) contentParts.push({ type: 'text', text: part });
      } else if (part?.type === 'text') {
        if (part.text) contentParts.push({ type: 'text', text: part.text });
      } else if (part?.type === 'image' || part?.type === 'image_url') {
        const image = anthropicImageToOpenAI(part);
        contentParts.push(image || { type: 'text', text: '[Invalid or unsupported image]' });
      } else if (part?.type === 'tool_use') {
        toolCalls.push({
          id: part.id || `call_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
          type: 'function',
          function: {
            name: part.name || 'tool',
            arguments: typeof part.input === 'string' ? part.input : JSON.stringify(part.input || {})
          }
        });
      } else if (part?.type === 'tool_result') {
        const result = anthropicToolResultToOpenAI(part.content);
        const resultText = result.text || (result.images.length > 0 ? '[Image returned by tool]' : '');
        toolResults.push({
          role: 'tool',
          tool_call_id: part.tool_use_id,
          content: part.is_error ? `[Tool error]\n${resultText}` : resultText
        });
        if (result.images.length > 0) {
          toolResultContentParts.push(
            { type: 'text', text: `Image returned by tool call ${part.tool_use_id || 'unknown'}:` },
            ...result.images
          );
        }
      }
    }

    if (m.role === 'assistant') {
      out.push({
        role: 'assistant',
        content: openAIMessageContent(contentParts) || null,
        ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {})
      });
      continue;
    }

    contentParts.push(...toolResultContentParts);
    out.push(...toolResults);
    if (contentParts.length > 0 || toolResults.length === 0) {
      out.push({ role: m.role, content: openAIMessageContent(contentParts) });
    }
  }
  return out;
}

function anthropicToolsToOpenAI(tools: any[] | undefined) {
  if (!Array.isArray(tools)) return undefined;
  const converted = tools
    .filter((tool) => tool?.name)
    .map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description || '',
        parameters: tool.input_schema || { type: 'object', properties: {} }
      }
    }));
  return converted.length > 0 ? converted : undefined;
}

function anthropicToolChoiceToOpenAI(toolChoice: any) {
  if (!toolChoice) return 'auto';
  if (typeof toolChoice === 'string') return toolChoice;
  if (toolChoice.type === 'any') return 'required';
  if (toolChoice.type === 'tool' && toolChoice.name) {
    return { type: 'function', function: { name: toolChoice.name } };
  }
  if (toolChoice.type === 'auto' || toolChoice.type === 'none') return toolChoice.type;
  return 'auto';
}

function usesAnthropicUpstream(provider: string, upstreamName: string) {
  return provider === 'anthropic' && !/^oc\//i.test(upstreamName);
}

function openAIStopReasonToAnthropic(finishReason: string | null | undefined, hasToolCalls = false) {
  if (hasToolCalls || finishReason === 'tool_calls' || finishReason === 'function_call') return 'tool_use';
  if (finishReason === 'length') return 'max_tokens';
  return 'end_turn';
}

function extractOpenAIText(value: any): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  if (!Array.isArray(value)) {
    if (value && typeof value === 'object') {
      // OpenAI content parts may use type/text, output_text, or nested content.
      if (typeof value.text === 'string' && value.text) return value.text;
      if (typeof value.output_text === 'string' && value.output_text) return value.output_text;
      if (typeof value.thinking === 'string' && value.thinking) return value.thinking;
      if (typeof value.reasoning === 'string' && value.reasoning) return value.reasoning;
      if (typeof value.reasoning_content === 'string' && value.reasoning_content) return value.reasoning_content;
      if (typeof value.analysis === 'string' && value.analysis) return value.analysis;
      if (value.content != null) return extractOpenAIText(value.content);
    }
    return '';
  }
  return value
    .map((part) => extractOpenAIText(part))
    .filter(Boolean)
    .join('');
}

function firstOpenAIText(...values: any[]): string {
  for (const value of values) {
    const text = extractOpenAIText(value);
    if (text) return text;
  }
  return '';
}

function getOpenAIResponseParts(parsed: any) {
  const choice = parsed?.choices?.[0] || {};
  const message = choice.message || {};
  return {
    choice,
    message,
    visibleText: firstOpenAIText(
      message.content,
      choice.text,
      choice.message?.content,
      parsed?.output_text,
      message.output_text,
      choice.delta?.content
    ),
    reasoningText: firstOpenAIText(
      message.reasoning_content,
      message.reasoning,
      message.analysis,
      choice.delta?.reasoning_content,
      choice.delta?.reasoning
    ),
    toolCalls: Array.isArray(message.tool_calls)
      ? message.tool_calls
      : Array.isArray(choice.delta?.tool_calls)
        ? choice.delta.tool_calls
        : []
  };
}

function hasOpenAIVisibleOutput(parsed: any) {
  const result = getOpenAIResponseParts(parsed);
  return !!result.visibleText.trim() || !!result.reasoningText.trim() || result.toolCalls.length > 0;
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

  const isAnthropic = usesAnthropicUpstream(resolved.model.provider, resolved.upstreamName);
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
    const tools = anthropicToolsToOpenAI(body.tools);
    upstreamBody = {
      model: resolved.upstreamName,
      messages: msgsToOpenAIFormat(messages, body.system, body.tools),
      // Reasoning tokens count against this budget. A low caller value can otherwise
      // be exhausted before the provider emits any user-visible content.
      max_tokens: Math.max(ensureMaxTokens(body.max_tokens), MIN_MAX_TOKENS),
      temperature: body.temperature,
      top_p: body.top_p,
      stream,
      ...(tools ? { tools, tool_choice: anthropicToolChoiceToOpenAI(body.tool_choice) } : {})
    };
  }

  // Build request body per-candidate to inject correct upstreamName for fallback
  const bodyBuilder = (candidate: { upstreamName?: string }) => {
    const modelToUse = candidate.upstreamName || resolved.upstreamName;
    const body = {
      ...upstreamBody,
      model: modelToUse
    };
    return JSON.stringify(body);
  };

  const recoverEmptyOpenAIResponse = async () => {
    if (isAnthropic) return null;
    const recoveryInstruction =
      'A previous attempt ended without a final answer. Keep internal reasoning brief and return non-empty ' +
      'user-visible assistant content now, or make a valid tool call if a tool is required.';
    const recoveryMessages = Array.isArray(upstreamBody.messages)
      ? upstreamBody.messages.map((message: any, index: number) => {
          if (index !== 0 || message?.role !== 'system') return message;
          const content = typeof message.content === 'string' ? message.content : extractOpenAIText(message.content);
          return { ...message, content: `${content}\n\n${recoveryInstruction}` };
        })
      : upstreamBody.messages;

    for (const candidate of resolved.candidates) {
      try {
        const result = await tryCandidates([candidate], upstreamPath, {
          headers: upstreamHeaders,
          isAnthropic: false,
          bodyBuilder: (retryCandidate) => JSON.stringify({
            ...upstreamBody,
            model: retryCandidate.upstreamName || resolved.upstreamName,
            messages: recoveryMessages,
            stream: false,
            max_tokens: Math.max(upstreamBody.max_tokens || 0, MIN_MAX_TOKENS)
          })
        });
        const raw = await result.response.text();
        if (!raw.trim()) continue;
        let parsed: any = null;
        try { parsed = JSON.parse(raw); } catch { }
        if (parsed && hasOpenAIVisibleOutput(parsed)) {
          console.log(`[messages] recovered empty response with ${candidate.upstreamName || resolved.upstreamName}`);
          return parsed;
        }
        console.warn(`[messages] recovery candidate returned no visible output: ${candidate.upstreamName || 'unknown'}`);
      } catch (error: any) {
        console.warn(`[messages] recovery candidate failed: ${candidate.upstreamName || 'unknown'} (${error?.message || 'error'})`);
      }
    }
    return null;
  };

  let upstream: Response;
  try {
    const result = await tryCandidates(resolved.candidates, upstreamPath, {
      headers: upstreamHeaders,
      bodyBuilder,
      isAnthropic,
      // Reasoning models can sit silent before first byte; keep connect budget high.
      timeout: 180_000,
    });
    upstream = result.response;
    const usedBase = result.candidate.baseUrl?.replace(/\/$/, '');
    const usedUpstream = result.candidate.upstreamName || resolved.upstreamName;
    console.log(`[messages] upstream status=${upstream.status} base=${usedBase} model=${modelName} -> ${usedUpstream}`);
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
    if (!text.trim()) {
      const message = 'Upstream returned an empty response';
      await logUsage(key.id, key.userId, resolved.model.id, modelName, promptTokens, 0, 502, message).catch(() => {});
      return errJson(message, 'api_error', 502);
    }
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch { }
    if (!parsed || typeof parsed !== 'object') {
      const message = 'Upstream returned a malformed response';
      await logUsage(key.id, key.userId, resolved.model.id, modelName, promptTokens, 0, 502, text.slice(0, 500)).catch(() => {});
      return errJson(message, 'api_error', 502);
    }
    if (!isAnthropic && !hasOpenAIVisibleOutput(parsed)) {
      const recovered = await recoverEmptyOpenAIResponse();
      if (recovered) {
        parsed = recovered;
      } else {
        const message = 'All upstream models returned no final answer after recovery';
        await logUsage(key.id, key.userId, resolved.model.id, modelName, promptTokens, 0, 502, message).catch(() => {});
        return errJson(message, 'api_error', 502);
      }
    }
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
      const { choice, message, visibleText, reasoningText } = getOpenAIResponseParts(parsed);
      const anthropic = openAIToAnthropic({
        ...parsed,
        choices: [{
          ...(choice || {}),
          message: {
            ...message,
            content: sanitizeChineseOutput(visibleText || reasoningText, languageRule.allowChinese)
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
    return translateOpenAIToAnthropicStream(
      upstream,
      key,
      resolved,
      modelName,
      promptTokens,
      languageRule.allowChinese,
      recoverEmptyOpenAIResponse
    );
  }
}


function openAIToAnthropic(parsed: any, model: string) {
  const choice = parsed?.choices?.[0];
  const message = choice?.message || {};
  const text = firstOpenAIText(
    message.content,
    choice?.text,
    parsed?.output_text,
    message.reasoning_content,
    message.reasoning,
    message.analysis
  );
  const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
  const content: any[] = [];
  if (text) content.push({ type: 'text', text });
  for (const call of toolCalls) {
    let input: any = {};
    const rawArguments = call?.function?.arguments ?? call?.arguments ?? '';
    try { input = typeof rawArguments === 'string' ? JSON.parse(rawArguments || '{}') : rawArguments; } catch {
      input = { raw: String(rawArguments) };
    }
    content.push({
      type: 'tool_use',
      id: call?.id || `call_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
      name: call?.function?.name || call?.name || 'tool',
      input
    });
  }
  if (content.length === 0) content.push({ type: 'text', text: '' });
  return {
    id: parsed?.id ?? 'msg_' + Math.random().toString(36).slice(2, 12),
    type: 'message',
    role: 'assistant',
    model,
    content,
    stop_reason: openAIStopReasonToAnthropic(choice?.finish_reason, toolCalls.length > 0),
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
  let thinkingBuf = '';
  let hasVisibleText = false;
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
      let sawTerminalDelta = false;
      let sawError = false;
      // Track content blocks per index — prevents duplicate content_block_start
      // from corrupting the SDK's internal block map (causes "Content block not found")
      const startedBlocks = new Set<number>();
      const stoppedBlocks = new Set<number>();
      const upstreamToClientBlock = new Map<number, number>();
      const suppressedBlocks = new Set<number>();
      let nextClientBlockIndex = 0;

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

      function startTextBlock() {
        ensureMessageStart();
        const index = nextClientBlockIndex++;
        startedBlocks.add(index);
        emit(controller, 'content_block_start', {
          type: 'content_block_start', index,
          content_block: { type: 'text', text: '' }
        });
        return index;
      }

      function emitFallbackText(text: string) {
        // If any text already reached client, never inject fake retry noise.
        if (hasVisibleText || completionBuf.trim()) return;
        if (startedBlocks.size > 0) {
          // Text block started but empty (e.g. all deltas stripped) ? fill first open text block.
          for (const idx of startedBlocks) {
            if (stoppedBlocks.has(idx)) continue;
            completionBuf += text;
            hasVisibleText = true;
            emit(controller, 'content_block_delta', {
              type: 'content_block_delta', index: idx,
              delta: { type: 'text_delta', text }
            });
            return;
          }
          return;
        }
        const index = startTextBlock();
        completionBuf += text;
        hasVisibleText = true;
        emit(controller, 'content_block_delta', {
          type: 'content_block_delta', index,
          delta: { type: 'text_delta', text }
        });
        emit(controller, 'content_block_stop', { type: 'content_block_stop', index });
        stoppedBlocks.add(index);
      }

      function fallbackMessage() {
        if (timedOut) return 'Upstream response timed out. Please retry.';
        const thinking = thinkingBuf.trim();
        if (thinking) return thinking;
        return 'Upstream completed without a visible response. Please retry.';
      }

      function finalizeStream(stopReason: string) {
        if (sawMessageStop) return;
        ensureMessageStart();
        emitFallbackText(fallbackMessage());
        // Close any open content blocks
        for (const idx of startedBlocks) {
          if (!stoppedBlocks.has(idx)) {
            emit(controller, 'content_block_stop', { type: 'content_block_stop', index: idx });
            stoppedBlocks.add(idx);
          }
        }
        const ct = outputTokens || countTokens(completionBuf);
        if (!sawTerminalDelta) {
          emit(controller, 'message_delta', {
            type: 'message_delta',
            delta: { stop_reason: stopReason, stop_sequence: null },
            usage: { output_tokens: ct }
          });
          sawTerminalDelta = true;
        }
        emit(controller, 'message_stop', { type: 'message_stop' });
        sawMessageStop = true;
      }

      function processUpstreamEvent(j: any, eventName: string) {
        if (j.type === 'error') {
          sawError = true;
          streamFailed = true;
          console.error(`[passthrough] upstream error event: ${j.error?.message}`);
          const text = sanitizeChineseOutput(`[Error: ${j.error?.message || 'upstream error'}]`, allowChinese);
          const index = startTextBlock();
          completionBuf += text;
          emit(controller, 'content_block_delta', {
            type: 'content_block_delta', index,
            delta: { type: 'text_delta', text }
          });
          finalizeStream('end_turn');
          return;
        }

        if (j.type === 'message_start') {
          if (sawMessageStart) return;
          sawMessageStart = true;
          if (j.message?.usage?.input_tokens) inputTokens = j.message.usage.input_tokens;
          if (j.message) {
            j.message.model = modelName;
            j.message.content = [];
          }
        }

        if (j.type === 'content_block_start') {
          const upstreamIndex = j.index ?? 0;
          const blockType = j.content_block?.type;
          if (blockType === 'thinking' || blockType === 'redacted_thinking') {
            const seed = firstOpenAIText(j.content_block?.thinking, j.content_block?.text);
            if (seed) thinkingBuf += sanitizeChineseOutput(seed, allowChinese);
            suppressedBlocks.add(upstreamIndex);
            return;
          }
          if (upstreamToClientBlock.has(upstreamIndex)) return;
          const clientIndex = nextClientBlockIndex++;
          upstreamToClientBlock.set(upstreamIndex, clientIndex);
          startedBlocks.add(clientIndex);
          j.index = clientIndex;
        }

        if (j.type === 'content_block_delta') {
          if (sawMessageStop) return;
          const upstreamIndex = j.index ?? 0;
          const deltaType = j.delta?.type;
          if (
            suppressedBlocks.has(upstreamIndex) ||
            deltaType === 'thinking_delta' ||
            deltaType === 'signature_delta'
          ) {
            if (deltaType === 'thinking_delta') {
              const thinking = firstOpenAIText(j.delta?.thinking, j.delta?.text);
              if (thinking) thinkingBuf += sanitizeChineseOutput(thinking, allowChinese);
            }
            suppressedBlocks.add(upstreamIndex);
            return;
          }

          let clientIndex = upstreamToClientBlock.get(upstreamIndex);
          if (clientIndex == null) {
            if (deltaType !== 'text_delta') return;
            clientIndex = startTextBlock();
            upstreamToClientBlock.set(upstreamIndex, clientIndex);
          }
          j.index = clientIndex;

          if (typeof j.delta?.text === 'string') {
            const text = sanitizeChineseOutput(j.delta.text, allowChinese);
            if (!text) return;
            j.delta.text = text;
            completionBuf += text;
            hasVisibleText = true;
          }
        }

        if (j.type === 'content_block_stop') {
          const upstreamIndex = j.index ?? 0;
          if (suppressedBlocks.has(upstreamIndex)) return;
          const clientIndex = upstreamToClientBlock.get(upstreamIndex);
          if (clientIndex == null) return;
          j.index = clientIndex;
          stoppedBlocks.add(clientIndex);
        }

        if (j.type === 'message_delta') {
          if (j.delta?.stop_reason) {
            emitFallbackText(fallbackMessage());
            sawTerminalDelta = true;
          }
          if (j.usage?.output_tokens) outputTokens = j.usage.output_tokens;
        }
        if (j.type === 'message_stop') {
          emitFallbackText(fallbackMessage());
          if (!sawTerminalDelta) {
            emit(controller, 'message_delta', {
              type: 'message_delta',
              delta: { stop_reason: 'end_turn', stop_sequence: null },
              usage: { output_tokens: outputTokens || countTokens(completionBuf) }
            });
            sawTerminalDelta = true;
          }
          sawMessageStop = true;
        }

        controller.enqueue(encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(j)}\n\n`));
      }

      try {
        let buf = '';
        resetIdle();
        while (true) {
          const { done, value } = await reader.read();
          if (done || timedOut) break;
          resetIdle();
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split(/\r?\n\r?\n/);
          buf = parts.pop() || '';
          for (const evt of parts) {
            const eventLines = evt.split(/\r?\n/);
            const eventLine = eventLines.find((l) => l.startsWith('event:'));
            const dataLine = eventLines.find((l) => l.startsWith('data:'));
            if (!dataLine) continue;
            const payload = dataLine.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              const j = JSON.parse(payload);
              processUpstreamEvent(j, eventLine ? eventLine.slice(6).trim() : j.type);
              if (sawError || sawMessageStop) break;
            } catch {
              console.warn('[passthrough] skipped malformed SSE event');
            }
          }
          if (sawError || sawMessageStop) break;
        }
        // Drain remaining buffer — last SSE event may still be in buf
        if (buf.trim() && !sawError && !sawMessageStop) {
          const remainingLines = buf.split(/\r?\n/);
          const eventLine = remainingLines.find((l) => l.startsWith('event:'));
          const dataLine = remainingLines.find((l) => l.startsWith('data:'));
          if (dataLine) {
            const payload = dataLine.slice(5).trim();
            if (payload && payload !== '[DONE]') {
              try {
                const j = JSON.parse(payload);
                processUpstreamEvent(j, eventLine ? eventLine.slice(6).trim() : j.type);
              } catch {
                console.warn('[passthrough] skipped malformed trailing SSE event');
              }
            }
          }
        }
        if (!sawMessageStop) {
          finalizeStream(timedOut ? 'max_tokens' : 'end_turn');
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
            finalizeStream('end_turn');
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

function translateOpenAIToAnthropicStream(
  upstream: Response,
  key: any,
  resolved: any,
  modelName: string,
  promptTokens: number,
  allowChinese: boolean,
  recoverEmptyResponse?: () => Promise<any | null>
) {
  const reader = upstream.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let completionBuf = '';
  let reasoningBuf = '';
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

        let buf = '';
        let nextBlockIndex = 0;
        let textBlockIndex: number | null = null;
        let finishReason: string | null = null;
        let upstreamOutputTokens = 0;
        const toolCalls = new Map<number, {
          index: number | null;
          id: string;
          name: string;
          arguments: string;
          started: boolean;
          stopped: boolean;
        }>();

        const ensureTextBlock = () => {
          if (textBlockIndex != null) return textBlockIndex;
          textBlockIndex = nextBlockIndex++;
          controller.enqueue(sse('content_block_start', {
            type: 'content_block_start',
            index: textBlockIndex,
            content_block: { type: 'text', text: '' }
          }));
          return textBlockIndex;
        };

        const ensureToolBlock = (state: {
          index: number | null;
          id: string;
          name: string;
          arguments: string;
          started: boolean;
          stopped: boolean;
        }) => {
          if (state.started) return state.index!;
          state.index = nextBlockIndex++;
          state.started = true;
          controller.enqueue(sse('content_block_start', {
            type: 'content_block_start',
            index: state.index,
            content_block: {
              type: 'tool_use',
              id: state.id,
              name: state.name || 'tool',
              input: {}
            }
          }));
          return state.index;
        };

        const processChunk = (chunk: any) => {
          if (chunk?.error) {
            const message = chunk.error?.message || JSON.stringify(chunk.error);
            throw new Error(message);
          }

          if (chunk?.usage?.completion_tokens) upstreamOutputTokens = chunk.usage.completion_tokens;
          const choice = chunk?.choices?.[0];
          if (!choice) return;
          if (choice.finish_reason) finishReason = choice.finish_reason;

          const delta = choice.delta || {};
          const visibleDelta = firstOpenAIText(
            delta.content,
            delta.text,
            choice.text,
            choice.message?.content,
            chunk.output_text
          );
          if (visibleDelta) {
            const sanitizedDelta = sanitizeChineseOutput(visibleDelta, allowChinese);
            if (sanitizedDelta) {
              const index = ensureTextBlock();
              completionBuf += sanitizedDelta;
              controller.enqueue(sse('content_block_delta', {
                type: 'content_block_delta',
                index,
                delta: { type: 'text_delta', text: sanitizedDelta }
              }));
            }
          }

          const reasoningDelta = firstOpenAIText(
            delta.reasoning_content,
            delta.reasoning,
            delta.analysis,
            choice.message?.reasoning_content,
            choice.message?.reasoning,
            choice.message?.analysis
          );
          if (reasoningDelta) {
            reasoningBuf += sanitizeChineseOutput(reasoningDelta, allowChinese);
          }

          for (const toolCall of Array.isArray(delta.tool_calls) ? delta.tool_calls : []) {
            const upstreamIndex = typeof toolCall.index === 'number' ? toolCall.index : 0;
            let state = toolCalls.get(upstreamIndex);
            if (!state) {
              state = {
                index: null,
                id: toolCall.id || `call_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
                name: toolCall?.function?.name || '',
                arguments: '',
                started: false,
                stopped: false
              };
              toolCalls.set(upstreamIndex, state);
            }
            if (toolCall.id) state.id = toolCall.id;
            if (toolCall?.function?.name) state.name = toolCall.function.name;
            const argumentsDelta = toolCall?.function?.arguments || '';
            const index = ensureToolBlock(state);
            if (argumentsDelta) {
              state.arguments += argumentsDelta;
              controller.enqueue(sse('content_block_delta', {
                type: 'content_block_delta',
                index,
                delta: { type: 'input_json_delta', partial_json: argumentsDelta }
              }));
            }
          }
        };

        resetIdle();
        while (true) {
          const { done, value } = await reader.read();
          if (done || timedOut) break;
          resetIdle();
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split(/\r?\n\r?\n/);
          buf = parts.pop() || '';
          for (const evt of parts) {
            const dataLine = evt.split(/\r?\n/).find((l) => l.startsWith('data:'));
            if (!dataLine) continue;
            const payload = dataLine.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              processChunk(JSON.parse(payload));
            } catch (error: any) {
              if (error instanceof SyntaxError) continue;
              throw error;
            }
          }
        }

        if (buf.trim()) {
          const dataLine = buf.split(/\r?\n/).find((l) => l.startsWith('data:'));
          if (dataLine) {
            const payload = dataLine.slice(5).trim();
            if (payload && payload !== '[DONE]') {
              try {
                processChunk(JSON.parse(payload));
              } catch (error: any) {
                if (!(error instanceof SyntaxError)) throw error;
              }
            }
          }
        }

        if (idleTimer) clearTimeout(idleTimer);

        if (textBlockIndex == null && toolCalls.size === 0 && !timedOut && recoverEmptyResponse) {
          const recovered = await recoverEmptyResponse();
          if (recovered) {
            const result = getOpenAIResponseParts(recovered);
            processChunk({
              usage: recovered.usage,
              choices: [{
                finish_reason: result.choice?.finish_reason,
                delta: {
                  content: result.visibleText || result.reasoningText,
                  tool_calls: result.toolCalls
                }
              }]
            });
          }
        }

        if (heartbeatTimer) clearInterval(heartbeatTimer);

        if (textBlockIndex == null && toolCalls.size === 0) {
          const fallback = timedOut
            ? 'Upstream response timed out. Please retry.'
            : (reasoningBuf.trim() || 'Upstream completed without a visible response. Please retry.');
          // Prefer soft fallback over hard error so Claude Code can retry cleanly.
          if (!timedOut && !reasoningBuf.trim()) {
            console.warn('[messages] empty OpenAI stream after recovery; emitting soft fallback');
          }
          const index = ensureTextBlock();
          completionBuf += fallback;
          controller.enqueue(sse('content_block_delta', {
            type: 'content_block_delta',
            index,
            delta: { type: 'text_delta', text: fallback }
          }));
        }

        if (textBlockIndex != null) {
          controller.enqueue(sse('content_block_stop', {
            type: 'content_block_stop',
            index: textBlockIndex
          }));
        }
        for (const state of toolCalls.values()) {
          const index = ensureToolBlock(state);
          if (!state.stopped) {
            controller.enqueue(sse('content_block_stop', { type: 'content_block_stop', index }));
            state.stopped = true;
          }
        }

        const ct = upstreamOutputTokens || countTokens(completionBuf) + Array.from(toolCalls.values())
          .reduce((sum, state) => sum + countTokens(`${state.name}\n${state.arguments}`), 0);
        const stopReason = timedOut
          ? 'max_tokens'
          : openAIStopReasonToAnthropic(finishReason, toolCalls.size > 0);
        controller.enqueue(sse('message_delta', {
          type: 'message_delta',
          delta: { stop_reason: stopReason, stop_sequence: null },
          usage: { output_tokens: ct }
        }));
        controller.enqueue(sse('message_stop', { type: 'message_stop' }));
        controller.close();
      } catch (e: any) {
        streamFailed = true;
        if (idleTimer) clearTimeout(idleTimer);
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        try {
          controller.enqueue(sse('error', {
            type: 'error',
            error: {
              type: 'api_error',
              message: sanitizeUpstreamError(e?.message || 'Upstream stream failed', resolved.upstreamName, modelName)
            }
          }));
          controller.close();
        } catch { }
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
