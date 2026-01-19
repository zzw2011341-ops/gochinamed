import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { users } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

/**
 * 验证用户是否为管理员
 * @param request NextRequest对象
 * @returns 用户对象或null（如果不是管理员）
 */
export async function verifyAdmin(request: NextRequest) {
  try {
    // 从session或token中获取用户ID
    // 这里简化处理，实际应该使用JWT或session
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return null;
    }

    const db = await getDb();

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Failed to verify admin:', error);
    return null;
  }
}

/**
 * 管理员权限验证中间件
 * 如果用户不是管理员，返回403错误
 */
export function withAdminAuth(handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      const adminUser = await verifyAdmin(request);

      if (!adminUser) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Admin access required' },
          { status: 403 }
        );
      }

      // 将admin用户信息附加到request中
      (request as any).adminUser = adminUser;

      return handler(request, ...args);
    } catch (error) {
      console.error('Admin auth error:', error);
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

/**
 * 从请求中获取用户ID（简化版本）
 * 实际项目中应该从JWT token或session中获取
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  // 方式1：从header中获取
  const userId = request.headers.get('x-user-id');
  if (userId) return userId;

  // 方式2：从cookie中获取
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const userIdCookie = cookies.find(c => c.startsWith('user_id='));
    if (userIdCookie) {
      return userIdCookie.split('=')[1];
    }
  }

  return null;
}
