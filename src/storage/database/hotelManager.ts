import { eq, and, like, or, desc, sql, gt } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { hotels } from "./shared/schema";
import type { Hotel } from "./shared/schema";
import { z } from "zod";

// Validation Schemas
export const hotelSearchSchema = z.object({
  city: z.string().optional(),
  location: z.string().optional(),
  starRating: z.number().min(1).max(5).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minDistance: z.number().optional(),
  maxDistance: z.number().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export type HotelSearchInput = z.infer<typeof hotelSearchSchema>;

export class HotelManager {
  /**
   * Get hotel by ID
   */
  static async findById(id: string): Promise<Hotel | null> {
    const db = await getDb();
    const result = await db
      .select()
      .from(hotels)
      .where(eq(hotels.id, id))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Search hotels with filters
   */
  static async search(filters: HotelSearchInput): Promise<{ hotels: Hotel[]; total: number }> {
    const validated = hotelSearchSchema.parse(filters);
    const db = await getDb();

    // Build conditions
    const conditions = [eq(hotels.isActive, true)];

    if (validated.city) {
      conditions.push(eq(hotels.city, validated.city));
    }

    if (validated.location) {
      conditions.push(like(hotels.location, `%${validated.location}%`));
    }

    if (validated.starRating) {
      conditions.push(eq(hotels.starRating, validated.starRating));
    }

    if (validated.minPrice) {
      conditions.push(sql`${hotels.basePricePerNight} >= ${validated.minPrice}`);
    }

    if (validated.maxPrice) {
      conditions.push(sql`${hotels.basePricePerNight} <= ${validated.maxPrice}`);
    }

    if (validated.minDistance) {
      conditions.push(sql`${hotels.distanceToHospital} >= ${validated.minDistance}`);
    }

    if (validated.maxDistance) {
      conditions.push(sql`${hotels.distanceToHospital} <= ${validated.maxDistance}`);
    }

    // Execute query
    const result = await db
      .select()
      .from(hotels)
      .where(and(...conditions))
      .orderBy(desc(hotels.isFeatured), hotels.starRating)
      .limit(validated.limit)
      .offset(validated.offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(hotels)
      .where(and(...conditions));

    return {
      hotels: result,
      total: Number(count),
    };
  }

  /**
   * Get featured hotels
   */
  static async getFeatured(limit: number = 6): Promise<Hotel[]> {
    const db = await getDb();
    return await db
      .select()
      .from(hotels)
      .where(and(eq(hotels.isActive, true), eq(hotels.isFeatured, true)))
      .orderBy(desc(hotels.starRating))
      .limit(limit);
  }

  /**
   * Get hotels by city
   */
  static async getByCity(city: string, limit: number = 20): Promise<Hotel[]> {
    const db = await getDb();
    return await db
      .select()
      .from(hotels)
      .where(and(eq(hotels.isActive, true), eq(hotels.city, city)))
      .orderBy(desc(hotels.isFeatured), hotels.starRating)
      .limit(limit);
  }

  /**
   * Get total hotel count
   */
  static async getHotelCount(): Promise<number> {
    const db = await getDb();
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(hotels)
      .where(eq(hotels.isActive, true));
    return Number(count);
  }

  /**
   * Get available room types for a hotel
   */
  static async getAvailableRooms(hotelId: string, checkIn: Date, checkOut: Date): Promise<any[]> {
    const hotel = await this.findById(hotelId);
    if (!hotel) return [];

    const roomTypes = hotel.roomTypes as any[] || [];
    // Filter rooms with available count > 0
    return roomTypes.filter((room) => room.available > 0);
  }

  /**
   * Calculate total price for hotel stay
   */
  static calculateStayPrice(
    hotelId: string,
    roomType: string,
    checkIn: Date,
    checkOut: Date
  ): number | null {
    // This is a simplified calculation
    // In production, you would check availability and apply seasonal rates
    return null;
  }
}
