import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { paymentAccounts } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { verifyAdmin } from '@/lib/admin-auth';

// 验证schema
const createPaymentAccountSchema = z.object({
  type: z.enum(['stripe', 'paypal', 'bank_transfer', 'wechat', 'alipay']),
  accountName: z.string().min(1).max(255),
  accountNumber: z.string().min(1).max(255),
  bankName: z.string().max(255).optional(),
  currency: z.string().length(3).default('USD'),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  webhookUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

const updatePaymentAccountSchema = createPaymentAccountSchema.partial().extend({
  id: z.string(),
});

/**
 * GET - 获取所有收款账户
 */
export async function GET(request: NextRequest) {
  try {
    const adminUser = await verifyAdmin(request);
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const db = await getDb();

    const accounts = await db.select().from(paymentAccounts);

    return NextResponse.json({
      success: true,
      accounts: accounts.map((acc: any) => ({
        id: acc.id,
        type: acc.type,
        accountName: acc.accountName,
        accountNumber: acc.accountNumber,
        bankName: acc.bankName,
        currency: acc.currency,
        isActive: acc.isActive,
        isDefault: acc.isDefault,
        webhookUrl: acc.webhookUrl,
        createdAt: acc.createdAt,
        updatedAt: acc.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch payment accounts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment accounts' },
      { status: 500 }
    );
  }
}

/**
 * POST - 创建新的收款账户
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createPaymentAccountSchema.parse(body);

    const db = await getDb();

    // 如果设置为默认账户，先将其他账户的默认状态设为false
    if (validatedData.isDefault) {
      await db
        .update(paymentAccounts)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(paymentAccounts.type, validatedData.type));
    }

    const [newAccount] = await db.insert(paymentAccounts).values({
      id: uuidv4(),
      type: validatedData.type,
      accountName: validatedData.accountName,
      accountNumber: validatedData.accountNumber,
      bankName: validatedData.bankName,
      currency: validatedData.currency,
      apiKey: validatedData.apiKey,
      apiSecret: validatedData.apiSecret,
      webhookUrl: validatedData.webhookUrl,
      isActive: validatedData.isActive,
      isDefault: validatedData.isDefault,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({
      success: true,
      message: 'Payment account created successfully',
      account: {
        id: newAccount.id,
        type: newAccount.type,
        accountName: newAccount.accountName,
        accountNumber: newAccount.accountNumber,
        bankName: newAccount.bankName,
        currency: newAccount.currency,
        isActive: newAccount.isActive,
        isDefault: newAccount.isDefault,
      },
    });
  } catch (error) {
    console.error('Failed to create payment account:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create payment account' },
      { status: 500 }
    );
  }
}

/**
 * PUT - 更新收款账户
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = updatePaymentAccountSchema.parse(body);

    const db = await getDb();

    // 如果设置为默认账户，先将同类型其他账户的默认状态设为false
    if (validatedData.isDefault) {
      await db
        .update(paymentAccounts)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(paymentAccounts.type, validatedData.type));
    }

    const [updatedAccount] = await db
      .update(paymentAccounts)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(paymentAccounts.id, validatedData.id!))
      .returning();

    if (!updatedAccount) {
      return NextResponse.json(
        { success: false, error: 'Payment account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment account updated successfully',
      account: {
        id: updatedAccount.id,
        type: updatedAccount.type,
        accountName: updatedAccount.accountName,
        accountNumber: updatedAccount.accountNumber,
        bankName: updatedAccount.bankName,
        currency: updatedAccount.currency,
        isActive: updatedAccount.isActive,
        isDefault: updatedAccount.isDefault,
      },
    });
  } catch (error) {
    console.error('Failed to update payment account:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update payment account' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - 删除收款账户
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    const deletedAccount = await db
      .delete(paymentAccounts)
      .where(eq(paymentAccounts.id, id))
      .returning();

    if (deletedAccount.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Payment account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment account deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete payment account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete payment account' },
      { status: 500 }
    );
  }
}
