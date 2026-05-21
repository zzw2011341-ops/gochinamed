import { eq, and, or, desc, asc, sql, gt, like } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { flights } from "./shared/schema";
import type { Flight } from "./shared/schema";
import { z } from "zod";

// Validation Schemas
export const flightSearchSchema = z.object({
  origin: z.string().min(3).max(10),
  destination: z.string().min(3).max(10),
  departureDate: z.string().optional(), // ISO date string
  returnDate: z.string().optional(),
  classType: z.enum(["economy", "business", "first"]).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  airline: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export type FlightSearchInput = z.infer<typeof flightSearchSchema>;

export class FlightManager {
  /**
   * Get flight by ID
   */
  static async findById(id: string): Promise<Flight | null> {
    const db = await getDb();
    const result = await db
      .select()
      .from(flights)
      .where(eq(flights.id, id))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Search flights with filters
   */
  static async search(filters: FlightSearchInput): Promise<{ flights: Flight[]; total: number }> {
    const validated = flightSearchSchema.parse(filters);
    const db = await getDb();

    // Build conditions
    const conditions = [
      eq(flights.isActive, true),
      gt(flights.availableSeats, 0),
    ];

    if (validated.origin) {
      conditions.push(eq(flights.origin, validated.origin.toUpperCase()));
    }

    if (validated.destination) {
      conditions.push(eq(flights.destination, validated.destination.toUpperCase()));
    }

    if (validated.departureDate) {
      const date = new Date(validated.departureDate);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      conditions.push(
        sql`${flights.departureTime} >= ${startOfDay}`,
        sql`${flights.departureTime} <= ${endOfDay}`
      );
    }

    if (validated.classType) {
      conditions.push(eq(flights.classType, validated.classType));
    }

    if (validated.airline) {
      conditions.push(like(flights.airline, `%${validated.airline}%`));
    }

    if (validated.minPrice) {
      conditions.push(sql`${flights.price} >= ${validated.minPrice}`);
    }

    if (validated.maxPrice) {
      conditions.push(sql`${flights.price} <= ${validated.maxPrice}`);
    }

    // Execute query
    const result = await db
      .select()
      .from(flights)
      .where(and(...conditions))
      .orderBy(asc(flights.departureTime), asc(flights.price))
      .limit(validated.limit)
      .offset(validated.offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(flights)
      .where(and(...conditions));

    return {
      flights: result,
      total: Number(count),
    };
  }

  /**
   * Get popular routes
   */
  static async getPopularRoutes(limit: number = 10): Promise<any[]> {
    const db = await getDb();
    const result = await db
      .select({
        origin: flights.origin,
        destination: flights.destination,
        count: sql<number>`count(*)`,
        avgPrice: sql<number>`avg(${flights.price})`,
      })
      .from(flights)
      .where(and(eq(flights.isActive, true), gt(flights.availableSeats, 0)))
      .groupBy(flights.origin, flights.destination)
      .orderBy(sql`count(*) desc`)
      .limit(limit);

    return result;
  }

  /**
   * Get flights by airline
   */
  static async getByAirline(airline: string, limit: number = 20): Promise<Flight[]> {
    const db = await getDb();
    return await db
      .select()
      .from(flights)
      .where(and(eq(flights.isActive, true), like(flights.airline, `%${airline}%`)))
      .orderBy(desc(flights.departureTime))
      .limit(limit);
  }

  /**
   * Get total flight count
   */
  static async getFlightCount(): Promise<number> {
    const db = await getDb();
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(flights)
      .where(eq(flights.isActive, true));
    return Number(count);
  }

  /**
   * Get airlines list
   */
  static async getAirlines(): Promise<string[]> {
    const db = await getDb();
    const result = await db
      .selectDistinct({ airline: flights.airline })
      .from(flights)
      .where(eq(flights.isActive, true))
      .orderBy(flights.airline);

    return result.map((r) => r.airline);
  }

  /**
   * Update available seats
   */
  static async updateSeats(
    flightId: string,
    seatsToDeduct: number
  ): Promise<Flight | null> {
    const db = await getDb();
    const flight = await this.findById(flightId);

    if (!flight) return null;
    if (flight.availableSeats < seatsToDeduct) {
      throw new Error("Not enough available seats");
    }

    const result = await db
      .update(flights)
      .set({
        availableSeats: flight.availableSeats - seatsToDeduct,
        updatedAt: new Date(),
      })
      .where(eq(flights.id, flightId))
      .returning();

    return result[0] || null;
  }
}
