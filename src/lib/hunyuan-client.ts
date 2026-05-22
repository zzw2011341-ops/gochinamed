/**
 * 腾讯混元大模型客户端
 * 支持两种调用方式：
 * 1. OpenAI 兼容接口（推荐，使用 HUNYUAN_API_KEY）
 * 2. TC3-HMAC-SHA256 签名（使用 HUNYUAN_SECRET_ID + HUNYUAN_SECRET_KEY）
 */

import crypto from 'crypto';

// ============ 配置 ============
const API_KEY = process.env.HUNYUAN_API_KEY || "";
const SECRET_ID = process.env.HUNYUAN_SECRET_ID || "";
const SECRET_KEY = process.env.HUNYUAN_SECRET_KEY || "";

// OpenAI 兼容接口（推荐）
const OPENAI_COMPAT_ENDPOINT = "https://api.hunyuan.cloud.tencent.com/v1/chat/completions";

// TC3 接口
const TC3_ENDPOINT = "hunyuan.tencentcloudapi.com";
const TC3_SERVICE = "hunyuan";

// ============ 类型定义 ============
export interface HunyuanMessage {
  Role: "system" | "user" | "assistant";
  Content: string;
}

export interface HunyuanOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// ============ TC3 签名工具（备用） ============
function sha256(message: string): string {
  return crypto.createHash('sha256').update(Buffer.from(message, 'utf8')).digest('hex');
}

function hmacSha256(key: Buffer | string, message: string): Buffer {
  return crypto.createHmac('sha256', key).update(Buffer.from(message, 'utf8')).digest();
}

function sign(secretKey: string, date: string): Buffer {
  const dateKey = hmacSha256(Buffer.from('TC3' + secretKey, 'utf8'), date);
  const serviceKey = hmacSha256(dateKey, TC3_SERVICE);
  return hmacSha256(serviceKey, 'tc3_request');
}

// ============ 方式1：OpenAI 兼容接口（推荐） ============
async function callOpenAICompat(
  messages: HunyuanMessage[],
  options: HunyuanOptions = {}
): Promise<string> {
  const {
    model = 'hunyuan-lite',
    temperature = 0.7,
    maxTokens = 2000,
  } = options;

  const response = await fetch(OPENAI_COMPAT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({
        role: m.Role === 'system' ? 'system' : m.Role === 'user' ? 'user' : 'assistant',
        content: m.Content,
      })),
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hunyuan API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ============ 方式2：TC3 签名接口（备用） ============
async function callTC3(
  messages: HunyuanMessage[],
  options: HunyuanOptions = {}
): Promise<string> {
  const {
    model = 'hunyuan-lite',
    temperature = 0.7,
    maxTokens = 2000,
  } = options;

  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().split('T')[0];

  const payload = JSON.stringify({
    Model: model,
    Messages: messages,
    Temperature: temperature,
    MaxTokens: maxTokens,
    Stream: false,
  });

  const hashedPayload = sha256(payload);
  const credentialScope = `${date}/${TC3_SERVICE}/tc3_request`;
  const signedHeaders = 'content-type;host;x-tc-action';

  const canonicalRequest = [
    'POST',
    '/',
    '',
    'content-type:application/json',
    `host:${TC3_ENDPOINT}`,
    `x-tc-action:chatcompletions`,
    '',
    signedHeaders,
    hashedPayload,
  ].join('\n');

  const hashedCanonicalRequest = sha256(canonicalRequest);
  const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`;

  const signingKey = sign(SECRET_KEY, date);
  const signature = hmacSha256(signingKey, stringToSign).toString('hex');

  const authorization = [
    `TC3-HMAC-SHA256 Credential=${SECRET_ID}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(', ');

  const response = await fetch(`https://${TC3_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authorization,
      'Host': TC3_ENDPOINT,
      'X-TC-Action': 'ChatCompletions',
      'X-TC-Timestamp': String(timestamp),
      'X-TC-Version': '2023-09-01',
    },
    body: payload,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hunyuan TC3 API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.Response?.Choices?.[0]?.Message?.Content || '';
}

// ============ 主调用函数 ============
export async function callHunyuan(
  messages: HunyuanMessage[],
  options: HunyuanOptions = {}
): Promise<string> {
  // 优先使用 API Key（OpenAI 兼容接口）
  if (API_KEY) {
    try {
      return await callOpenAICompat(messages, options);
    } catch (error: any) {
      console.error('OpenAI compat call failed:', error.message);
      // 如果 API Key 失败且有 TC3 配置，尝试 TC3
      if (SECRET_ID && SECRET_KEY) {
        console.log('Falling back to TC3 signature...');
        return await callTC3(messages, options);
      }
      throw error;
    }
  }

  // 没有 API Key，使用 TC3 签名
  if (SECRET_ID && SECRET_KEY) {
    return await callTC3(messages, options);
  }

  throw new Error('No Hunyuan credentials configured. Set HUNYUAN_API_KEY or HUNYUAN_SECRET_ID + HUNYUAN_SECRET_KEY');
}

// ============ 流式调用（用于聊天） ============
export async function streamHunyuan(
  messages: HunyuanMessage[],
  options: HunyuanOptions = {}
): Promise<ReadableStream> {
  const {
    model = 'hunyuan-lite',
    temperature = 0.7,
    maxTokens = 2000,
  } = options;

  if (!API_KEY) {
    throw new Error('Streaming requires HUNYUAN_API_KEY (OpenAI compat mode)');
  }

  const response = await fetch(OPENAI_COMPAT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({
        role: m.Role === 'system' ? 'system' : m.Role === 'user' ? 'user' : 'assistant',
        content: m.Content,
      })),
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hunyuan stream error: ${response.status} ${error}`);
  }

  return response.body!;
}
