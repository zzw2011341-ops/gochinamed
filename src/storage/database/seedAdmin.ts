/**
 * Seed Default Admin User
 * Run this script to create a default admin account
 *
 * Usage:
 * npx tsx src/storage/database/seedAdmin.ts
 */

import { getDb } from "coze-coding-dev-sdk";
import { users } from "./shared/schema";

const DEFAULT_ADMIN = {
  email: "admin@gochinamed.com",
  password: "admin123456", // Change this in production!
  name: "System Admin",
  phone: "+8613800000000",
  role: "admin" as const,
  preferredLanguage: "en" as const,
  isBlocked: false,
  points: 0,
};

async function seedAdmin() {
  try {
    console.log("Connecting to database...");
    const db = await getDb();

    console.log("Checking if admin already exists...");
    const existingAdmin = await db
      .select()
      .from(users)
      .where((users) => users.email === DEFAULT_ADMIN.email)
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("⚠️  Admin already exists with email:", DEFAULT_ADMIN.email);
      console.log("   Email:", DEFAULT_ADMIN.email);
      console.log("   Password:", DEFAULT_ADMIN.password);
      return;
    }

    console.log("Creating default admin account...");
    const result = await db
      .insert(users)
      .values(DEFAULT_ADMIN)
      .returning();

    console.log("✅ Default admin account created successfully!");
    console.log("\n   Email:", DEFAULT_ADMIN.email);
    console.log("   Password:", DEFAULT_ADMIN.password);
    console.log("\n⚠️  IMPORTANT: Please change the default password in production!");
  } catch (error) {
    console.error("❌ Failed to create admin account:", error);
    process.exit(1);
  }
}

seedAdmin()
  .then(() => {
    console.log("\n✨ Seed completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
