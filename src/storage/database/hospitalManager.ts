import { eq, and, SQL, like, sql, or, desc } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { hospitals, insertHospitalSchema, updateHospitalSchema } from "./shared/schema";
import type { Hospital, InsertHospital, UpdateHospital } from "./shared/schema";

export class HospitalManager {
  async createHospital(data: InsertHospital): Promise<Hospital> {
    const db = await getDb();
    const validated = insertHospitalSchema.parse(data);
    const [hospital] = await db.insert(hospitals).values(validated).returning();
    return hospital;
  }

  async getHospitals(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<Pick<Hospital, 'id' | 'level' | 'location' | 'isFeatured' | 'isActive'>>;
    search?: string;
  } = {}): Promise<Hospital[]> {
    const { skip = 0, limit = 100, filters = {}, search = '' } = options;
    const db = await getDb();

    const conditions: SQL[] = [];

    if (filters.id !== undefined) {
      conditions.push(eq(hospitals.id, filters.id));
    }
    if (filters.level !== undefined && filters.level !== null) {
      conditions.push(eq(hospitals.level, filters.level));
    }
    if (filters.location !== undefined) {
      conditions.push(eq(hospitals.location, filters.location));
    }
    if (filters.isFeatured !== undefined) {
      conditions.push(eq(hospitals.isFeatured, filters.isFeatured));
    }
    if (filters.isActive !== undefined) {
      conditions.push(eq(hospitals.isActive, filters.isActive));
    }

    // Search by name or location
    if (search) {
      conditions.push(
        like(hospitals.nameEn, `%${search}%`)
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return db
      .select()
      .from(hospitals)
      .where(whereClause)
      .limit(limit)
      .offset(skip)
      .orderBy(hospitals.createdAt);
  }

  async getHospitalById(id: string): Promise<Hospital | null> {
    const db = await getDb();
    const [hospital] = await db.select().from(hospitals).where(eq(hospitals.id, id));
    return hospital || null;
  }

  async getFeaturedHospitals(limit = 10): Promise<Hospital[]> {
    const db = await getDb();
    return db
      .select()
      .from(hospitals)
      .where(
        and(
          eq(hospitals.isFeatured, true),
          eq(hospitals.isActive, true)
        )
      )
      .limit(limit);
  }

  async updateHospital(id: string, data: UpdateHospital): Promise<Hospital | null> {
    const db = await getDb();
    const validated = updateHospitalSchema.parse(data);
    const [hospital] = await db
      .update(hospitals)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(hospitals.id, id))
      .returning();
    return hospital || null;
  }

  async deleteHospital(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(hospitals).where(eq(hospitals.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getTotalHospitalsCount(): Promise<number> {
    const db = await getDb();
    const result = await db.select({ count: sql`count(*)` }).from(hospitals);
    return Number(result[0]?.count ?? 0);
  }

  static async getHospitalCount(): Promise<number> {
    const db = await getDb();
    const result = await db.select({ count: sql`count(*)` }).from(hospitals);
    return Number(result[0]?.count ?? 0);
  }

  static async search(options: {
    keyword?: string;
    location?: string;
    level?: string;
    specialty?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ hospitals: Hospital[]; total: number }> {
    const { keyword = '', location = '', level = '', specialty = '', limit = 20, offset = 0 } = options;
    const db = await getDb();

    const conditions: SQL[] = [eq(hospitals.isActive, true)];

    if (keyword) {
      conditions.push(
        or(
          like(hospitals.nameEn, `%${keyword}%`),
          like(hospitals.nameZh, `%${keyword}%`)
        )!
      );
    }

    if (location) {
      // 根据location参数筛选医院，location是城市的ID（如"beijing"）
      conditions.push(eq(hospitals.cityId, location));
    }

    if (level) {
      conditions.push(eq(hospitals.level, level));
    }

    const whereClause = and(...conditions);

    const hospitalsList = await db
      .select()
      .from(hospitals)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(hospitals.isFeatured), hospitals.createdAt);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(hospitals)
      .where(whereClause);

    return {
      hospitals: hospitalsList,
      total: Number(count),
    };
  }
}

export const hospitalManager = new HospitalManager();
