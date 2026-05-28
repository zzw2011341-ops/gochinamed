import { eq, and, like, desc, sql, gt } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { attractions } from "./shared/schema";
import type { Attraction } from "./shared/schema";
import { z } from "zod";

// Validation Schemas
export const attractionSearchSchema = z.object({
  city: z.string().optional(),
  location: z.string().optional(),
  category: z.string().optional(),
  minRating: z.number().min(1).max(5).optional(),
  maxRating: z.number().min(1).max(5).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  isRecommendedForPatients: z.boolean().optional(),
  minDistance: z.number().optional(),
  maxDistance: z.number().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export type AttractionSearchInput = z.infer<typeof attractionSearchSchema>;

export class AttractionManager {
  /**
   * Get attraction by ID
   */
  static async findById(id: string): Promise<Attraction | null> {
    const db = await getDb();
    const result = await db
      .select()
      .from(attractions)
      .where(eq(attractions.id, id))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Search attractions with filters
   */
  static async search(filters: AttractionSearchInput): Promise<{ attractions: Attraction[]; total: number }> {
    const validated = attractionSearchSchema.parse(filters);
    const db = await getDb();

    // Build conditions
    const conditions = [eq(attractions.isActive, true)];

    if (validated.city) {
      conditions.push(eq(attractions.city, validated.city));
    }

    if (validated.location) {
      conditions.push(like(attractions.location, `%${validated.location}%`));
    }

    if (validated.category) {
      conditions.push(eq(attractions.category, validated.category));
    }

    if (validated.minRating) {
      conditions.push(sql`${attractions.rating} >= ${validated.minRating}`);
    }

    if (validated.maxRating) {
      conditions.push(sql`${attractions.rating} <= ${validated.maxRating}`);
    }

    if (validated.minPrice) {
      conditions.push(sql`${attractions.ticketPrice} >= ${validated.minPrice}`);
    }

    if (validated.maxPrice) {
      conditions.push(sql`${attractions.ticketPrice} <= ${validated.maxPrice}`);
    }

    if (validated.isRecommendedForPatients !== undefined) {
      conditions.push(eq(attractions.isRecommendedForPatients, validated.isRecommendedForPatients));
    }

    if (validated.minDistance) {
      conditions.push(sql`${attractions.distanceToHospital} >= ${validated.minDistance}`);
    }

    if (validated.maxDistance) {
      conditions.push(sql`${attractions.distanceToHospital} <= ${validated.maxDistance}`);
    }

    // Execute query
    const result = await db
      .select()
      .from(attractions)
      .where(and(...conditions))
      .orderBy(desc(attractions.isFeatured), desc(attractions.rating))
      .limit(validated.limit)
      .offset(validated.offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(attractions)
      .where(and(...conditions));

    return {
      attractions: result,
      total: Number(count),
    };
  }

  /**
   * Get featured attractions
   */
  static async getFeatured(limit: number = 6): Promise<Attraction[]> {
    const db = await getDb();
    return await db
      .select()
      .from(attractions)
      .where(and(eq(attractions.isActive, true), eq(attractions.isFeatured, true)))
      .orderBy(desc(attractions.rating))
      .limit(limit);
  }

  /**
   * Get attractions by city
   */
  static async getByCity(city: string, limit: number = 20): Promise<Attraction[]> {
    const db = await getDb();
    return await db
      .select()
      .from(attractions)
      .where(and(eq(attractions.isActive, true), eq(attractions.city, city)))
      .orderBy(desc(attractions.rating))
      .limit(limit);
  }

  /**
   * Get attractions recommended for patients
   */
  static async getRecommendedForPatients(city?: string, limit: number = 10): Promise<Attraction[]> {
    const db = await getDb();
    const conditions = [
      eq(attractions.isActive, true),
      eq(attractions.isRecommendedForPatients, true),
    ];

    if (city) {
      conditions.push(eq(attractions.city, city));
    }

    return await db
      .select()
      .from(attractions)
      .where(and(...conditions))
      .orderBy(desc(attractions.rating))
      .limit(limit);
  }

  /**
   * Get attractions by category
   */
  static async getByCategory(category: string, limit: number = 20): Promise<Attraction[]> {
    const db = await getDb();
    return await db
      .select()
      .from(attractions)
      .where(and(eq(attractions.isActive, true), eq(attractions.category, category)))
      .orderBy(desc(attractions.rating))
      .limit(limit);
  }

  /**
   * Get total attraction count
   */
  static async getAttractionCount(): Promise<number> {
    const db = await getDb();
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(attractions)
      .where(eq(attractions.isActive, true));
    return Number(count);
  }

  /**
   * Get categories list
   */
  static async getCategories(): Promise<string[]> {
    const db = await getDb();
    const result = await db
      .selectDistinct({ category: attractions.category })
      .from(attractions)
      .where(eq(attractions.isActive, true))
      .orderBy(attractions.category);

    return result.map((r) => r.category || "").filter(Boolean);
  }

  /**
   * Get cities with attractions
   */
  static async getCities(): Promise<string[]> {
    const db = await getDb();
    const result = await db
      .selectDistinct({ city: attractions.city })
      .from(attractions)
      .where(eq(attractions.isActive, true))
      .orderBy(attractions.city);

    return result.map((r) => r.city);
  }
}
