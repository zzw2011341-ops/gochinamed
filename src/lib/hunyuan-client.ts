/**
 * 腾讯混元大模型客户端
 * 直接调用混元 API，替换 coze-coding-dev-sdk
 */

const HUNYUAN_API_KEY = process.env.HUNYUAN_API_KEY || "sk-sp-q9k6UedBfSttuDC0tzIPOesaScB9ywjiZ9vC62yDtXnt1eYr";
const HUNYUAN_API_URL = "https://api.hunyuan.cloud.tencent.com/hyllm/v1/chat/completions";

export interface HunyuanMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface HunyuanStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

/**
 * 调用混元 API（流式）
 */
export async function* streamHunyuan(
  messages: HunyuanMessage[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  } = {}
): AsyncGenerator<string> {
  const {
    model = "hunyuan-pro",
    temperature = 0.7,
    max_tokens = 2000,
  } = options;

  const response = await fetch(HUNYUAN_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${HUNYUAN_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature,
      max_tokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`混元 API 错误 (${response.status}): ${errorText}`);
  }

  if (!response.body) {
    throw new Error("响应体为空");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (data === "[DONE]") return;

        try {
          const chunk: HunyuanStreamChunk = JSON.parse(data);
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch (e) {
          console.error("解析流式响应失败:", e);
        }
      }
    }
  }
}

/**
 * 调用混元 API（非流式）
 */
export async function callHunyuan(
  messages: HunyuanMessage[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  } = {}
): Promise<string> {
  const {
    model = "hunyuan-pro",
    temperature = 0.7,
    max_tokens = 2000,
  } = options;

  const response = await fetch(HUNYUAN_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${HUNYUAN_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      temperature,
      max_tokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`混元 API 错误 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}
