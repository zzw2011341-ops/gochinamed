/**
 * 腾讯混元大模型客户端
 * 使用 TC3-HMAC-SHA256 签名（与 HefunderMedAI 一致）
 */

import crypto from 'crypto';

const SECRET_ID = process.env.HUNYUAN_SECRET_ID || "";
const SECRET_KEY = process.env.HUNYUAN_SECRET_KEY || "";
const API_ENDPOINT = "hunyuan.tencentcloudapi.com";
const SERVICE = "hunyuan";

export interface HunyuanMessage {
  Role: "system" | "user" | "assistant";
  Content: string;
}

function sha256(message: string): string {
  return crypto.createHash('sha256').update(Buffer.from(message, 'utf8')).digest('hex');
}

function hmacSha256(key: Buffer | string, message: string): Buffer {
  return crypto.createHmac('sha256', key).update(Buffer.from(message, 'utf8')).digest();
}

function sign(secretKey: string, date: string): Buffer {
  const dateKey = hmacSha256(Buffer.from('TC3' + secretKey, 'utf8'), date);
  const serviceKey = hmacSha256(dateKey, SERVICE);
  return hmacSha256(serviceKey, 'tc3_request');
}

function buildAuth(method: string, payload: string, timestamp: string, date: string): string {
  const hashedPayload = sha256(payload);
  const credentialScope = `${date}/${SERVICE}/tc3_request`;
  const signedHeaders = 'content-type;host;x-tc-action';
  
  const canonicalRequest = [
    method,
    '/',
    '',
    'content-type:application/json',
    `host:${API_ENDPOINT}`,
    'x-tc-action:chatcompletions',
    '',
    signedHeaders,
    hashedPayload,
  ].join('\n');

  const hashedCanonicalRequest = sha256(canonicalRequest);
  const stringToSign = [
    'TC3-HMAC-SHA256',
    timestamp,
    credentialScope,
    hashedCanonicalRequest,
  ].join('\n');

  const signingKey = sign(SECRET_KEY, date);
  const signature = hmacSha256(signingKey, stringToSign).toString('hex');

  return `TC3-HMAC-SHA256 Credential=${SECRET_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

export async function callHunyuan(
  messages: HunyuanMessage[],
  options: {
    model?: string;
    temperature?: number;
  } = {}
): Promise<string> {
  const { model = "hunyuan-lite", temperature = 0.7 } = options;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const date = new Date(parseInt(timestamp) * 1000).toISOString().split('T')[0];

  const payload = JSON.stringify({
    Model: model,
    Messages: messages,
    Stream: false,
    Temperature: temperature,
  });

  const auth = buildAuth('POST', payload, timestamp, date);

  const response = await fetch(`https://${API_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Host': API_ENDPOINT,
      'X-TC-Action': 'ChatCompletions',
      'X-TC-Timestamp': timestamp,
      'X-TC-Version': '2023-09-01',
      'Authorization': auth,
    },
    body: payload,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`混元 API 错误 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.Response?.Choices?.[0]?.Message?.Content || "";
  return content;
}

export async function* streamHunyuan(
  messages: HunyuanMessage[],
  options: {
    model?: string;
    temperature?: number;
  } = {}
): AsyncGenerator<string> {
  const { model = "hunyuan-lite", temperature = 0.7 } = options;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const date = new Date(parseInt(timestamp) * 1000).toISOString().split('T')[0];

  const payload = JSON.stringify({
    Model: model,
    Messages: messages,
    Stream: true,
    Temperature: temperature,
  });

  const auth = buildAuth('POST', payload, timestamp, date);

  const response = await fetch(`https://${API_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Host': API_ENDPOINT,
      'X-TC-Action': 'ChatCompletions',
      'X-TC-Timestamp': timestamp,
      'X-TC-Version': '2023-09-01',
      'Authorization': auth,
    },
    body: payload,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`混元 API 错误 (${response.status}): ${errorText}`);
  }

  if (!response.body) throw new Error("响应体为空");

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
          const chunk = JSON.parse(data);
          const content = chunk.Response?.Choices?.[0]?.Delta?.Content;
          if (content) yield content;
        } catch (e) {
          console.error("解析流式响应失败:", e);
        }
      }
    }
  }
}
