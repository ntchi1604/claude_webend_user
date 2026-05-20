import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashApiKey, verifySession } from '@/lib/auth';
import { checkQuota, quotaMessage } from '@/lib/quota';
import { countTokens } from '@/lib/tokens';
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

function contentToText(content: any): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return JSON.stringify(content ?? '');
  return content
    .map((part: any) => {
      if (typeof part === 'string') return part;
      if (part?.type === 'input_text' || part?.type === 'output_text' || part?.type === 'text') return part.text || '';
      return JSON.stringify(part ?? '');
    })
    .filter(Boolean)
    .join('\n');
}

function contentToChatContent(content: any): any {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return JSON.stringify(content ?? '');
  const parts = content.map((c: any) => {
    if (c?.type === 'input_text' || c?.type === 'output_text') return { type: 'text', text: c.text || '' };
    if (c?.type === 'input_image') return { type: 'image_url', image_url: { url: c.image_url || c.url } };
    return c;
  });
  return parts.length === 1 && parts[0]?.type === 'text' ? parts[0].text : parts;
}

function chatToolName(name: string | undefined, fallback: string, toolNameToChat?: Map<string, string>) {
  if (name && toolNameToChat?.has(name)) return toolNameToChat.get(name)!;
  return codexToolName(name, fallback);
}

function responseItemToolName(item: any) {
  if (item?.name) return item.name;
  if (item?.type === 'local_shell_call') return 'shell_command';
  if (item?.type === 'custom_tool_call') return 'custom_tool';
  return item?.type || 'tool';
}

function responseItemToolArguments(item: any) {
  const value = item?.arguments ?? item?.input ?? item?.action ?? {};
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function countResponsePromptTokens(messages: any[]) {
  let total = 2;
  for (const message of messages) {
    total += 4;
    if (typeof message.content === 'string') total += countTokens(message.content);
    else if (Array.isArray(message.content)) {
      for (const part of message.content) {
        if (typeof part?.text === 'string') total += countTokens(part.text);
        else if (part) total += countTokens(JSON.stringify(part));
      }
    }
    if (Array.isArray(message.tool_calls)) {
      for (const call of message.tool_calls) {
        total += countTokens(`${call?.function?.name || ''}\n${call?.function?.arguments || ''}`);
      }
    }
    if (typeof message.tool_call_id === 'string') total += countTokens(message.tool_call_id);
  }
  return total;
}

function inputToMessages(input: any, toolNameToChat?: Map<string, string>): any[] {
  const messages: any[] = [];
  const pendingToolCalls: any[] = [];

  function flushToolCalls() {
    if (pendingToolCalls.length === 0) return;
    messages.push({
      role: 'assistant',
      content: null,
      tool_calls: pendingToolCalls.splice(0)
    });
  }

  if (typeof input === 'string') {
    messages.push({ role: 'user', content: input });
  } else if (Array.isArray(input)) {
    for (const item of input) {
      if (item?.type === 'function_call' || item?.type === 'custom_tool_call' || item?.type === 'local_shell_call') {
        const id = item.call_id || item.id || `call_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
        pendingToolCalls.push({
          id,
          type: 'function',
          function: {
            name: chatToolName(responseItemToolName(item), 'tool', toolNameToChat),
            arguments: responseItemToolArguments(item)
          }
        });
      } else if (
        item?.type === 'function_call_output' ||
        item?.type === 'custom_tool_call_output' ||
        item?.type === 'local_shell_call_output'
      ) {
        flushToolCalls();
        messages.push({
          role: 'tool',
          tool_call_id: item.call_id || item.id || item.output_id,
          content: contentToText(item.output ?? item.content ?? '')
        });
      } else if (item?.type === 'message') {
        flushToolCalls();
        messages.push({ role: item.role || 'user', content: contentToChatContent(item.content) });
      } else if (item?.role && item?.content) {
        flushToolCalls();
        messages.push({ role: item.role, content: contentToChatContent(item.content) });
      }
    }
  }

  flushToolCalls();
  return messages;
}

function responseId() {
  return `resp_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
}

function messageId() {
  return `msg_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
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

function codexToolName(name: string | undefined, fallback: string) {
  if (!name) return fallback;
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || fallback;
}

function responsesToolsToChatTools(tools: any[] | undefined) {
  const nameToChat = new Map<string, string>();
  const chatToResponse = new Map<string, string>();
  if (!Array.isArray(tools)) return { tools: undefined, nameToChat, chatToResponse };
  const converted = tools
    .map((tool, index) => {
      if (tool?.type === 'function') {
        const originalName = tool.name || tool.function?.name;
        const name = codexToolName(originalName, `tool_${index}`);
        if (originalName) {
          nameToChat.set(originalName, name);
          chatToResponse.set(name, originalName);
        }
        return {
          type: 'function',
          function: {
            name,
            description: tool.description || tool.function?.description || '',
            parameters: tool.parameters || tool.function?.parameters || { type: 'object', properties: {} }
          }
        };
      }

      // Codex exposes local shell/custom tools as Responses API tools. Most
      // OpenAI-compatible upstreams only support Chat Completions functions.
      if (tool?.name || tool?.type === 'local_shell') {
        const originalName = tool.name || tool.type;
        const name = codexToolName(originalName, `tool_${index}`);
        nameToChat.set(originalName, name);
        chatToResponse.set(name, originalName);
        return {
          type: 'function',
          function: {
            name,
            description: tool.description || `Call ${originalName}`,
            parameters: tool.parameters || { type: 'object', properties: {}, additionalProperties: true }
          }
        };
      }

      return null;
    })
    .filter(Boolean);
  return { tools: converted.length > 0 ? converted : undefined, nameToChat, chatToResponse };
}

function responsesToolChoiceToChat(toolChoice: any, nameToChat: Map<string, string>) {
  if (!toolChoice || typeof toolChoice === 'string') return toolChoice || 'auto';
  if (toolChoice.type === 'function') {
    const name = toolChoice.name || toolChoice.function?.name;
    if (name) return { type: 'function', function: { name: nameToChat.get(name) || codexToolName(name, 'tool') } };
  }
  if (toolChoice.type === 'auto' || toolChoice.type === 'none' || toolChoice.type === 'required') return toolChoice.type;
  return toolChoice;
}

function responseToolName(name: string, chatToResponse?: Map<string, string>) {
  return chatToResponse?.get(name) || name;
}

function chatMessageToResponseOutput(message: any, model: string, chatToResponse?: Map<string, string>) {
  const content = message?.content || '';
  const toolCalls = message?.tool_calls || [];
  const output: any[] = [];
  if (content) {
    output.push({
      type: 'message',
      id: messageId(),
      role: 'assistant',
      content: [{ type: 'output_text', text: content }],
      status: 'completed'
    });
  }
  for (const call of toolCalls) {
    const name = responseToolName(call?.function?.name || call?.name || 'tool', chatToResponse);
    const id = call.id || `call_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
    output.push({
      type: 'function_call',
      id,
      call_id: id,
      name,
      arguments: call?.function?.arguments || '',
      status: 'completed'
    });
  }
  if (output.length === 0) {
    output.push({
      type: 'message',
      id: messageId(),
      role: 'assistant',
      content: [{ type: 'output_text', text: '' }],
      status: 'completed'
    });
  }
  return {
    id: responseId(),
    object: 'response',
    created_at: Math.floor(Date.now() / 1000),
    model,
    output,
    status: 'completed'
  };
}

function estimateToolCallTokens(toolCalls: Iterable<{ name: string; arguments: string }>) {
  let total = 0;
  for (const call of toolCalls) total += countTokens(`${call.name}\n${call.arguments}`);
  return total;
}

async function logUsage(apiKeyId: string, userId: string, modelId: string, modelName: string, pt: number, ct: number, status: number, errorMessage: string | null) {
  if (apiKeyId.startsWith('session_')) return;
  await prisma.usageLog.create({
    data: { apiKeyId, userId, modelId, modelName, promptTokens: pt, completionTokens: ct, totalTokens: pt + ct, status, errorMessage: errorMessage ?? null }
  });
}

export async function POST(req: NextRequest) {
  const key = await authKey(req);
  if (!key) return errJson('API key không hợp lệ', 401);

  let body: any;
  try { body = await req.json(); } catch { return errJson('Body JSON không hợp lệ'); }

  const modelName: string = body?.model;
  const input = body?.input;
  const stream = !!body?.stream;
  const instructions = body?.instructions;

  if (!modelName) return errJson('Thiếu trường "model"');
  if (!input) return errJson('Thiếu trường "input"');

  const convertedTools = responsesToolsToChatTools(body.tools);
  const messages = inputToMessages(input, convertedTools.nameToChat);
  const identity = `You are ${modelName}, made by ${getProvider(modelName)}. You must always identify yourself as ${modelName} when asked. Never claim to be any other AI, assistant, or product.`;
  const instructionText = typeof instructions === 'string' && instructions.trim()
    ? `${instructions}\n\n${identity}`
    : identity;
  const systemMsg = {
    role: 'system',
    content: instructionText
  };
  const finalMessages = [systemMsg, ...messages.filter((m: any) => m.role !== 'system')];

  const promptTokens = countResponsePromptTokens(finalMessages);
  const rl = checkRateLimit(key.id);
  if (!rl.ok) return errJson(`Vượt giới hạn tần suất (${rl.reason})`, 429);

  const quota = await checkQuota(key.userId, modelName, promptTokens);
  if (!quota.allowed) return errJson(quotaMessage(quota), 403);

  const resolved = await resolveModelEndpoint(modelName);
  if (!resolved) return errJson('Model chưa được cấu hình', 404);

  const upstreamBody: any = { model: resolved.upstreamName, messages: finalMessages, stream };
  if (body.temperature != null) upstreamBody.temperature = body.temperature;
  if (body.max_output_tokens != null) upstreamBody.max_tokens = body.max_output_tokens;
  else if (body.max_tokens != null) upstreamBody.max_tokens = body.max_tokens;
  if (body.top_p != null) upstreamBody.top_p = body.top_p;
  if (convertedTools.tools) {
    upstreamBody.tools = convertedTools.tools;
    upstreamBody.tool_choice = responsesToolChoiceToChat(body.tool_choice, convertedTools.nameToChat);
  }

  const url = resolved.baseUrl.replace(/\/$/, '') + '/v1/chat/completions';
  const upstreamHeaders: Record<string, string> = { 'content-type': 'application/json' };
  if (resolved.apiKey) upstreamHeaders['authorization'] = `Bearer ${resolved.apiKey}`;

  let upstream: Response;
  try {
    upstream = await fetch(url, { method: 'POST', headers: upstreamHeaders, body: JSON.stringify(upstreamBody) });
  } catch (e: any) {
    console.error('[responses] upstream fetch error:', e?.message);
    await logUsage(key.id, key.userId, resolved.model.id, modelName, promptTokens, 0, 502, e?.message).catch(() => {});
    return errJson(`Lỗi upstream: ${e?.message}`, 502);
  }

  console.log(`[responses] upstream status=${upstream.status} model=${modelName} -> ${resolved.upstreamName}`);

  if (!upstream.ok) {
    const text = await upstream.text();
    console.error('[responses] upstream error body:', text.slice(0, 300));
    await logUsage(key.id, key.userId, resolved.model.id, modelName, promptTokens, 0, upstream.status, text.slice(0, 500)).catch(() => {});
    return new Response(JSON.stringify({ error: { message: text.slice(0, 500), type: 'upstream_error' } }), {
      status: upstream.status, headers: { 'content-type': 'application/json' }
    });
  }

  const respId = responseId();
  const msgId = messageId();

  // --- STREAMING PATH ---
  if (stream) {
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        function send(event: string, data: any) {
          const payload = data?.type ? data : { type: event, ...data };
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));
        }

        // Send response.created
        send('response.created', {
          type: 'response.created',
          response: {
            id: respId, object: 'response', status: 'in_progress',
            model: modelName, output: []
          }
        });

        let fullContent = '';
        let messageStarted = false;
        let textOutputIndex: number | null = null;
        let nextOutputIndex = 0;
        const toolCalls = new Map<number, { id: string; outputIndex: number; name: string; arguments: string; emitted: boolean }>();
        let completionTokens = 0;
        let rawBody = '';
        let sawSseData = false;

        function ensureTextItem() {
          if (messageStarted) return;
          textOutputIndex = nextOutputIndex++;
          messageStarted = true;
          send('response.output_item.added', {
            type: 'response.output_item.added',
            response_id: respId,
            output_index: textOutputIndex,
            item: { type: 'message', id: msgId, role: 'assistant', content: [], status: 'in_progress' }
          });
          send('response.content_part.added', {
            type: 'response.content_part.added',
            response_id: respId,
            item_id: msgId,
            output_index: textOutputIndex,
            content_index: 0,
            part: { type: 'output_text', text: '' }
          });
        }

        function emitTextDelta(delta: string) {
          ensureTextItem();
          if (!delta) return;
          fullContent += delta;
          send('response.output_text.delta', {
            type: 'response.output_text.delta',
            item_id: msgId,
            output_index: textOutputIndex,
            content_index: 0,
            delta
          });
        }

        function emitToolCallDelta(index: number, id: string | undefined, name: string | undefined, argsDelta: string) {
          let state = toolCalls.get(index);
          if (!state) {
            state = {
              id: id || `call_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
              outputIndex: nextOutputIndex++,
              name: responseToolName(name || 'tool', convertedTools.chatToResponse),
              arguments: '',
              emitted: false
            };
            toolCalls.set(index, state);
          }
          if (id) state.id = id;
          if (name) state.name = responseToolName(name, convertedTools.chatToResponse);
          if (!state.emitted) {
            send('response.output_item.added', {
              type: 'response.output_item.added',
              response_id: respId,
              output_index: state.outputIndex,
              item: {
                id: state.id,
                type: 'function_call',
                call_id: state.id,
                name: state.name,
                arguments: '',
                status: 'in_progress'
              }
            });
            state.emitted = true;
          }
          if (argsDelta) {
            state.arguments += argsDelta;
            send('response.function_call_arguments.delta', {
              type: 'response.function_call_arguments.delta',
              response_id: respId,
              item_id: state.id,
              output_index: state.outputIndex,
              delta: argsDelta
            });
          }
        }

        function applyChatMessage(message: any, usage?: any) {
          const content = message?.content || '';
          emitTextDelta(typeof content === 'string' ? content : contentToText(content));
          const calls = Array.isArray(message?.tool_calls) ? message.tool_calls : [];
          calls.forEach((call: any, index: number) => {
            emitToolCallDelta(
              index,
              call?.id,
              call?.function?.name || call?.name,
              call?.function?.arguments || call?.arguments || ''
            );
          });
          if (usage) completionTokens = usage.completion_tokens || completionTokens;
        }

        try {
          if (!upstream.body) {
            // No body - treat as empty after the stream bookkeeping below.
          } else {
            const reader = upstream.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const decoded = decoder.decode(value, { stream: true });
              rawBody += decoded;
              buffer += decoded;
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const payload = line.slice(6).trim();
                if (payload === '[DONE]') continue;
                sawSseData = true;

                try {
                  const chunk = JSON.parse(payload);
                  const choice = chunk?.choices?.[0];
                  const delta = choice?.delta?.content;
                  if (delta) emitTextDelta(delta);
                  const deltaToolCalls = choice?.delta?.tool_calls || [];
                  for (const tc of deltaToolCalls) {
                    const idx = typeof tc.index === 'number' ? tc.index : 0;
                    emitToolCallDelta(idx, tc.id, tc?.function?.name, tc?.function?.arguments || '');
                  }
                  // Check for usage in final chunk
                  if (chunk?.usage) {
                    completionTokens = chunk.usage.completion_tokens || 0;
                  }
                } catch { /* skip malformed chunks */ }
              }
            }
          }

          if (!sawSseData && rawBody.trim()) {
            try {
              const data = JSON.parse(rawBody);
              applyChatMessage(data?.choices?.[0]?.message || {}, data?.usage);
            } catch {
              emitTextDelta(rawBody.trim());
            }
          }

          // Codex expects a completed output item. Even when upstream returns
          // an empty assistant message, emit the message lifecycle explicitly.
          if (!messageStarted && toolCalls.size === 0) ensureTextItem();

          if (!completionTokens) completionTokens = Math.max(countTokens(fullContent), estimateToolCallTokens(toolCalls.values()));
          const totalTokens = promptTokens + completionTokens;
          const usage = { input_tokens: promptTokens, output_tokens: completionTokens, total_tokens: totalTokens };

          recordTokens(key.id, totalTokens);

          // Send output_text.done
          if (messageStarted && textOutputIndex !== null) {
            send('response.output_text.done', {
              type: 'response.output_text.done',
              response_id: respId,
              item_id: msgId,
              output_index: textOutputIndex,
              content_index: 0,
              text: fullContent
            });

            // Send content_part.done
            send('response.content_part.done', {
              type: 'response.content_part.done',
              response_id: respId,
              item_id: msgId,
              output_index: textOutputIndex,
              content_index: 0,
              part: { type: 'output_text', text: fullContent }
            });

            // Send output_item.done
            send('response.output_item.done', {
              type: 'response.output_item.done',
              response_id: respId,
              output_index: textOutputIndex,
              item: {
                type: 'message', id: msgId, role: 'assistant',
                content: [{ type: 'output_text', text: fullContent }],
                status: 'completed'
              }
            });
          }

          for (const state of toolCalls.values()) {
            send('response.function_call_arguments.done', {
              type: 'response.function_call_arguments.done',
              response_id: respId,
              item_id: state.id,
              output_index: state.outputIndex,
              arguments: state.arguments
            });
            send('response.output_item.done', {
              type: 'response.output_item.done',
              response_id: respId,
              output_index: state.outputIndex,
              item: {
                id: state.id,
                type: 'function_call',
                call_id: state.id,
                name: state.name,
                arguments: state.arguments,
                status: 'completed'
              }
            });
          }

          const completedOutput = [
            ...(messageStarted && textOutputIndex !== null ? [{
              index: textOutputIndex,
              item: {
                type: 'message', id: msgId, role: 'assistant',
                content: [{ type: 'output_text', text: fullContent }],
                status: 'completed'
              }
            }] : []),
            ...Array.from(toolCalls.values()).map((state) => ({
              index: state.outputIndex,
              item: {
                type: 'function_call',
                id: state.id,
                call_id: state.id,
                name: state.name,
                arguments: state.arguments,
                status: 'completed'
              }
            }))
          ].sort((a, b) => a.index - b.index).map((entry) => entry.item);

          if (completedOutput.length === 0) {
            completedOutput.push({
              type: 'message', id: msgId, role: 'assistant',
              content: [{ type: 'output_text', text: '' }],
              status: 'completed'
            });
          }

          // Send response.completed
          send('response.completed', {
            type: 'response.completed',
            response: {
              id: respId, object: 'response', status: 'completed',
              model: modelName,
              output: completedOutput,
              usage
            }
          });

          await logUsage(key.id, key.userId, resolved.model.id, modelName, promptTokens, completionTokens, 200, null).catch(() => {});
          console.log(`[responses] stream done model=${modelName} content_length=${fullContent.length}`);
        } catch (e: any) {
          console.error('[responses] stream error:', e?.message);
          send('error', { type: 'error', message: e?.message || 'Lỗi stream' });
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
  const message = data?.choices?.[0]?.message || {};
  const content = message?.content || '';
  const upstreamUsage = data?.usage;
  const completionTokens = upstreamUsage?.completion_tokens || Math.max(countTokens(content), estimateToolCallTokens((message?.tool_calls || []).map((call: any) => ({
    name: call?.function?.name || call?.name || 'tool',
    arguments: call?.function?.arguments || ''
  }))));
  const totalTokens = (upstreamUsage?.prompt_tokens || promptTokens) + completionTokens;
  const usage = { input_tokens: upstreamUsage?.prompt_tokens || promptTokens, output_tokens: completionTokens, total_tokens: totalTokens };

  recordTokens(key.id, totalTokens);
  await logUsage(key.id, key.userId, resolved.model.id, modelName, usage.input_tokens, usage.output_tokens, upstream.status, null).catch(() => {});

  console.log(`[responses] done model=${modelName} content_length=${content.length} stream_requested=${stream}`);

  if (message?.tool_calls?.length) {
    const response = chatMessageToResponseOutput(message, modelName, convertedTools.chatToResponse);
    return Response.json({ ...response, usage });
  }
  return Response.json(buildResponseObject(respId, modelName, content, usage));
}
