import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { apiConfigs } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { apiManager } from '@/lib/api';

/**
 * 获取汇率数据
 * GET /api/exchange?from=USD&to=EUR|CNY|...
 * GET /api/exchange?type=convert&amount=100&from=USD&to=CNY
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'rates'; // rates | convert
    const from = searchParams.get('from') || 'USD';
    const to = searchParams.get('to');
    const amount = parseFloat(searchParams.get('amount') || '1');

    // 获取汇率API配置
    const db = await getDb();
    const [config] = await db
      .select()
      .from(apiConfigs)
      .where(eq(apiConfigs.provider, 'exchangerate' as any));

    if (!config || !config.isActive) {
      // 如果没有配置汇率API，返回固定汇率
      const fixedRates: Record<string, number> = {
        USD: 1,
        CNY: 7.2,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.5,
        KRW: 1320,
        HKD: 7.82,
        SGD: 1.34,
        AUD: 1.53,
        CAD: 1.36,
      };

      if (type === 'convert' && to) {
        const rate = fixedRates[to] || 1;
        const result = (amount / fixedRates[from]) * rate;
        return NextResponse.json({
          success: true,
          data: {
            amount: Number(result.toFixed(2)),
            from,
            to,
            rate: Number((rate / fixedRates[from]).toFixed(6)),
          },
          mock: true,
          message: 'Using fixed exchange rates (API not configured)',
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          base: from,
          rates: fixedRates,
          timestamp: new Date(),
          provider: 'fixed',
        },
        mock: true,
        message: 'Using fixed exchange rates (API not configured)',
      });
    }

    // 注册配置并调用API
    apiManager.registerConfig({
      ...config,
      description: config.description || undefined,
      apiKey: config.apiKey || undefined,
      apiSecret: config.apiSecret || undefined,
      webhookUrl: config.webhookUrl || undefined,
      rateLimit: config.rateLimit || undefined,
      config: config.config ? (config.config as Record<string, any>) : undefined,
      metadata: config.metadata ? (config.metadata as Record<string, any>) : undefined,
      lastTestedAt: config.lastTestedAt || undefined,
      lastTestStatus: config.lastTestStatus || undefined,
      lastTestMessage: config.lastTestMessage || undefined,
    });
    const exchangeService = apiManager.getExchangeRateService();

    if (!exchangeService) {
      return NextResponse.json(
        { error: 'Exchange rate service not available' },
        { status: 500 }
      );
    }

    let result;
    if (type === 'convert' && to) {
      result = await exchangeService.convertCurrency(amount, from, to);
    } else if (to) {
      result = await exchangeService.getExchangeRate(from, to);
    } else {
      result = await exchangeService.getExchangeRates(from);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates', details: error },
      { status: 500 }
    );
  }
}
