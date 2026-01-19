import { eq, and } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { users } from "./shared/schema";
import type { User } from "./shared/schema";
import { z } from "zod";

// Validation Schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Invalid phone number"),
  preferredLanguage: z.enum(["en", "de", "fr", "zh"]).default("en"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export class AuthManager {
  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const db = await getDb();
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    const db = await getDb();
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Register new user
   */
  static async register(input: RegisterInput): Promise<User> {
    const validated = registerSchema.parse(input);

    // Check if email already exists
    const existingUser = await this.findByEmail(validated.email);
    if (existingUser) {
      throw new Error("Email already registered");
    }

    // For demo purposes, store password as plain text
    // In production, use bcrypt to hash passwords
    const newUser = {
      email: validated.email,
      password: validated.password, // TODO: Hash with bcrypt
      name: validated.name,
      phone: validated.phone,
      preferredLanguage: validated.preferredLanguage,
      role: "patient" as const,
      points: 0,
      isBlocked: false,
    };

    const db = await getDb();
    const result = await db.insert(users).values(newUser).returning();
    return result[0];
  }

  /**
   * Login user
   */
  static async login(input: LoginInput): Promise<{ user: User; token: string }> {
    const validated = loginSchema.parse(input);

    const user = await this.findByEmail(validated.email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.password) {
      throw new Error("Account not set up with password");
    }

    // For demo purposes, plain text comparison
    // In production, use bcrypt.compare()
    if (user.password !== validated.password) {
      throw new Error("Invalid email or password");
    }

    if (user.isBlocked) {
      throw new Error("Account has been blocked");
    }

    // Generate a simple token (in production, use JWT)
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString("base64");

    return { user, token };
  }

  /**
   * Verify token and get user
   */
  static async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const userId = decoded.split(":")[0];
      return await this.findById(userId);
    } catch {
      return null;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    updates: Partial<Pick<User, "name" | "phone" | "avatarUrl" | "passportNumber" | "passportCountry" | "preferredLanguage">>
  ): Promise<User> {
    const db = await getDb();
    const result = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!result[0]) {
      throw new Error("User not found");
    }

    return result[0];
  }

  /**
   * Change password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.password || user.password !== currentPassword) {
      throw new Error("Current password is incorrect");
    }

    const db = await getDb();
    await db
      .update(users)
      .set({
        password: newPassword, // TODO: Hash with bcrypt
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  /**
   * Block/Unblock user (admin only)
   */
  static async setUserStatus(userId: string, isBlocked: boolean): Promise<User> {
    const db = await getDb();
    const result = await db
      .update(users)
      .set({
        isBlocked,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!result[0]) {
      throw new Error("User not found");
    }

    return result[0];
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(filters?: {
    role?: "patient" | "admin" | "staff";
    isBlocked?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<User[]> {
    const db = await getDb();

    const conditions = [];

    if (filters?.role) {
      conditions.push(eq(users.role, filters.role));
    }

    if (filters?.isBlocked !== undefined) {
      conditions.push(eq(users.isBlocked, filters.isBlocked));
    }

    return await db
      .select()
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(users.createdAt)
      .limit(filters?.limit ?? 50)
      .offset(filters?.offset ?? 0);
  }

  /**
   * Get user count by role
   */
  static async getUserCountByRole(): Promise<Record<string, number>> {
    const db = await getDb();
    const allUsers = await db.select().from(users);

    const counts: Record<string, number> = {
      total: allUsers.length,
      patient: 0,
      admin: 0,
      staff: 0,
      blocked: 0,
    };

    for (const user of allUsers) {
      const role = user.role as string;
      if (counts[role] !== undefined) {
        counts[role]++;
      }
      if (user.isBlocked) {
        counts.blocked++;
      }
    }

    return counts;
  }
}
