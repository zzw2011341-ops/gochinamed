import { NextRequest, NextResponse } from 'next/server';
import { calculateFlightCostUSD } from '@/lib/services/flightPricingLocal';

interface PlanOption {
  id: string;
  name: string;
  description: string;
  hotelFee: number;
  flightFee: number;
  carFee: number;
  ticketFee: number;
  reservationFee: number;
  medicalSurgeryFee: number;
  medicineFee: number;
  nursingFee: number;
  nutritionFee: number;
  medicalFee: number;
  totalAmount: number;
  highlights: string[];
  duration: string;
  hotelName: string;
  hotelStars: number;
  flightClass: string;
  consultationDirection?: string;
  examinationItems?: string;
  surgeryTypes?: string;
  treatmentDirection?: string;
  rehabilitationDirection?: string;
  medicalPlan?: string;
  // Bug 2: 按天分时的行程文本
  itinerary?: string;
  // Bug 1: 航班路线详情（联程/直飞）
  flightRoute?: {
    isMultiLeg: boolean;
    segments: { from: string; to: string; airport?: string }[];
    description: string;
  };
}

// ---- 国际城市判定（Bug 1） ----
const CHINESE_CITIES = new Set([
  'beijing','北京','shanghai','上海','guangzhou','广州','shenzhen','深圳',
  'chengdu','成都','hangzhou','杭州','nanjing','南京','wuhan','武汉',
  'xian','西安','qingdao','青岛','dalian','大连','xiamen','厦门',
  'kunming','昆明','changsha','长沙','zhengzhou','郑州','hefei','合肥',
  'fuzhou','福州','nanchang','南昌','suzhou','苏州',
]);

function isIntlOrigin(city: string): boolean {
  return !CHINESE_CITIES.has(city) && !CHINESE_CITIES.has(city.toLowerCase());
}

/** 联程航班：国际段 + 国内段（Bug 1） */
async function multiLegFlightCost(
  origin: string, dest: string, cabin: 'economy' | 'business' | 'first', pax: number
): Promise<{ typicalPrice: number; segments: { from: string; to: string; airport: string }[]; description: string }> {
  const southern = new Set(['guangzhou','shenzhen','xiamen','kunming','nanning','fuzhou','hainan','zhuhai']);
  const d = dest.toLowerCase();
  const hub = southern.has(d) ? 'Shanghai' : 'Beijing';
  const hubAirport = hub === 'Beijing' ? 'PEK' : 'PVG';

  const intl = await calculateFlightCostUSD(origin, hub, cabin, pax);
  const domestic = await calculateFlightCostUSD(hub, dest, 'economy', pax);

  const estH = cabin === 'first' ? 16 : cabin === 'business' ? 18 : 20;
  return {
    typicalPrice: intl.typicalPrice + domestic.typicalPrice,
    segments: [
      { from: origin, to: hub, airport: hubAirport },
      { from: hub, to: dest, airport: hubAirport },
    ],
    description: `经${hub}转机（${hubAirport}），全程约${estH}小时`,
  };
}

// ---- 行程生成（Bug 2：按天分时） ----
function buildItinerary(
  destination: string, travelDate: string, returnDate: string | undefined,
  flightLabel: string, hotelName: string,
  doctorName?: string, hospitalName?: string, treatmentType?: string,
): string {
  const lines: string[] = [`📅 ${destination} 医疗旅游行程`, ''];

  let d1: Date, d4: Date;
  try {
    d1 = new Date(travelDate);
    d4 = returnDate ? new Date(returnDate) : new Date(+d1 + 6 * 86400000);
  } catch {
    lines.push('行程日期待确认');
    return lines.join('\n');
  }
  const fmt = (date: Date) => date.toISOString().split('T')[0];

  // Day 1 — 抵达日
  lines.push(`**第1天（${fmt(d1)}）：抵达${destination}**`);
  lines.push(`- ✈️ 08:00-12:00 乘坐${flightLabel}航班抵达`);
  lines.push(`- 🏨 12:00-14:00 入住${hotelName}，办理入住手续`);
  lines.push(`- 🍽️ 14:00-17:00 下午休息，适应当地环境`);
  lines.push('');

  // Day 2 — 就医日
  const d2 = new Date(+d1 + 86400000);
  lines.push(`**第2天（${fmt(d2)}）：就医日**`);
  if (hospitalName) lines.push(`- 🏥 09:00-11:00 前往${hospitalName}报到`);
  if (doctorName) lines.push(`- 👨‍⚕️ 09:00-11:00 与${doctorName}医生面诊`);
  if (treatmentType === 'examination') lines.push(`- 🔬 11:00-12:00 进行相关检查项目`);
  lines.push(`- 🎡 14:00-17:00 下午轻松游览或休息`);
  lines.push('');

  // Day 3 — 游览/治疗
  if (d4 <= d2) return lines.join('\n');
  const d3 = new Date(+d1 + 2 * 86400000);
  if (d3 >= d4) return lines.join('\n');
  lines.push(`**第3天（${fmt(d3)}）：${treatmentType === 'surgery' ? '手术治疗' : '游览休养'}**`);
  if (treatmentType === 'surgery') {
    lines.push(`- 🏥 09:00-15:00 进行手术`);
    lines.push(`- 🛌 术后住院观察`);
  } else {
    lines.push(`- 🎡 09:00-12:00 游览当地景点`);
    lines.push(`- 🍽️ 12:00-14:00 午餐：清淡营养餐`);
    lines.push(`- 🎡 14:00-17:00 继续游览或休息`);
  }
  lines.push('');

  // Day 4 — 返程日
  lines.push(`**第4天（${fmt(d4)}）：返程**`);
  lines.push(`- 🏨 08:00-11:00 退房，行李寄存`);
  lines.push(`- 🛍️ 11:00-13:00 购买纪念品（可选）`);
  lines.push(`- ✈️ 14:00-18:00 乘机返回`);
  lines.push(`- 📋 携带好所有医疗记录和药品`);

  return lines.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      originCity,
      destinationCity,
      travelDate,
      returnDate,
      treatmentType = 'consultation',
      numberOfPeople = '1',
      budget = '3000',
    } = body;

    if (!originCity || !destinationCity || !travelDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const isSameCity = originCity === destinationCity;
    const numPeople = parseInt(numberOfPeople) || 1;
    const needMultiLeg = isIntlOrigin(originCity) && !isSameCity;

    // ---- Bug 1: 联程或直飞航班定价 ----
    const USD_TO_CNY = 7.2;
    const toCNY = (usd: number) => Math.round(usd * USD_TO_CNY);

    // 缓存各舱位价格
    let econPrice = 0, busiPrice = 0, firstPrice = 0;
    let flightRoute: PlanOption['flightRoute'];

    if (isSameCity) {
      econPrice = busiPrice = firstPrice = 0;
      flightRoute = {
        isMultiLeg: false,
        segments: [{ from: originCity, to: destinationCity }],
        description: '同城交通',
      };
    } else if (needMultiLeg) {
      const [econ, busi, first] = await Promise.all([
        multiLegFlightCost(originCity, destinationCity, 'economy', numPeople),
        multiLegFlightCost(originCity, destinationCity, 'business', numPeople),
        multiLegFlightCost(originCity, destinationCity, 'first', numPeople),
      ]);
      econPrice = toCNY(econ.typicalPrice);
      busiPrice = toCNY(busi.typicalPrice);
      firstPrice = toCNY(first.typicalPrice);
      flightRoute = { isMultiLeg: true, segments: econ.segments, description: econ.description };
    } else {
      const [econ, busi, first] = await Promise.all([
        calculateFlightCostUSD(originCity, destinationCity, 'economy', numPeople),
        calculateFlightCostUSD(originCity, destinationCity, 'business', numPeople),
        calculateFlightCostUSD(originCity, destinationCity, 'first', numPeople),
      ]);
      econPrice = toCNY(econ.typicalPrice);
      busiPrice = toCNY(busi.typicalPrice);
      firstPrice = toCNY(first.typicalPrice);
      flightRoute = {
        isMultiLeg: false,
        segments: [{ from: originCity, to: destinationCity }],
        description: `${originCity} → ${destinationCity} 直飞`,
      };
    }

    // ---- 生成3个方案 ----
    const days = 7;
    const plans: PlanOption[] = [];

    const planConfigs = [
      { id: 'budget', stars: 3, cabin: 'economy', cabinLabel: '经济舱',
        hotelPrice: 700, hMult: 1, carCost: 50, reserv: 50, med: 200,
        medPlan: 'Basic medical consultation', consultDir: 'general' },
      { id: 'standard', stars: 4, cabin: 'business', cabinLabel: '商务舱',
        hotelPrice: 1050, hMult: 1.1, carCost: 80, reserv: 100, med: 700,
        medPlan: 'Standard medical services', consultDir: treatmentType },
      { id: 'premium', stars: 5, cabin: 'first', cabinLabel: '头等舱',
        hotelPrice: 1500, hMult: 1.2, carCost: 100, reserv: 200, med: 1600,
        medPlan: 'Comprehensive medical services', consultDir: treatmentType },
    ];

    const cabinKey = (c: string) => c === 'economy' ? 'econ' as const : c === 'business' ? 'busi' as const : 'first' as const;
    const prices: Record<string, number> = { econ: econPrice, busi: busiPrice, first: firstPrice };

    for (const cfg of planConfigs) {
      const flightFee = prices[cabinKey(cfg.cabin)];
      const hotelFee = Math.round(cfg.hotelPrice * cfg.hMult) * days * numPeople;
      const carFee = cfg.carCost * numPeople;
      const medicineCost = Math.round(50 * (cfg.id === 'budget' ? 1 : cfg.id === 'standard' ? 1.5 : 2.5));

      const plan: PlanOption = {
        id: cfg.id,
        name: cfg.id[0].toUpperCase() + cfg.id.slice(1) + ' Plan',
        description: cfg.id === 'budget' ? 'Economical option for budget travelers'
          : cfg.id === 'standard' ? 'Balanced option with good value'
          : 'Luxury option for premium experience',
        hotelFee,
        flightFee,
        carFee,
        ticketFee: 0,
        reservationFee: cfg.reserv,
        medicalSurgeryFee: 0,
        medicineFee: medicineCost,
        nursingFee: 0,
        nutritionFee: 0,
        medicalFee: cfg.med,
        totalAmount: 0,
        highlights: cfg.id === 'budget'
          ? ['Budget hotel', 'Economy flight', 'Basic medical']
          : cfg.id === 'standard'
            ? ['Standard hotel', 'Business flight', 'Standard medical']
            : ['Luxury hotel', 'First class flight', 'Premium medical'],
        duration: '7 days',
        hotelName: cfg.id === 'budget' ? 'Budget Hotel' : cfg.id === 'standard' ? 'Standard Hotel' : 'Luxury Hotel',
        hotelStars: cfg.stars,
        flightClass: isSameCity ? 'local-transport' : cfg.cabin,
        consultationDirection: cfg.consultDir,
        medicalPlan: cfg.medPlan,
        // Bug 1: 航班路线信息
        flightRoute,
        // Bug 2: 按天分时行程
        itinerary: buildItinerary(
          destinationCity, travelDate, returnDate,
          cfg.cabinLabel, cfg.id === 'budget' ? 'Budget Hotel' : cfg.id === 'standard' ? 'Standard Hotel' : 'Luxury Hotel',
          undefined, undefined, treatmentType,
        ),
      };

      plan.totalAmount = plan.hotelFee + plan.flightFee + plan.carFee + plan.ticketFee + plan.reservationFee + plan.medicalFee;

      const budgetNum = parseInt(budget) || 3000;
      if (budgetNum > 0 && plan.totalAmount > budgetNum) {
        plan.highlights.push('Over budget by $' + (plan.totalAmount - budgetNum));
      }

      plans.push(plan);
    }

    const requestData = {
      originCity,
      destinationCity,
      travelDate,
      returnDate: returnDate || '',
      treatmentType,
      numberOfPeople,
      budget,
      selectedHospital: body.selectedHospital || '',
      selectedDoctor: body.selectedDoctor || '',
      consultationDirection: body.consultationDirection || '',
      examinationItems: body.examinationItems || '',
      surgeryTypes: body.surgeryTypes || '',
      treatmentDirection: body.treatmentDirection || '',
      rehabilitationDirection: body.rehabilitationDirection || '',
    };

    return NextResponse.json({
      success: true,
      plans,
      requestData,
    });

  } catch (error) {
    console.error('Error creating plans:', error);
    return NextResponse.json(
      { error: 'Failed to generate plans' },
      { status: 500 }
    );
  }
}
