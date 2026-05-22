import { NextRequest, NextResponse } from 'next/server';
import { streamHunyuan } from '@/lib/hunyuan-client';

const SYSTEM_PROMPT = `You are a professional medical assistant for GoChinaMed, a medical tourism platform. Always prioritize patient safety and suggest consulting healthcare professionals for serious conditions.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const rawStream = await streamHunyuan(
      [
        { Role: 'system', Content: SYSTEM_PROMPT },
        { Role: 'user', Content: message }
      ],
      { model: 'hunyuan-lite', temperature: 0.7 }
    );

    // 包装为 SSE 格式
    const encoder = new TextEncoder();
    const sseStream = new ReadableStream({
      async start(controller) {
        const reader = rawStream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = new TextDecoder().decode(value);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    });

    return new Response(sseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
