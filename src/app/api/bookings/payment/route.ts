import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, payment, documents } = body;
    
    console.log('[Payment API] Received payment request:', JSON.stringify(body, null, 2));
    
    // 验证必需字段
    if (!plan || !payment || !documents?.passportNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 模拟支付处理（2秒）
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 生成测试订单ID
    const orderId = 'TEST-' + Date.now();
    
    console.log('[Payment API] Payment successful (TEST MODE):', orderId);

    return NextResponse.json({
      success: true,
      orderId: orderId,
      message: 'Payment successful (TEST MODE)',
      redirectUrl: '/book/confirmation/' + orderId,
    });

  } catch (error) {
    console.error('[Payment API] Error:', error);
    return NextResponse.json(
      { error: 'Payment failed', details: String(error) },
      { status: 500 }
    );
  }
}
