import { eq, and, SQL, sql, desc } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { orders, insertOrderSchema, updateOrderSchema, users, doctors, hospitals, diseases } from "./shared/schema";
import type { Order, InsertOrder, UpdateOrder } from "./shared/schema";

export class OrderManager {
  async createOrder(data: InsertOrder): Promise<Order> {
    const db = await getDb();
    const validated = insertOrderSchema.parse(data);
    const [order] = await db.insert(orders).values(validated).returning();
    return order;
  }

  async getOrders(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<Pick<Order, 'id' | 'userId' | 'doctorId' | 'hospitalId' | 'status'>>;
  } = {}): Promise<Order[]> {
    const { skip = 0, limit = 100, filters = {} } = options;
    const db = await getDb();

    const conditions: SQL[] = [];

    if (filters.id !== undefined) {
      conditions.push(eq(orders.id, filters.id));
    }
    if (filters.userId !== undefined) {
      conditions.push(eq(orders.userId, filters.userId));
    }
    if (filters.doctorId !== undefined && filters.doctorId !== null) {
      conditions.push(eq(orders.doctorId, filters.doctorId));
    }
    if (filters.hospitalId !== undefined && filters.hospitalId !== null) {
      conditions.push(eq(orders.hospitalId, filters.hospitalId));
    }
    if (filters.status !== undefined) {
      conditions.push(eq(orders.status, filters.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return db
      .select()
      .from(orders)
      .where(whereClause)
      .limit(limit)
      .offset(skip)
      .orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: string): Promise<Order | null> {
    const db = await getDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || null;
  }

  async getOrderWithDetails(id: string): Promise<(Order & {
    user?: any;
    doctor?: any;
    hospital?: any;
    disease?: any;
  }) | null> {
    const db = await getDb();
    const [order] = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        doctorId: orders.doctorId,
        hospitalId: orders.hospitalId,
        diseaseId: orders.diseaseId,
        status: orders.status,
        doctorAppointmentStatus: orders.doctorAppointmentStatus,
        doctorAppointmentDate: orders.doctorAppointmentDate,
        serviceReservationStatus: orders.serviceReservationStatus,
        medicalFee: orders.medicalFee,
        hotelFee: orders.hotelFee,
        flightFee: orders.flightFee,
        ticketFee: orders.ticketFee,
        subtotal: orders.subtotal,
        serviceFeeRate: orders.serviceFeeRate,
        serviceFeeAmount: orders.serviceFeeAmount,
        totalAmount: orders.totalAmount,
        currency: orders.currency,
        notes: orders.notes,
        travelNotes: orders.travelNotes,
        weatherForecast: orders.weatherForecast,
        consultationDirection: orders.consultationDirection,
        examinationItems: orders.examinationItems,
        surgeryTypes: orders.surgeryTypes,
        treatmentDirection: orders.treatmentDirection,
        rehabilitationDirection: orders.rehabilitationDirection,
        healthRecordsUrls: orders.healthRecordsUrls,
        medicalPlan: orders.medicalPlan,
        planAdjustments: orders.planAdjustments,
        priceAdjustmentStatus: orders.priceAdjustmentStatus,
        priceAdjustmentAmount: orders.priceAdjustmentAmount,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
        },
        doctor: {
          id: doctors.id,
          nameEn: doctors.nameEn,
          nameZh: doctors.nameZh,
        },
        hospital: {
          id: hospitals.id,
          nameEn: hospitals.nameEn,
          nameZh: hospitals.nameZh,
        },
        disease: {
          id: diseases.id,
          nameEn: diseases.nameEn,
          nameZh: diseases.nameZh,
        },
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(doctors, eq(orders.doctorId, doctors.id))
      .leftJoin(hospitals, eq(orders.hospitalId, hospitals.id))
      .leftJoin(diseases, eq(orders.diseaseId, diseases.id))
      .where(eq(orders.id, id));

    return order || null;
  }

  async updateOrder(id: string, data: UpdateOrder): Promise<Order | null> {
    const db = await getDb();
    const validated = updateOrderSchema.parse(data);
    const [order] = await db
      .update(orders)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order || null;
  }

  async calculateBill(orderData: {
    medicalFee: string | number;
    hotelFee: string | number;
    flightFee: string | number;
    ticketFee: string | number;
    serviceFeeRate: number;
  }): Promise<{
    subtotal: number;
    serviceFeeAmount: number;
    totalAmount: number;
  }> {
    const medicalFee = Number(orderData.medicalFee) || 0;
    const hotelFee = Number(orderData.hotelFee) || 0;
    const flightFee = Number(orderData.flightFee) || 0;
    const ticketFee = Number(orderData.ticketFee) || 0;

    const subtotal = medicalFee + hotelFee + flightFee + ticketFee;
    const serviceFeeRate = orderData.serviceFeeRate || 0.05;
    const serviceFeeAmount = subtotal * serviceFeeRate;
    const totalAmount = subtotal + serviceFeeAmount;

    return {
      subtotal,
      serviceFeeAmount,
      totalAmount,
    };
  }

  async deleteOrder(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(orders).where(eq(orders.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getTotalOrdersCount(): Promise<number> {
    const db = await getDb();
    const result = await db.select({ count: sql`count(*)` }).from(orders);
    return Number(result[0]?.count ?? 0);
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    const db = await getDb();
    return db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  static async getOrderStats(): Promise<{
    total: number;
    pending: number;
    completed: number;
    revenue: number;
  }> {
    const db = await getDb();
    const allOrders = await db
      .select({
        status: orders.status,
        totalAmount: orders.totalAmount,
      })
      .from(orders);

    const stats = {
      total: allOrders.length,
      pending: 0,
      completed: 0,
      revenue: 0,
    };

    for (const order of allOrders) {
      if (order.status === "pending") {
        stats.pending++;
      } else if (order.status === "completed") {
        stats.completed++;
      }

      if (order.totalAmount) {
        stats.revenue += Number(order.totalAmount);
      }
    }

    return stats;
  }
}

export const orderManager = new OrderManager();
