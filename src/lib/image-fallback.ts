import { prisma } from './prisma';
import { resolveModelEndpoint, type ResolvedModel } from './router';

/** Check if a message content array contains images (Anthropic or OpenAI format). */
function contentHasImages(content: unknown): boolean {
  if (!Array.isArray(content)) return false;
  return content.some((part: any) => {
    if (!part || typeof part !== 'object') return false;
    // Anthropic: { type: 'image', source: { ... } }
    if (part.type === 'image') return true;
    // OpenAI: { type: 'image_url', image_url: { url: ... } }
    if (part.type === 'image_url') return true;
    return false;
  });
}

/** Check if any message in the array contains image parts. */
export function hasImageContent(messages: any[] | undefined | null): boolean {
  if (!Array.isArray(messages)) return false;

  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') continue;

    // content is array of content parts
    if (contentHasImages(msg.content)) return true;

    // Responses API: input items, each item has content[]
    const itemContent = msg.content ?? msg.input ?? msg.item?.content;
    if (itemContent !== msg.content && contentHasImages(itemContent)) return true;
  }

  return false;
}

/**
 * Resolve model with image fallback: if messages contain images
 * and the current model has imageFallbackModel configured, resolve
 * the fallback model instead.
 */
export async function resolveModelWithImageFallback(
  modelName: string,
  messages: any[] | undefined | null
): Promise<ResolvedModel | null> {
  const resolved = await resolveModelEndpoint(modelName);
  if (!resolved) return null;

  // No images → use original model
  if (!hasImageContent(messages)) return resolved;

  // Model has no image fallback → use original
  const fallbackName = resolved.model.imageFallbackModel;
  if (!fallbackName) return resolved;

  const fallback = await resolveModelEndpoint(fallbackName);
  if (!fallback) {
    console.warn(`[image-fallback] fallback model "${fallbackName}" not found, using original "${modelName}"`);
    return resolved;
  }

  console.log(`[image-fallback] images detected: "${modelName}" → fallback "${fallbackName}"`);
  return fallback;
}
