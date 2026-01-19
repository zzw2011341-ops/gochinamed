import { eq, and, like, or, desc, sql } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { diseases } from "./shared/schema";
import type { Disease } from "./shared/schema";
import { z } from "zod";

// Validation Schemas
export const diseaseSearchSchema = z.object({
  keyword: z.string().optional(),
  category: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export type DiseaseSearchInput = z.infer<typeof diseaseSearchSchema>;

export class DiseaseManager {
  /**
   * Get disease by ID
   */
  static async findById(id: string): Promise<Disease | null> {
    const db = await getDb();
    const result = await db
      .select()
      .from(diseases)
      .where(eq(diseases.id, id))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Search diseases
   */
  static async search(filters: DiseaseSearchInput): Promise<{ diseases: Disease[]; total: number }> {
    const validated = diseaseSearchSchema.parse(filters);
    const db = await getDb();

    // Build conditions
    const conditions = [eq(diseases.isActive, true)];

    if (validated.keyword) {
      const keyword = `%${validated.keyword}%`;
      conditions.push(
        or(
          like(diseases.nameEn, keyword),
          like(diseases.nameZh, keyword),
          like(diseases.descriptionEn, keyword),
          like(diseases.descriptionZh, keyword)
        )!
      );
    }

    if (validated.category) {
      conditions.push(eq(diseases.category, validated.category));
    }

    // Execute query
    const result = await db
      .select()
      .from(diseases)
      .where(and(...conditions))
      .orderBy(diseases.nameEn)
      .limit(validated.limit)
      .offset(validated.offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(diseases)
      .where(and(...conditions));

    return {
      diseases: result,
      total: Number(count),
    };
  }

  /**
   * Get diseases by category
   */
  static async getByCategory(category: string, limit: number = 20): Promise<Disease[]> {
    const db = await getDb();
    return await db
      .select()
      .from(diseases)
      .where(and(eq(diseases.isActive, true), eq(diseases.category, category)))
      .orderBy(diseases.nameEn)
      .limit(limit);
  }

  /**
   * Get all categories
   */
  static async getCategories(): Promise<string[]> {
    const db = await getDb();
    const result = await db
      .selectDistinct({ category: diseases.category })
      .from(diseases)
      .where(and(eq(diseases.isActive, true), sql`${diseases.category} IS NOT NULL`))
      .orderBy(diseases.category);

    return result.map((r) => r.category).filter(Boolean) as string[];
  }

  /**
   * Get popular diseases (most searched)
   */
  static async getPopular(limit: number = 10): Promise<Disease[]> {
    // In production, this would be based on search statistics
    const db = await getDb();
    return await db
      .select()
      .from(diseases)
      .where(eq(diseases.isActive, true))
      .orderBy(diseases.nameEn)
      .limit(limit);
  }

  /**
   * Get total disease count
   */
  static async getDiseaseCount(): Promise<number> {
    const db = await getDb();
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(diseases)
      .where(eq(diseases.isActive, true));
    return Number(count);
  }

  /**
   * Find diseases by name (exact match)
   */
  static async findByName(nameEn: string | null, nameZh: string | null): Promise<Disease | null> {
    if (!nameEn && !nameZh) return null;

    const db = await getDb();
    const conditions = [eq(diseases.isActive, true)];

    if (nameEn) {
      conditions.push(eq(diseases.nameEn, nameEn));
    } else if (nameZh) {
      conditions.push(eq(diseases.nameZh, nameZh));
    }

    const result = await db
      .select()
      .from(diseases)
      .where(and(...conditions))
      .limit(1);

    return result[0] || null;
  }
}
