import { NextRequest, NextResponse } from 'next/server';
import { aiConversations, users } from '@/storage/database';
import { eq } from 'drizzle-orm';
import { getDb } from 'coze-coding-dev-sdk';

// 腾讯混元 API 配置
const HUNYUAN_API_KEY = 'sk-s6QbXuDlkJ8h8VTfTEKsn7y9jUS47ZOXQzzTm34SeeznvbrK';
const HUNYUAN_API_URL = 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions';

const CITY_MAPPINGS: Record<string, string> = {
  'new york': 'New York', '纽约': 'New York',
  'los angeles': 'Los Angeles', '洛杉矶': 'Los Angeles',
  'san francisco': 'San Francisco', '旧金山': 'San Francisco',
  'chicago': 'Chicago', '芝加哥': 'Chicago',
  'miami': 'Miami', '迈阿密': 'Miami',
  'toronto': 'Toronto', '多伦多': 'Toronto',
  'vancouver': 'Vancouver', '温哥华': 'Vancouver',
  'são paulo': 'São Paulo', 'sao paulo': 'São Paulo', '圣保罗': 'São Paulo',
  'london': 'London', '伦敦': 'London',
  'paris': 'Paris', '巴黎': 'Paris',
  'berlin': 'Berlin', '柏林': 'Berlin',
  'munich': 'Munich', '慕尼黑': 'Munich',
  'frankfurt': 'Frankfurt', '法兰克福': 'Frankfurt',
  'rome': 'Rome', '罗马': 'Rome',
  'madrid': 'Madrid', '马德里': 'Madrid',
  'amsterdam': 'Amsterdam', '阿姆斯特丹': 'Amsterdam',
  'vienna': 'Vienna', '维也纳': 'Vienna',
  'zurich': 'Zurich', '苏黎世': 'Zurich',
  'beijing': 'Beijing', '北京': 'Beijing',
  'shanghai': 'Shanghai', '上海': 'Shanghai',
  'guangzhou': 'Guangzhou', '广州': 'Guangzhou',
  'shenzhen': 'Shenzhen', '深圳': 'Shenzhen',
  'hangzhou': 'Hangzhou', '杭州': 'Hangzhou',
  'chengdu': 'Chengdu', '成都': 'Chengdu',
  'wuhan': 'Wuhan', '武汉': 'Wuhan',
  'nanjing': 'Nanjing', '南京': 'Nanjing',
  'xian': 'Xi\'an', '西安': 'Xi\'an',
  'tianjin': 'Tianjin', '天津': 'Tianjin',
  'qingdao': 'Qingdao', '青岛': 'Qingdao',
  'dalian': 'Dalian', '大连': 'Dalian',
  'xiamen': 'Xiamen', '厦门': 'Xiamen',
  'suzhou': 'Suzhou', '苏州': 'Suzhou',
  'chongqing': 'Chongqing', '重庆': 'Chongqing',
};

const SYSTEM_PROMPT = `You are a professional medical assistant for GoChinaMed, a medical tourism platform helping international patients access healthcare in China.

Your responsibilities:
1. Provide accurate medical information and guidance
2. Help patients understand their symptoms and possible treatments
3. Recommend suitable doctors and hospitals in China based on patient conditions
4. Answer questions about medical tourism, including travel, accommodation, and cultural aspects
5. Be empathetic, professional, and supportive.

Guidelines:
- Always prioritize patient safety
- Suggest consulting with healthcare professionals for serious conditions
- Provide clear, easy-to-understand explanations
- Consider cultural differences and language barriers
- Ask follow-up questions when necessary to better understand the patient's needs

Available information:
- We have access to top Chinese hospitals and renowned doctors
- We can help with treatment planning, travel arrangements, and accommodation
- We support multiple languages: English, German, French, Chinese

Tone: Professional, empathetic, informative, and reassuring`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, language = 'en' } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = '';

          // 调用腾讯混元 API（流式）
          const hunyuanRes = await fetch(HUNYUAN_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${HUNYUAN_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'hunyuan-pro',
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: message },
              ],
              stream: true,
              temperature: 0.7,
            }),
          });

          if (!hunyuanRes.ok || !hunyuanRes.body) {
            // API 失败，返回降级响应
            const fallbackMsg = language === "zh"
              ? "抱歉，AI助手暂时无法连接（API密钥可能已过期）。请访问 https://console.cloud.tencent.com/hunyuan/start 获取新密钥。\n\n您可以直接浏览我们的医院和医生页面，或使用搜索功能。"
              : "Sorry, the AI assistant is temporarily unavailable (API key may have expired). Please visit https://console.cloud.tencent.com/hunyuan/start for a new key.\n\nYou can browse our hospitals and doctors pages, or use the search function.";
            const fallbackData = JSON.stringify({ content: fallbackMsg }) + "\n";
            controller.enqueue(encoder.encode("data: " + fallbackData));
            controller.enqueue(encoder.encode("data: [DONE]\n"));
            controller.close();
            return;
          }
          const reader = hunyuanRes.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(l => l.trim());

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  fullResponse += content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));

          // 保存对话到数据库
          if (userId) {
            try {
              const db = await getDb();
              const [existingConversation] = await db
                .select()
                .from(aiConversations)
                .where(eq(aiConversations.userId, userId))
                .orderBy(aiConversations.createdAt)
                .limit(1);

              if (existingConversation) {
                const msgs = JSON.parse(JSON.stringify(existingConversation.messages || []));
                msgs.push(
                  { role: 'user', content: message },
                  { role: 'assistant', content: fullResponse }
                );
                await db.update(aiConversations)
                  .set({ messages: JSON.stringify(msgs), updatedAt: new Date() })
                  .where(eq(aiConversations.id, existingConversation.id));
              } else {
                await db.insert(aiConversations).values({
                  userId,
                  messages: JSON.stringify([
                    { role: 'user', content: message },
                    { role: 'assistant', content: fullResponse },
                  ]),
                });
              }

              // 提取城市信息
              const lowerMessage = message.toLowerCase();
              const citiesFound: string[] = [];
              for (const [key, value] of Object.entries(CITY_MAPPINGS)) {
                if (lowerMessage.includes(key) && !citiesFound.includes(value)) {
                  citiesFound.push(value);
                }
              }

              if (citiesFound.length > 0) {
                const updateData: any = { updatedAt: new Date() };
                if (citiesFound[0]) updateData.originCity = citiesFound[0];
                if (citiesFound[1]) updateData.destinationCity = citiesFound[1];
                await db.update(users).set(updateData).where(eq(users.id, userId));
              }
            } catch (dbError) {
              console.error('Error saving conversation:', dbError);
            }
          }
        } catch (error) {
          console.error('Hunyuan API error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Failed to generate response' })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const db = await getDb();
    const [conversation] = await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(aiConversations.createdAt)
      .limit(1);

    if (!conversation) {
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({ messages: JSON.parse(JSON.stringify(conversation.messages || [])) });
  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json({ error: 'Failed to retrieve conversation' }, { status: 500 });
  }
}
