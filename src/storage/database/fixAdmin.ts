import { getDb } from "coze-coding-dev-sdk";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function fixAdmin() {
  try {
    const db = await getDb();

    // 1. 删除错误的管理员账号
    console.log("Deleting incorrect admin account...");
    await db.delete(users).where(eq(users.email, "admin@gochinamed.com"));
    console.log("✅ Deleted");

    // 2. 创建正确的管理员账号
    console.log("\nCreating correct admin account...");
    const adminData = {
      email: "admin@gochinamed.com",
      password: "admin123456",
      name: "System Admin",
      phone: "+8613800000000",
      role: "admin" as const,
      preferredLanguage: "en" as const,
      isBlocked: false,
      points: 0,
    };

    const result = await db.insert(users).values(adminData).returning();

    console.log("\n✅ Admin account created successfully!");
    console.log("\n   Email:", result[0].email);
    console.log("   Password:", result[0].password);
    console.log("   Name:", result[0].name);
    console.log("   Role:", result[0].role);
  } catch (error) {
    console.error("Error:", error);
  }
}

fixAdmin();
