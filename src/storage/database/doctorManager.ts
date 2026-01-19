import { eq, and, SQL, like, sql } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { doctors, hospitals, insertDoctorSchema, updateDoctorSchema } from "./shared/schema";
import type { Doctor, InsertDoctor, UpdateDoctor } from "./shared/schema";

export class DoctorManager {
  async createDoctor(data: InsertDoctor): Promise<Doctor> {
    const db = await getDb();
    const validated = insertDoctorSchema.parse(data);
    const [doctor] = await db.insert(doctors).values(validated).returning();
    return doctor;
  }

  async getDoctors(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<Pick<Doctor, 'id' | 'hospitalId' | 'isFeatured' | 'isActive'>>;
    search?: string;
  } = {}): Promise<Doctor[]> {
    const { skip = 0, limit = 100, filters = {}, search = '' } = options;
    const db = await getDb();

    const conditions: SQL[] = [];

    if (filters.id !== undefined) {
      conditions.push(eq(doctors.id, filters.id));
    }
    if (filters.hospitalId !== undefined) {
      conditions.push(eq(doctors.hospitalId, filters.hospitalId));
    }
    if (filters.isFeatured !== undefined) {
      conditions.push(eq(doctors.isFeatured, filters.isFeatured));
    }
    if (filters.isActive !== undefined) {
      conditions.push(eq(doctors.isActive, filters.isActive));
    }

    // Search by name
    if (search) {
      conditions.push(
        like(doctors.nameEn, `%${search}%`)
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return db
      .select()
      .from(doctors)
      .where(whereClause)
      .limit(limit)
      .offset(skip)
      .orderBy(doctors.createdAt);
  }

  async getDoctorById(id: string): Promise<Doctor | null> {
    const db = await getDb();
    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, id));
    return doctor || null;
  }

  async getDoctorsByHospital(hospitalId: string): Promise<Doctor[]> {
    const db = await getDb();
    return db
      .select()
      .from(doctors)
      .where(
        and(
          eq(doctors.hospitalId, hospitalId),
          eq(doctors.isActive, true)
        )
      )
      .orderBy(doctors.createdAt);
  }

  async getFeaturedDoctors(limit = 10): Promise<Doctor[]> {
    const db = await getDb();
    return db
      .select()
      .from(doctors)
      .where(
        and(
          eq(doctors.isFeatured, true),
          eq(doctors.isActive, true)
        )
      )
      .limit(limit);
  }

  async getDoctorWithHospital(id: string): Promise<(Doctor & { hospital?: any }) | null> {
    const db = await getDb();
    const [doctor] = await db
      .select({
        id: doctors.id,
        hospitalId: doctors.hospitalId,
        nameEn: doctors.nameEn,
        nameZh: doctors.nameZh,
        title: doctors.title,
        specialtiesEn: doctors.specialtiesEn,
        specialtiesZh: doctors.specialtiesZh,
        descriptionEn: doctors.descriptionEn,
        descriptionZh: doctors.descriptionZh,
        experienceYears: doctors.experienceYears,
        imageUrl: doctors.imageUrl,
        consultationFee: doctors.consultationFee,
        isFeatured: doctors.isFeatured,
        isActive: doctors.isActive,
        metadata: doctors.metadata,
        createdAt: doctors.createdAt,
        updatedAt: doctors.updatedAt,
        hospital: {
          id: hospitals.id,
          nameEn: hospitals.nameEn,
          nameZh: hospitals.nameZh,
          location: hospitals.location,
        },
      })
      .from(doctors)
      .leftJoin(hospitals, eq(doctors.hospitalId, hospitals.id))
      .where(eq(doctors.id, id));

    return doctor || null;
  }

  async updateDoctor(id: string, data: UpdateDoctor): Promise<Doctor | null> {
    const db = await getDb();
    const validated = updateDoctorSchema.parse(data);
    const [doctor] = await db
      .update(doctors)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(doctors.id, id))
      .returning();
    return doctor || null;
  }

  async deleteDoctor(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(doctors).where(eq(doctors.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getTotalDoctorsCount(): Promise<number> {
    const db = await getDb();
    const result = await db.select({ count: sql`count(*)` }).from(doctors);
    return Number(result[0]?.count ?? 0);
  }

  static async getDoctorCount(): Promise<number> {
    const db = await getDb();
    const result = await db.select({ count: sql`count(*)` }).from(doctors);
    return Number(result[0]?.count ?? 0);
  }
}

export const doctorManager = new DoctorManager();
