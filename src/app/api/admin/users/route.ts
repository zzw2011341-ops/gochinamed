import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { users } from '@/storage/database/shared/schema';
import { eq, like, or } from 'drizzle-orm';
import { z } from 'zod';

// 验证schema
const updateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(128).optional(),
  phone: z.string().min(1).max(20).optional(),
  passportNumber: z.string().max(50).optional(),
  passportCountry: z.string().max(10).optional(),
  preferredLanguage: z.enum(['en', 'de', 'fr', 'zh']).optional(),
  role: z.enum(['patient', 'admin', 'staff']).optional(),
  isBlocked: z.boolean().optional(),
  points: z.number().int().optional(),
  originCity: z.string().max(100).optional(),
  destinationCity: z.string().max(100).optional(),
  budget: z.number().optional(),
});

/**
 * GET - 获取所有用户
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const isBlocked = searchParams.get('isBlocked');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = await getDb();

    // 构建查询条件
    const conditions = [];
    if (role) {
      conditions.push(eq(users.role, role));
    }
    if (isBlocked !== null) {
      conditions.push(eq(users.isBlocked, isBlocked === 'true'));
    }
    if (search) {
      conditions.push(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`),
          like(users.phone, `%${search}%`)
        )!
      );
    }

    // 查询用户
    let usersList;
    if (conditions.length > 0) {
      usersList = await db.query.users.findMany({
        where: conditions.length === 1 ? conditions[0] : conditions.reduce((acc, cond) => acc && cond),
        limit,
        offset,
      });
    } else {
      usersList = await db.query.users.findMany({
        limit,
        offset,
      });
    }

    // 获取总数
    const totalUsers = await db.select({ count: users.id }).from(users);

    return NextResponse.json({
      success: true,
      users: usersList.map((user: any) => ({
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        isBlocked: user.isBlocked,
        points: user.points,
        passportNumber: user.passportNumber,
        passportCountry: user.passportCountry,
        preferredLanguage: user.preferredLanguage,
        originCity: user.originCity,
        destinationCity: user.destinationCity,
        budget: user.budget ? Number(user.budget) : null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      total: totalUsers.length,
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * PUT - 更新用户信息
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    const db = await getDb();

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;
    if (validatedData.passportNumber !== undefined) updateData.passportNumber = validatedData.passportNumber;
    if (validatedData.passportCountry !== undefined) updateData.passportCountry = validatedData.passportCountry;
    if (validatedData.preferredLanguage !== undefined) updateData.preferredLanguage = validatedData.preferredLanguage;
    if (validatedData.role !== undefined) updateData.role = validatedData.role;
    if (validatedData.isBlocked !== undefined) updateData.isBlocked = validatedData.isBlocked;
    if (validatedData.points !== undefined) updateData.points = validatedData.points;
    if (validatedData.originCity !== undefined) updateData.originCity = validatedData.originCity;
    if (validatedData.destinationCity !== undefined) updateData.destinationCity = validatedData.destinationCity;
    if (validatedData.budget !== undefined) updateData.budget = validatedData.budget.toString();

    const updated = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, validatedData.id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: updated[0].id,
        email: updated[0].email,
        phone: updated[0].phone,
        name: updated[0].name,
        role: updated[0].role,
        isBlocked: updated[0].isBlocked,
        points: updated[0].points,
        passportNumber: updated[0].passportNumber,
        passportCountry: updated[0].passportCountry,
        preferredLanguage: updated[0].preferredLanguage,
        originCity: updated[0].originCity,
        destinationCity: updated[0].destinationCity,
        budget: updated[0].budget ? Number(updated[0].budget) : null,
      },
    });
  } catch (error) {
    console.error('Failed to update user:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - 删除用户
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    const deleted = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
