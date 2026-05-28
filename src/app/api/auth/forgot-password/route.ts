import { NextRequest, NextResponse } from 'next/server';
import { AuthManager } from '@/storage/database/authManager';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await AuthManager.findByEmail(email);
    if (!user) {
      // 不暴露用户是否存在，统一返回成功
      return NextResponse.json({
        success: true,
        message: 'If the email is registered, a reset link will be sent. For now, please contact admin@hefunder.cn to reset your password.'
      });
    }

    // 生成重置token
    const resetToken = Buffer.from(`${user.id}:${Date.now()}:reset`).toString('base64');

    // TODO: 实际发送邮件（当前仅返回成功）
    console.log(`Password reset requested for ${email}, token: ${resetToken}`);

    return NextResponse.json({
      success: true,
      message: 'If the email is registered, a reset link will be sent. For now, please contact admin@hefunder.cn to reset your password.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
