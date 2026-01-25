import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { orders, itineraries, users, serviceFees, doctors, hospitals } from '@/storage/database/shared/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { searchFlightRoute, generateRealisticFlightNumber, calculateFlightCostUSD } from '@/lib/services/flightSearchService';
import { generateFlightDetails } from '@/lib/services/flightDetailsGenerator';

interface PaymentRequest {
  userId: string;
  plan: {
    id: string;
    name: string;
    totalAmount: number;
    medicalFee: number;
    hotelFee: number;
    flightFee: number;
    doctorId?: string;
    hospitalId?: string;
    bookingData?: any;
  };
  payment: {
    cardNumber: string;
    cardName: string;
    expiryDate: string;
    cvv: string;
  };
  documents: {
    passportNumber: string;
    passportCountry: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json();
    const {
      userId,
      plan,
      payment,
      documents: { passportNumber, passportCountry },
    } = body;

    // 添加详细调试日志
    console.log('[Payment API] Full request body received');
    console.log('[Payment API] plan object keys:', Object.keys(plan));
    console.log('[Payment API] plan.bookingData:', JSON.stringify(plan.bookingData, null, 2));
    
    // 验证必需字段
    if (!userId || !plan || !payment || !passportNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 检查是否有重复订单（防止重复提交）
    // 检查最近5分钟内，同一用户是否有相同金额的订单
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentOrders = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.userId, userId),
        eq(orders.totalAmount, (plan.medicalFee + plan.hotelFee + plan.flightFee).toString())
      ))
      .orderBy(orders.createdAt);

    // 找到最近5分钟内的订单
    const duplicateOrder = recentOrders.find(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate > fiveMinutesAgo;
    });

    if (duplicateOrder) {
      // 返回已存在的订单，避免重复创建
      return NextResponse.json({
        success: true,
        orderId: duplicateOrder.id,
        message: 'Payment successful. Your booking is being processed.',
        redirectUrl: `/book/confirmation/${duplicateOrder.id}`,
      });
    }

    // 模拟支付处理（实际项目中应该集成真实的支付网关）
    // 这里我们假设支付总是成功的
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 获取中介费率
    const medicalFeeConfigList = await db
      .select()
      .from(serviceFees)
      .where(eq(serviceFees.type, 'medical'))
      .limit(1);
    const flightFeeConfigList = await db
      .select()
      .from(serviceFees)
      .where(eq(serviceFees.type, 'flight'))
      .limit(1);
    const hotelFeeConfigList = await db
      .select()
      .from(serviceFees)
      .where(eq(serviceFees.type, 'hotel'))
      .limit(1);

    const medicalFeeConfig = medicalFeeConfigList[0];
    const flightFeeConfig = flightFeeConfigList[0];
    const hotelFeeConfig = hotelFeeConfigList[0];

    const medicalRate = Number(medicalFeeConfig?.rate || 0.05);
    const flightRate = Number(flightFeeConfig?.rate || 0.03);
    const hotelRate = Number(hotelFeeConfig?.rate || 0.04);

    const medicalMinFee = Number(medicalFeeConfig?.minFee || 50);
    const flightMinFee = Number(flightFeeConfig?.minFee || 30);
    const hotelMinFee = Number(hotelFeeConfig?.minFee || 40);

    // 获取用户的预订信息（从plan.bookingData）
    const bookingData = plan.bookingData || {};
    
    // 添加调试日志
    console.log('[Payment API] bookingData.travelDate:', bookingData.travelDate);
    console.log('[Payment API] bookingData.returnDate:', bookingData.returnDate);
    console.log('[Payment API] bookingData keys:', Object.keys(bookingData));
    
    const travelDate = new Date(bookingData.travelDate || Date.now() + 7 * 24 * 60 * 60 * 1000);
    const appointmentDate = new Date(bookingData.appointmentDate || Date.now() + 10 * 24 * 60 * 60 * 1000);
    const returnDate = new Date(bookingData.returnDate || Date.now() + 14 * 24 * 60 * 60 * 1000);

    // 添加调试日志
    console.log('[Payment API] Calculated travelDate:', travelDate.toISOString());
    console.log('[Payment API] Calculated returnDate:', returnDate.toISOString());
    
    // 确保起降城市存在（如果缺失，使用默认值）
    const originCity = bookingData.originCity || 'Origin';
    const destinationCity = bookingData.destinationCity || 'Destination';

    // 根据治疗类型严格调整医疗费用
    const treatmentType = bookingData.treatmentType || 'consultation';
    let adjustedMedicalFee = plan.medicalFee;
    let adjustedMedicalSurgeryFee = 0;
    let adjustedMedicineFee = 0;
    let adjustedNursingFee = 0;
    let adjustedNutritionFee = 0;

    // 优先使用bookingData中的细分费用（如果AI已生成）
    if (bookingData.medicalSurgeryFee !== undefined) {
      adjustedMedicalSurgeryFee = Number(bookingData.medicalSurgeryFee);
    }
    if (bookingData.medicineFee !== undefined) {
      adjustedMedicineFee = Number(bookingData.medicineFee);
    }
    if (bookingData.nursingFee !== undefined) {
      adjustedNursingFee = Number(bookingData.nursingFee);
    }
    if (bookingData.nutritionFee !== undefined) {
      adjustedNutritionFee = Number(bookingData.nutritionFee);
    }

    // 根据治疗类型严格限制费用
    if (treatmentType === 'examination') {
      // 检查类型：只保留合理的药费，其他费用为0
      adjustedMedicalSurgeryFee = 0;
      adjustedNursingFee = 0;
      adjustedNutritionFee = 0;
      adjustedMedicineFee = Math.min(adjustedMedicineFee, 300);
      adjustedMedicalFee = adjustedMedicineFee; // 只包含药费
    } else if (treatmentType === 'consultation') {
      // 咨询类型：只保留少量药费
      adjustedMedicalSurgeryFee = 0;
      adjustedNursingFee = 0;
      adjustedNutritionFee = 0;
      adjustedMedicineFee = Math.min(adjustedMedicineFee, 200);
      adjustedMedicalFee = adjustedMedicineFee;
    } else if (treatmentType === 'surgery') {
      // 手术类型：保留所有费用
      adjustedMedicalFee = adjustedMedicalSurgeryFee + adjustedMedicineFee + adjustedNursingFee + adjustedNutritionFee;
    } else if (treatmentType === 'therapy' || treatmentType === 'rehabilitation') {
      // 治疗/康复类型：不包含手术费
      adjustedMedicalSurgeryFee = 0;
      adjustedMedicalFee = adjustedMedicineFee + adjustedNursingFee + adjustedNutritionFee;
    }

    // 计算门票总费用（如果用户选择了景点）
    let ticketFee = 0;
    if (bookingData.selectedAttractions && Array.isArray(bookingData.selectedAttractions) && bookingData.selectedAttractions.length > 0) {
      ticketFee = bookingData.selectedAttractions.reduce((sum: number, attr: any) => sum + (attr.price || 0), 0);
    }

    // 计算各项服务费用
    const medicalServiceFee = Math.max(adjustedMedicalFee * medicalRate, medicalMinFee);
    const flightServiceFee = Math.max(plan.flightFee * flightRate, flightMinFee);
    const hotelServiceFee = Math.max(plan.hotelFee * hotelRate, hotelMinFee);

    const subtotal = adjustedMedicalFee + plan.hotelFee + plan.flightFee + ticketFee;
    const totalServiceFee = medicalServiceFee + flightServiceFee + hotelServiceFee;
    const totalAmount = subtotal + totalServiceFee;

    // 创建订单
    const [order] = await db.insert(orders).values({
      id: uuidv4(),
      userId,
      doctorId: plan.bookingData?.doctorId || null,
      hospitalId: plan.bookingData?.selectedHospital || null,
      status: 'confirmed',
      doctorAppointmentStatus: plan.bookingData?.doctorId ? 'pending' : 'confirmed',
      // 注意：医生预约日期将在航班创建后重新计算，确保在到达之后
      doctorAppointmentDate: null,
      serviceReservationStatus: 'pending',
      medicalFee: adjustedMedicalFee.toString(),
      hotelFee: plan.hotelFee.toString(),
      flightFee: plan.flightFee.toString(),
      ticketFee: ticketFee.toString(), // 根据用户选择的景点计算门票费用
      subtotal: subtotal.toString(),
      serviceFeeRate: medicalRate.toString(),
      serviceFeeAmount: totalServiceFee.toString(),
      totalAmount: totalAmount.toString(),
      currency: 'USD',
      // 医疗服务相关字段
      consultationDirection: bookingData.consultationDirection || null,
      examinationItems: bookingData.examinationItems ? JSON.stringify([bookingData.examinationItems]) : null,
      surgeryTypes: bookingData.surgeryTypes ? JSON.stringify([bookingData.surgeryTypes]) : null,
      treatmentDirection: bookingData.treatmentDirection || null,
      rehabilitationDirection: bookingData.rehabilitationDirection || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // 创建行程记录
    // 判断是否同城旅行（同城无需机票）
    const isSameCity = originCity === destinationCity;

    // 记录到达时间（用于安排后续医疗和景点活动）
    let arrivalDate = travelDate; // 默认使用出发时间（同城情况）

    if (!isSameCity) {
      // 获取真实的航班数据
      try {
        // 获取去程航班信息
        const outboundRoute = await searchFlightRoute(originCity, destinationCity);

        // 生成详细的航班信息（包含中转信息）
        const outboundFlightDetails = generateFlightDetails(
          originCity,
          destinationCity,
          travelDate,
          outboundRoute.hasDirectFlight,
          outboundRoute.connectionCities?.[0],
          outboundRoute.typicalPriceUSD
        );

        // 生成航班描述，包含中转信息
        let outboundDescription;
        if (outboundFlightDetails.isDirect) {
          const segment = outboundFlightDetails.segments[0];
          outboundDescription = `Direct flight ${segment.flightNumber}`;
        } else {
          const first = outboundFlightDetails.segments[0];
          const second = outboundFlightDetails.segments[1];
          outboundDescription = `${first.flightNumber} + ${second.flightNumber} (Via ${outboundFlightDetails.connectionCity})`;
        }

        // 记录到达时间（去程航段的最后一个到达时间）
        arrivalDate = outboundFlightDetails.segments[outboundFlightDetails.segments.length - 1].arrivalTime;

        await db.insert(itineraries).values({
          id: uuidv4(),
          orderId: order.id,
          type: 'flight',
          name: outboundFlightDetails.isDirect
            ? `Flight ${outboundFlightDetails.segments[0].flightNumber}`
            : `Connecting Flight ${outboundFlightDetails.segments[0].flightNumber} + ${outboundFlightDetails.segments[1].flightNumber}`,
          description: outboundDescription,
          startDate: outboundFlightDetails.segments[0].departureTime,
          endDate: arrivalDate,
          location: `${originCity} - ${destinationCity}`,
          price: (plan.flightFee / 2).toString(), // 往返机票费用平分
          flightNumber: outboundFlightDetails.segments[0].flightNumber, // 使用第一段航班号
          durationMinutes: outboundFlightDetails.totalDurationMinutes,
          metadata: {
            flightDetails: outboundFlightDetails,
            isDirect: outboundFlightDetails.isDirect,
            connectionCity: outboundFlightDetails.connectionCity,
            layoverMinutes: outboundFlightDetails.layoverMinutes,
          },
          status: 'pending',
          notificationSent: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // 创建回程航班
        const returnRoute = await searchFlightRoute(destinationCity, originCity);

        // 生成详细的回程航班信息
        const returnFlightDetails = generateFlightDetails(
          destinationCity,
          originCity,
          returnDate,
          returnRoute.hasDirectFlight,
          returnRoute.connectionCities?.[0],
          returnRoute.typicalPriceUSD
        );

        // 生成回程航班描述
        let returnDescription;
        if (returnFlightDetails.isDirect) {
          const segment = returnFlightDetails.segments[0];
          returnDescription = `Direct flight ${segment.flightNumber}`;
        } else {
          const first = returnFlightDetails.segments[0];
          const second = returnFlightDetails.segments[1];
          returnDescription = `${first.flightNumber} + ${second.flightNumber} (Via ${returnFlightDetails.connectionCity})`;
        }

        await db.insert(itineraries).values({
          id: uuidv4(),
          orderId: order.id,
          type: 'flight',
          name: returnFlightDetails.isDirect
            ? `Flight ${returnFlightDetails.segments[0].flightNumber}`
            : `Connecting Flight ${returnFlightDetails.segments[0].flightNumber} + ${returnFlightDetails.segments[1].flightNumber}`,
          description: returnDescription,
          startDate: returnFlightDetails.segments[0].departureTime,
          endDate: returnFlightDetails.segments[returnFlightDetails.segments.length - 1].arrivalTime,
          location: `${destinationCity} - ${originCity}`,
          price: (plan.flightFee / 2).toString(), // 往返机票费用平分
          flightNumber: returnFlightDetails.segments[0].flightNumber,
          durationMinutes: returnFlightDetails.totalDurationMinutes,
          metadata: {
            flightDetails: returnFlightDetails,
            isDirect: returnFlightDetails.isDirect,
            connectionCity: returnFlightDetails.connectionCity,
            layoverMinutes: returnFlightDetails.layoverMinutes,
          },
          status: 'pending',
          notificationSent: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (error) {
        console.error('Error creating flight itineraries:', error);
        // 如果航班搜索失败，使用备用方案（但不推荐）
        const outboundFlightNumber = generateRealisticFlightNumber(originCity, destinationCity, 'economy');
        const outboundDurationMinutes = 120; // 默认2小时
        const outboundEndTime = new Date(travelDate.getTime() + outboundDurationMinutes * 60 * 1000);

        // 记录到达时间
        arrivalDate = outboundEndTime;

        await db.insert(itineraries).values({
          id: uuidv4(),
          orderId: order.id,
          type: 'flight',
          name: `Flight ${outboundFlightNumber}`,
          description: `Flight from ${originCity} to ${destinationCity}`,
          startDate: travelDate,
          endDate: arrivalDate,
          location: `${originCity} - ${destinationCity}`,
          price: (plan.flightFee / 2).toString(),
          flightNumber: outboundFlightNumber,
          durationMinutes: outboundDurationMinutes,
          status: 'pending',
          notificationSent: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const returnFlightNumber = generateRealisticFlightNumber(destinationCity, originCity, 'economy');
        const returnEndTime = new Date(returnDate.getTime() + outboundDurationMinutes * 60 * 1000);

        await db.insert(itineraries).values({
          id: uuidv4(),
          orderId: order.id,
          type: 'flight',
          name: `Flight ${returnFlightNumber}`,
          description: `Flight from ${destinationCity} to ${originCity}`,
          startDate: returnDate,
          endDate: returnEndTime,
          location: `${destinationCity} - ${originCity}`,
          price: (plan.flightFee / 2).toString(),
          flightNumber: returnFlightNumber,
          durationMinutes: outboundDurationMinutes,
          status: 'pending',
          notificationSent: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // 确保酒店时间正确：从到达当天下午开始，到回程当天上午结束
    // 到达后预留4小时办理入住手续
    const hotelStartDate = new Date(arrivalDate.getTime() + 4 * 60 * 60 * 1000); // 到达后4小时开始住宿
    // 确保hotelStartDate不晚于returnDate
    const safeHotelStartDate = hotelStartDate < returnDate ? hotelStartDate : new Date(returnDate.getTime() - 24 * 60 * 60 * 1000);

    // 生成酒店房间号和详细信息
    const hotelName = bookingData.hotelName || 'Grand Hotel';
    const roomNumber = generateRoomNumber();
    const nights = Math.ceil((returnDate.getTime() - safeHotelStartDate.getTime()) / (24 * 60 * 60 * 1000));

    await db.insert(itineraries).values({
      id: uuidv4(),
      orderId: order.id,
      type: 'hotel',
      name: hotelName,
      description: `${nights} nights accommodation`,
      startDate: safeHotelStartDate,
      endDate: returnDate,
      location: destinationCity,
      price: plan.hotelFee.toString(),
      hotelName: hotelName,
      roomNumber: roomNumber,
      status: 'pending',
      notificationSent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 创建医疗咨询记录 - 安排在到达后的第2天（上午10点）
    // 给患者1天时间调整时差和休息
    const daysAfterArrival = 1;
    let medicalAppointmentDate = new Date(arrivalDate.getTime());
    medicalAppointmentDate.setDate(medicalAppointmentDate.getDate() + daysAfterArrival);
    medicalAppointmentDate.setHours(10, 0, 0, 0); // 上午10:00开始

    // 确保医疗咨询日期在到达和回程之间
    // 注意：必须确保医疗咨询在arrivalDate之后
    const minAppointmentDate = new Date(arrivalDate.getTime() + 20 * 60 * 60 * 1000); // 到达后至少20小时
    const maxAppointmentDate = new Date(returnDate.getTime() - 24 * 60 * 60 * 1000); // 回程前至少1天

    if (medicalAppointmentDate < minAppointmentDate) {
      medicalAppointmentDate = new Date(minAppointmentDate.getTime());
      medicalAppointmentDate.setHours(10, 0, 0, 0);
    }
    if (medicalAppointmentDate > maxAppointmentDate) {
      medicalAppointmentDate = new Date(maxAppointmentDate.getTime());
      medicalAppointmentDate.setHours(10, 0, 0, 0);
    }

    // 最终验证：确保医疗咨询时间合理且在有效范围内
    // 如果最小日期已经大于最大日期，说明到达和回程时间太近，无法安排医疗咨询
    if (minAppointmentDate >= maxAppointmentDate) {
      console.error('Cannot schedule medical appointment: arrival date and return date are too close', {
        arrivalDate: arrivalDate.toISOString(),
        returnDate: returnDate.toISOString(),
        minAppointmentDate: minAppointmentDate.toISOString(),
        maxAppointmentDate: maxAppointmentDate.toISOString(),
      });
      // 在这种情况下，仍然创建医疗咨询记录，但记录到到达后1天
      // 这不是理想情况，但至少能继续流程
      medicalAppointmentDate = new Date(arrivalDate.getTime() + 24 * 60 * 60 * 1000);
      medicalAppointmentDate.setHours(10, 0, 0, 0);
    }

    const medicalDurationMinutes = 60; // 咨询时间为60分钟
    const medicalEndDate = new Date(medicalAppointmentDate.getTime() + medicalDurationMinutes * 60 * 1000);

    await db.insert(itineraries).values({
      id: uuidv4(),
      orderId: order.id,
      type: 'ticket',
      name: getMedicalServiceName(bookingData.treatmentType),
      description: getMedicalServiceDescription(bookingData.treatmentType, bookingData.consultationDirection, bookingData.examinationItems, bookingData.surgeryTypes, bookingData.treatmentDirection, bookingData.rehabilitationDirection),
      startDate: medicalAppointmentDate,
      endDate: medicalEndDate,
      location: bookingData.destinationCity || destinationCity,
      price: adjustedMedicalFee.toString(),
      durationMinutes: medicalDurationMinutes,
      metadata: {
        medicalType: 'consultation',
      },
      status: 'pending',
      notificationSent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 创建旅游景点记录（如果用户选择了旅游服务）
    // 景点游览安排在医疗咨询后、回程前
    if (bookingData.selectedAttractions && Array.isArray(bookingData.selectedAttractions) && bookingData.selectedAttractions.length > 0) {
      // 智能安排景点日期：优先在医疗咨询后1天（下午2点开始）
      // 如果时间不够，则在到达后第2天（上午10点开始）
      let attractionDate = new Date(medicalAppointmentDate.getTime());
      attractionDate.setDate(attractionDate.getDate() + 1);
      attractionDate.setHours(14, 0, 0, 0);

      // 确保景点日期在回程之前（至少提前1天）
      const returnDateMinusOneDay = new Date(returnDate.getTime() - 24 * 60 * 60 * 1000);

      // 如果景点日期超过了回程前1天，则尝试在到达后第2天安排
      if (attractionDate >= returnDateMinusOneDay) {
        attractionDate = new Date(arrivalDate.getTime());
        attractionDate.setDate(attractionDate.getDate() + 2);
        attractionDate.setHours(10, 0, 0, 0);
      }

      // 最终验证：确保景点日期有效（必须在到达后至少1天，在回程前至少1天）
      const minAttractionDate = new Date(arrivalDate.getTime() + 24 * 60 * 60 * 1000); // 到达后至少1天
      const maxAttractionDate = new Date(returnDate.getTime() - 24 * 60 * 60 * 1000); // 回程前至少1天

      if (attractionDate >= minAttractionDate && attractionDate < maxAttractionDate) {
        for (const attraction of bookingData.selectedAttractions) {
          // 景点游览时间，默认2小时
          const attractionDurationMinutes = 120;
          const attractionEndDate = new Date(attractionDate.getTime() + attractionDurationMinutes * 60 * 1000);

          await db.insert(itineraries).values({
            id: uuidv4(),
            orderId: order.id,
            type: 'ticket',
            name: attraction.nameEn || attraction.nameZh,
            description: attraction.description,
            startDate: attractionDate,
            endDate: attractionEndDate,
            location: bookingData.destinationCity || destinationCity,
            price: attraction.price.toString(),
            durationMinutes: attractionDurationMinutes,
            metadata: {
              attractionType: 'tourism',
              attractionId: attraction.id,
            },
            status: 'pending',
            notificationSent: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        console.log(`Successfully created ${bookingData.selectedAttractions.length} attraction itineraries for order ${order.id}`);
      } else {
        console.warn('Cannot create attraction itineraries: no available time slot', {
          attractionDate,
          arrivalDate,
          returnDate,
          minAttractionDate,
          maxAttractionDate,
          attractionDateValid: attractionDate >= minAttractionDate,
          beforeReturn: attractionDate < maxAttractionDate
        });
      }
    } else {
      console.log('No attractions selected or invalid attraction data', {
        hasSelectedAttractions: !!bookingData.selectedAttractions,
        isArray: Array.isArray(bookingData.selectedAttractions),
        length: bookingData.selectedAttractions?.length || 0,
      });
    }

    // 更新用户的证件信息
    await db.update(users)
      .set({
        passportNumber,
        passportCountry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // 后台任务：预约医生（如果有医生ID）
    // 注意：医生预约日期必须在arrivalDate之后，使用medicalAppointmentDate
    if (plan.doctorId && medicalAppointmentDate) {
      bookDoctorAppointment(db, order.id, plan.doctorId, medicalAppointmentDate, bookingData.notes).catch(err => {
        console.error('Failed to book doctor appointment:', err);
      });
    }

    // 后台任务：预订行程服务
    bookItineraryServices(db, order.id, bookingData).catch(err => {
      console.error('Failed to book itinerary services:', err);
    });

    // TODO: 发送支付确认邮件
    // await sendPaymentConfirmationEmail(userId, order.id, totalAmount);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: 'Payment successful. Your booking is being processed.',
      redirectUrl: `/book/confirmation/${order.id}`,
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: 'Payment processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * 预约医生（后台任务）
 */
async function bookDoctorAppointment(
  db: any,
  orderId: string,
  doctorId: string,
  appointmentDate: Date,
  notes?: string
) {
  try {
    // 查询医生信息
    const doctor = await db.query.doctors.findFirst({
      where: eq(doctors.id, doctorId),
    });

    if (!doctor) {
      console.error('Doctor not found:', doctorId);
      return;
    }

    // 更新订单的医生预约状态
    await db
      .update(orders)
      .set({
        doctorId: doctorId,
        doctorAppointmentStatus: 'confirmed',
        doctorAppointmentDate: appointmentDate,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // TODO: 发送预约确认通知
    // await sendAppointmentNotification(orderId, doctor, appointmentDate);

    console.log('Doctor appointment booked successfully:', orderId);
  } catch (error) {
    console.error('Failed to book doctor appointment:', error);
    throw error;
  }
}

/**
 * 预订行程服务（后台任务）
 */
async function bookItineraryServices(db: any, orderId: string, bookingData: any) {
  try {
    // 查询订单的所有行程记录
    const itinerariesList = await db.query.itineraries.findMany({
      where: eq(itineraries.orderId, orderId),
    });

    // 预订航班（可能有两个航班：去程和回程）
    const flightItineraries = itinerariesList.filter((i: any) => i.type === 'flight');
    for (const flightItinerary of flightItineraries) {
      // 模拟航班预订
      const flightReference = `FL${Date.now().toString().slice(-8)}`;
      await db
        .update(itineraries)
        .set({
          status: 'confirmed',
          bookingConfirmation: flightReference,
          notificationSent: true,
          updatedAt: new Date(),
        })
        .where(eq(itineraries.id, flightItinerary.id));

      // TODO: 发送航班预订确认通知
      // await sendFlightBookingNotification(orderId, flightReference);
    }

    // 预订酒店
    const hotelItinerary = itinerariesList.find((i: any) => i.type === 'hotel');
    if (hotelItinerary) {
      // 模拟酒店预订
      const hotelReference = `HT${Date.now().toString().slice(-8)}`;
      await db
        .update(itineraries)
        .set({
          status: 'confirmed',
          bookingConfirmation: hotelReference,
          notificationSent: true,
          updatedAt: new Date(),
        })
        .where(eq(itineraries.id, hotelItinerary.id));

      // TODO: 发送酒店预订确认通知
      // await sendHotelBookingNotification(orderId, hotelReference);
    }

    // 预订医疗咨询
    const medicalItinerary = itinerariesList.find((i: any) => i.type === 'ticket');
    if (medicalItinerary) {
      await db
        .update(itineraries)
        .set({
          status: 'confirmed',
          notificationSent: true,
          updatedAt: new Date(),
        })
        .where(eq(itineraries.id, medicalItinerary.id));
    }

    // 更新订单的行程预订状态
    await db
      .update(orders)
      .set({
        serviceReservationStatus: 'confirmed',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    console.log('Itinerary services booked successfully:', orderId);
  } catch (error) {
    console.error('Failed to book itinerary services:', error);
    throw error;
  }
}

/**
 * 生成房间号
 */
function generateRoomNumber(): string {
  const floor = Math.floor(Math.random() * 20) + 1; // 1-20层
  const room = Math.floor(Math.random() * 30) + 1; // 1-30号房间
  return `${floor}${room.toString().padStart(2, '0')}`; // 例如：102, 1506
}

/**
 * 根据治疗类型获取医疗服务名称
 */
function getMedicalServiceName(treatmentType?: string): string {
  const serviceNames: Record<string, string> = {
    'checkup': 'Medical Checkup',
    'surgery': 'Medical Surgery',
    'therapy': 'Medical Therapy',
    'rehabilitation': 'Rehabilitation Program',
    'consultation': 'Medical Consultation',
  };
  return serviceNames[treatmentType || 'consultation'] || 'Medical Consultation';
}

/**
 * 根据治疗类型获取医疗服务描述
 */
function getMedicalServiceDescription(
  treatmentType?: string,
  consultationDirection?: string,
  examinationItems?: string,
  surgeryTypes?: string,
  treatmentDirection?: string,
  rehabilitationDirection?: string
): string {
  const descriptions: Record<string, string> = {
    'checkup': `Medical checkup${examinationItems ? ` including ${examinationItems}` : ''}`,
    'surgery': `Surgical procedure${surgeryTypes ? ` - ${surgeryTypes}` : ''}`,
    'therapy': `Medical therapy${treatmentDirection ? ` - ${treatmentDirection}` : ''}`,
    'rehabilitation': `Rehabilitation program${rehabilitationDirection ? ` - ${rehabilitationDirection}` : ''}`,
    'consultation': `Medical consultation${consultationDirection ? ` - ${consultationDirection}` : ''}`,
  };
  return descriptions[treatmentType || 'consultation'] || 'Medical consultation';
}
