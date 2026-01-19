import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, ASRClient, TTSClient } from 'coze-coding-dev-sdk';
import { aiConversations, users } from '@/storage/database';
import { eq } from 'drizzle-orm';
import { getDb } from 'coze-coding-dev-sdk';

// 城市名称映射 - 用于识别用户消息中的城市
const CITY_MAPPINGS = {
  // 美洲
  'new york': 'New York', '纽约': 'New York',
  'los angeles': 'Los Angeles', '洛杉矶': 'Los Angeles',
  'san francisco': 'San Francisco', '旧金山': 'San Francisco',
  'chicago': 'Chicago', '芝加哥': 'Chicago',
  'miami': 'Miami', '迈阿密': 'Miami',
  'toronto': 'Toronto', '多伦多': 'Toronto',
  'vancouver': 'Vancouver', '温哥华': 'Vancouver',
  'são paulo': 'São Paulo', 'sao paulo': 'São Paulo', '圣保罗': 'São Paulo',

  // 欧洲
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

  // 中国
  'beijing': 'Beijing', '北京': 'Beijing',
  'shanghai': 'Shanghai', '上海': 'Shanghai',
  'guangzhou': 'Guangzhou', '广州': 'Guangzhou',
  'shenzhen': 'Shenzhen', '深圳': 'Shenzhen',
  'hangzhou': 'Hangzhou', '杭州': 'Hangzhou',
  'chengdu': 'Chengdu', '成都': 'Chengdu',
  'wuhan': 'Wuhan', '武汉': 'Wuhan',
  'nanjing': 'Nanjing', '南京': 'Nanjing',
  'xi\'an': 'Xi\'an', 'xian': 'Xi\'an', '西安': 'Xi\'an',
  'tianjin': 'Tianjin', '天津': 'Tianjin',
  'qingdao': 'Qingdao', '青岛': 'Qingdao',
  'dalian': 'Dalian', '大连': 'Dalian',
  'xiamen': 'Xiamen', '厦门': 'Xiamen',
  'suzhou': 'Suzhou', '苏州': 'Suzhou',
  'chongqing': 'Chongqing', '重庆': 'Chongqing',
};

const config = new Config();
const llmClient = new LLMClient(config);
const asrClient = new ASRClient(config);
const ttsClient = new TTSClient(config);

// System prompt for AI medical assistant
const SYSTEM_PROMPT = `You are a professional medical assistant for GoChinaMed, a medical tourism platform helping international patients access healthcare in China.

Your responsibilities:
1. Provide accurate medical information and guidance
2. Help patients understand their symptoms and possible treatments
3. Recommend suitable doctors and hospitals in China based on patient conditions
4. Answer questions about medical tourism, including travel, accommodation, and cultural aspects
5. Be empathetic, professional, and supportive

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
    const { message, userId, language = 'en', useVoice = false, audioData } = body;

    if (!message && !audioData) {
      return NextResponse.json(
        { error: 'Message or audio data is required' },
        { status: 400 }
      );
    }

    let userMessage = message;

    // Process voice input if provided
    if (audioData) {
      try {
        const recognitionResult = await asrClient.recognize({
          uid: userId || 'anonymous',
          base64Data: audioData,
        });
        userMessage = recognitionResult.text;
      } catch (error) {
        console.error('Speech recognition error:', error);
        return NextResponse.json(
          { error: 'Failed to process voice input' },
          { status: 500 }
        );
      }
    }

    // Prepare messages for LLM
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: userMessage },
    ];

    // Call LLM with streaming enabled
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = '';

          for await (const chunk of llmClient.stream(messages, {
            model: 'doubao-seed-1-6-251015',
            temperature: 0.7,
            thinking: 'disabled',
          })) {
            if (chunk.content) {
              const content = chunk.content.toString();
              fullResponse += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));

          // Save conversation to database if userId is provided
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
                await db
                  .update(aiConversations)
                  .set({
                    messages: JSON.stringify([
                      ...JSON.parse(JSON.stringify(existingConversation.messages || [])),
                      { role: 'user', content: userMessage },
                      { role: 'assistant', content: fullResponse },
                    ]),
                    updatedAt: new Date(),
                  })
                  .where(eq(aiConversations.id, existingConversation.id));
              } else {
                await db.insert(aiConversations).values({
                  userId,
                  messages: JSON.stringify([
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: fullResponse },
                  ]),
                });
              }

              // 提取并保存城市信息
              const lowerMessage = userMessage.toLowerCase();
              const citiesFound: string[] = [];

              // 在消息中查找城市名称
              for (const [key, value] of Object.entries(CITY_MAPPINGS)) {
                if (lowerMessage.includes(key)) {
                  if (!citiesFound.includes(value)) {
                    citiesFound.push(value);
                  }
                }
              }

              if (citiesFound.length > 0) {
                // 判断哪个是出发城市，哪个是目的城市
                // 简单逻辑：第一个提到的城市通常是出发地，第二个是目的地
                const originCity = citiesFound[0];
                const destinationCity = citiesFound.length > 1 ? citiesFound[1] : null;

                const updateData: any = { updatedAt: new Date() };
                if (originCity) updateData.originCity = originCity;
                if (destinationCity) updateData.destinationCity = destinationCity;

                await db.update(users)
                  .set(updateData)
                  .where(eq(users.id, userId));
              }
            } catch (error) {
              console.error('Error saving conversation or cities:', error);
            }
          }
        } catch (error) {
          console.error('LLM streaming error:', error);
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve conversation history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
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

    const messages = JSON.parse(JSON.stringify(conversation.messages || []));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve conversation' },
      { status: 500 }
    );
  }
}
