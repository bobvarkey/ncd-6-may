/**
 * NVIDIA NIM API client
 * Uses the OpenAI-compatible endpoint at api.nvcf.nvidia.com
 *
 * To use in development:
 *   export VITE_NVIDIA_API_KEY="nvapi-..."
 *   npx vite
 *
 * For production, set VITE_NVIDIA_API_KEY at build time.
 */

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const MODEL = "nvidia/llama-3.1-nemotron-70b-instruct";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

interface ChatCompletionResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Get the NVIDIA API key from Vite env vars
 * The key must be prefixed with VITE_ to be exposed client-side
 */
function getApiKey(): string {
  try {
    return (import.meta as any).env?.VITE_NVIDIA_API_KEY ?? "";
  } catch {
    return "";
  }
}

/**
 * Send a chat completion request to NVIDIA NIM
 */
export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "NVIDIA_API_KEY not set. Run: export VITE_NVIDIA_API_KEY=\"nvapi-...\""
    );
  }

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: options.messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    model: data.model,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  };
}

/**
 * Quick helper: send a single user message and get a response
 */
export async function askNvidia(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const messages: ChatMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const result = await chatCompletion({ messages });
  return result.content;
}
