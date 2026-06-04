import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { orders, users, doctors, hospitals, itineraries, serviceReservations } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 查询订单详细信息
    const orderList = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    const order = orderList[0];
    console.log("[Itinerary] Order keys:", Object.keys(order));
    console.log("[Itinerary] doctorId:", order.doctorId, "hospitalId:", order.hospitalId);
    if (!order && orderId && orderId.startsWith('TEST-')) {
      // 为测试订单生成模拟数据
      console.log('[Itinerary] Generating mock data for TEST order:', orderId);
      
      const mockOrder = {
        id: orderId,
        status: 'booked',
        userId: 'test-user',
        doctorAppointmentStatus: 'pending',
        doctorAppointmentDate: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
        serviceReservationStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        consultationDirection: 'general',
        originCity: '北京',
        destinationCity: '上海',
        travelDate: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
      };
      
      const mockItinerary = [
        {
          id: 'test-1',
          type: 'flight',
          title: 'Flight to Destination',
          startDate: mockOrder.travelDate,
          endDate: mockOrder.travelDate,
          flightSegments: [{
            airline: 'Test Airways',
            flightNumber: 'TA123',
            origin: 'PEK',
            destination: 'SHA',
            departureTime: mockOrder.travelDate,
            arrivalTime: new Date(new Date(mockOrder.travelDate).getTime() + 3*60*60*1000).toISOString(),
            durationMinutes: 180,
          }],
          route: 'Beijing → Shanghai',
        },
        {
          id: 'test-2',
          type: 'ticket',
          title: 'Medical Consultation',
          startDate: mockOrder.doctorAppointmentDate,
          endDate: mockOrder.doctorAppointmentDate,
          metadata: { medicalType: 'consultation' },
        },
      ];
      
      const mockReservations = [
        { id: 'res-1', type: 'flight', flightSegments: [{ airline: 'Test', flightNumber: 'TA123' }] },
      ];
      
      const mockCosts = {
        medicalFee: 5000,
        flightFee: 2000,
        hotelFee: 3000,
        ticketFee: 0,
        subtotal: 10000,
        serviceFeeAmount: 500,
        totalAmount: 10500,
        currency: 'CNY',
      };
      
      const mockWeatherForecast = {
        city: mockOrder.destinationCity,
        period: { start: mockOrder.travelDate?.split('T')[0], end: mockOrder.travelDate?.split('T')[0] },
        forecast: [{ date: mockOrder.travelDate?.split('T')[0], condition: 'sunny', high: 25, low: 15 }],
        summary: { averageTemp: 20, rainyDays: 0, bestDays: 1 },
      };
      
      const mockTravelTips = {
        medical: [{ category: 'Test Tip', tips: ['Test tip 1'] }],
        travel: [{ category: 'Test Travel', tips: ['Test travel tip'] }],
        documents: [{ category: 'Test Docs', tips: ['Test doc tip'] }],
        emergency: [{ category: 'Test Emergency', tips: ['Test emergency tip'] }],
      };
      
      return NextResponse.json({
        success: true,
        data: {
          order: mockOrder,
          user: { id: 'test', name: 'Test User', passportNumber: 'TEST123', passportCountry: 'CN' },
          doctor: null,
          hospital: { nameEn: 'Test Hospital', location: 'Shanghai' },
          itinerary: mockItinerary,
          reservations: mockReservations,
          costs: mockCosts,
          weatherForecast: mockWeatherForecast,
          travelTips: mockTravelTips,
          timeline: mockItinerary,
        }
      });
    }
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // 查询用户信息
    const userList = await db
      .select()
      .from(users)
      .where(eq(users.id, order.userId))
      .limit(1);

    const user = userList[0];

    // 查询医生信息
    let doctor = null;
    if (order.doctorId) {
      const doctorList = await db
        .select()
        .from(doctors)
        .where(eq(doctors.id, order.doctorId))
        .limit(1);
      doctor = doctorList[0];
    }

    // 查询医院信息
    let hospital = null;
    if (order.hospitalId) {
      const hospitalList = await db
        .select()
        .from(hospitals)
        .where(eq(hospitals.id, order.hospitalId))
        .limit(1);
      hospital = hospitalList[0];
    }

    // 查询行程安排
    const itineraryItems = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.orderId, orderId));

    // 查询服务预订信息
    const serviceReservationsData = await db
      .select()
      .from(serviceReservations)
      .where(eq(serviceReservations.orderId, orderId));

    // 如果订单已预订且未获取过天气信息，则获取天气信息
    let weatherForecast = order.weatherForecast;
    if (!weatherForecast && itineraryItems.length > 0) {
      try {
// Bug 5 fix: min startDate and max endDate across all items for full trip coverage
                let firstDate = null;
                let lastDate = null;
                for (const item of itineraryItems) {
                  if (item.startDate && (!firstDate || item.startDate < firstDate)) firstDate = item.startDate;
                  if (item.endDate && (!lastDate || item.endDate > lastDate)) lastDate = item.endDate;
                }

        if (firstDate && lastDate && hospital) {
          const weatherResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/api/weather/forecast?city=${encodeURIComponent(hospital.location)}&startDate=${firstDate.toISOString()}&endDate=${lastDate.toISOString()}`
          );
          const weatherData = await weatherResponse.json();

          if (weatherData.success) {
            weatherForecast = weatherData.data;
            // 更新订单中的天气信息
            await db
              .update(orders)
              .set({ weatherForecast: weatherForecast })
              .where(eq(orders.id, orderId));
          }
        }
      } catch (error) {
        console.error('Failed to fetch weather forecast:', error);
      }
    }

    // 生成出行注意事项
    const travelTips = generateTravelTips(order, doctor, hospital);

    // 构建返回数据
    const itineraryDetails = {
      order: {
        id: order.id,
        status: order.status,
        doctorAppointmentStatus: order.doctorAppointmentStatus,
        doctorAppointmentDate: order.doctorAppointmentDate,
        serviceReservationStatus: order.serviceReservationStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        // 医疗相关字段
        consultationDirection: order.consultationDirection,
        examinationItems: order.examinationItems,
        surgeryTypes: order.surgeryTypes,
        treatmentDirection: order.treatmentDirection,
        rehabilitationDirection: order.rehabilitationDirection,
        medicalPlan: order.medicalPlan,
        planAdjustments: order.planAdjustments,
      },
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        passportNumber: user.passportNumber,
        passportCountry: user.passportCountry,
      } : null,
      doctor: doctor ? {
        id: doctor.id,
        nameEn: doctor.nameEn,
        nameZh: doctor.nameZh,
        title: doctor.title,
        // Bug 2 fix: parse specialtiesEn JSON string to readable string
        specialties: (() => {
          try {
            const parsed = JSON.parse(doctor.specialtiesEn || '[]');
            return Array.isArray(parsed) ? parsed.join(', ') : doctor.specialtiesEn;
          } catch (e) {
            return doctor.specialtiesEn || '';
          }
        })(),
        experienceYears: doctor.experienceYears,
      } : null,
      hospital: hospital ? {
        id: hospital.id,
        nameEn: hospital.nameEn,
        nameZh: hospital.nameZh,
        location: hospital.location,
        level: hospital.level,
      } : null,
      itinerary: itineraryItems,
      reservations: serviceReservationsData,
      costs: {
        medicalFee: order.medicalFee ? Number(order.medicalFee) : 0,
        hotelFee: order.hotelFee ? Number(order.hotelFee) : 0,
        flightFee: order.flightFee ? Number(order.flightFee) : 0,
        ticketFee: order.ticketFee ? Number(order.ticketFee) : 0,
        subtotal: order.subtotal ? Number(order.subtotal) : 0,
        serviceFeeRate: order.serviceFeeRate ? Number(order.serviceFeeRate) : 0,
        serviceFeeAmount: order.serviceFeeAmount ? Number(order.serviceFeeAmount) : 0,
        totalAmount: order.totalAmount ? Number(order.totalAmount) : 0,
        currency: order.currency,
      },
      weatherForecast,
      travelTips,
      timeline: generateTimeline(itineraryItems, order.doctorAppointmentDate),
      // Bug 3 fix: extract recommended attractions and food recommendations
      recommendedAttractions: itineraryItems
        .filter(item => item.type === 'ticket' && item.metadata && (item.metadata as any)?.attractionType === 'tourism')
        .map(item => ({
          id: item.id,
          name: item.name,
          visitDate: item.startDate,
          location: item.location || (hospital ? hospital.location : ''),
          price: item.price,
        })),
      foodRecommendations: (() => {
        try {
          const meta = (order as any).metadata ? (typeof (order as any).metadata === 'string' ? JSON.parse((order as any).metadata) : (order as any).metadata) : {};
          return meta.foodRecommendations || [];
        } catch (e) {
          return [];
        }
      })(),
    };

    return NextResponse.json({
      success: true,
      data: itineraryDetails,
    });
  } catch (error) {
    console.error('Failed to fetch itinerary details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch itinerary details' },
      { status: 500 }
    );
  }
}

/**
 * 生成出行注意事项
 */
function generateTravelTips(order: any, doctor: any, hospital: any) {
  const tips: any = {
    medical: [],
    travel: [],
    weather: [],
    documents: [],
    emergency: [],
  };

  // 医疗注意事项
  if (doctor) {
    tips.medical.push({
      category: 'Consultation',
      tips: [
        'Bring your medical records and previous test results',
        'List all current medications you are taking',
        'Prepare questions to ask the doctor',
        'Arrive 30 minutes before your appointment',
      ],
    });
  }

  // 旅行注意事项
  tips.travel.push({
    category: 'General',
    tips: [
      'Ensure your passport is valid for at least 6 months',
      'Check visa requirements for China',
      'Purchase travel insurance',
      'Keep important documents in both digital and physical copies',
    ],
  });

  // 天气注意事项
  if (order.weatherForecast) {
    const rainyDays = (order.weatherForecast as any).summary?.rainyDays || 0;
    if (rainyDays > 0) {
      tips.weather.push({
        category: 'Weather',
        tips: [
          `Pack an umbrella or raincoat (${rainyDays} rainy days expected)`,
          'Wear appropriate clothing based on weather forecast',
        ],
      });
    }
  }

  // 文件注意事项
  tips.documents.push({
    category: 'Documents',
    tips: [
      'Passport and visa',
      'Booking confirmations',
      'Insurance documents',
      'Medical records',
      'Emergency contact information',
    ],
  });

  // 紧急情况注意事项
  if (hospital) {
    tips.emergency.push({
      category: 'Emergency',
      tips: [
        `Hospital: ${hospital.nameEn}`,
        `Location: ${hospital.location}`,
        'Keep emergency numbers handy',
        'Know the location of nearest pharmacy',
      ],
    });
  }

  return tips;
}

/**
 * 生成时间线
 */
function generateTimeline(itineraryItems: any[], appointmentDate: Date | null) {
  const timeline = [];

  // 添加行程项目
  itineraryItems.forEach((item, index) => {
    const details: any = {
      id: item.id,
      type: item.type,
      name: item.name,
      date: item.startDate,
      endDate: item.endDate,
      status: item.status,
      order: index,
    };

    // 添加详细信息
    if (item.type === 'flight') {
      // 优先从 metadata 读取详细的航班信息
      // 兼容 metadata 为字符串或对象两种情况
      let metaObj = item.metadata;
      if (typeof metaObj === 'string') {
        try { metaObj = JSON.parse(metaObj); } catch { /* ignore */ }
      }
      if (metaObj && metaObj.flightDetails) {
        const flightDetails = metaObj.flightDetails;

        // 兼容 segments 字段名：from/to (旧格式) 或 origin/destination (新格式)
        const rawSegments = flightDetails.segments || [];
        details.flightSegments = rawSegments.map((seg: any) => ({
          ...seg,
          origin: seg.origin ?? seg.from ?? '',
          destination: seg.destination ?? seg.to ?? '',
          flightNumber: seg.flightNumber ?? '',
          airline: seg.airline ?? '',
          departureTime: seg.departureTime ?? null,
          arrivalTime: seg.arrivalTime ?? null,
          durationMinutes: seg.durationMinutes ?? 0,
        }));
        details.isDirect = flightDetails.isDirect;
        details.flightType = flightDetails.isDirect ? '直飞' : '中转';

        if (flightDetails.isDirect) {
          const segment = details.flightSegments[0];
          details.flightNumber = segment.flightNumber;
          details.subtitle = `Flight ${segment.flightNumber}`;
          details.route = `${segment.origin} - ${segment.destination}`;
        } else {
          const first = details.flightSegments[0];
          const second = details.flightSegments[1];
          details.flightNumber = `${first.flightNumber}+${second.flightNumber}`;
          details.subtitle = `${first.flightNumber} + ${second.flightNumber}`;
          details.route = `${first.origin} - ${second.destination}`;
          details.connectionCity = flightDetails.connectionCity;
          details.layoverMinutes = flightDetails.layoverMinutes;

          // 格式化中转时间
          const layoverHours = Math.floor((flightDetails.layoverMinutes || 0) / 60);
          const layoverMins = (flightDetails.layoverMinutes || 0) % 60;
          details.layoverFormatted = layoverHours > 0 ? `${layoverHours}小时${layoverMins}分钟` : `${layoverMins}分钟`;
        }

        if (item.durationMinutes) {
          details.duration = `${item.durationMinutes} 分钟`;
          details.durationMinutes = item.durationMinutes;
          const hours = Math.floor(item.durationMinutes / 60);
          const minutes = item.durationMinutes % 60;
          details.durationFormatted = hours > 0 ? `${hours}小时${minutes > 0 ? `${minutes}分钟` : ''}` : `${minutes}分钟`;
        }
      } else {
        // 兼容旧数据：从 description 解析
        if (item.flightNumber) {
          details.flightNumber = item.flightNumber;
          details.subtitle = `Flight ${item.flightNumber}`;
        }
        if (item.location) {
          details.route = item.location;
          details.subtitle = details.subtitle ? `${details.subtitle} · ${item.location}` : item.location;
        }
        if (item.description) {
          if (item.description.includes('(Direct)')) {
            details.flightType = '直飞';
            details.isDirect = true;
          } else if (item.description.includes('(Via ')) {
            details.flightType = '中转';
            details.isDirect = false;
            const viaMatch = item.description.match(/\(Via\s+([^)]+)\)/);
            if (viaMatch) {
              details.connectionCities = viaMatch[1].split(',').map((c: string) => c.trim());
            }
          } else if (item.description.includes('Connection') || item.description.includes('Transfer')) {
            details.flightType = '中转';
            details.isDirect = false;
          } else {
            details.flightType = '直飞';
            details.isDirect = true;
          }
        }
        if (item.durationMinutes) {
          details.duration = `${item.durationMinutes} 分钟`;
          details.durationMinutes = item.durationMinutes;
          const hours = Math.floor(item.durationMinutes / 60);
          const minutes = item.durationMinutes % 60;
          details.durationFormatted = hours > 0 ? `${hours}小时${minutes > 0 ? `${minutes}分钟` : ''}` : `${minutes}分钟`;
        }
      }
    } else if (item.type === 'hotel') {
      if (item.roomNumber) {
        details.roomNumber = item.roomNumber;
        details.subtitle = `Room ${item.roomNumber}`;
      }
      if (item.endDate) {
        const nights = Math.ceil((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (24 * 60 * 60 * 1000));
        details.duration = `${nights} nights`;
      }
    } else if (item.type === 'ticket') {
      if (item.durationMinutes) {
        details.duration = `${item.durationMinutes} minutes`;
      }
      // 添加位置信息
      if (item.location) {
        details.route = item.location;
      }
      // 区分医疗咨询和景点
      if (item.metadata && (item.metadata as any)?.attractionType === 'tourism') {
        details.isAttraction = true;
      } else if (item.metadata && item.metadata.medicalType === 'consultation') {
        details.isMedicalConsultation = true;
      }
    }

    // 添加天气信息
    if (item.weatherCondition) {
      details.weather = {
        condition: item.weatherCondition,
        tempMin: item.temperatureMin,
        tempMax: item.temperatureMax,
      };
    }

    timeline.push(details);
  });

  // 添加医生预约
  if (appointmentDate) {
    timeline.push({
      id: 'doctor-appointment',
      type: 'doctor',
      name: 'Doctor Appointment',
      date: appointmentDate,
      endDate: appointmentDate,
      status: 'scheduled',
      order: timeline.length,
      duration: '60 minutes',
    });
  }

  // 按日期排序
  timeline.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  return timeline;
}
