import { getDb } from "coze-coding-dev-sdk";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function checkAdmin() {
  try {
    const db = await getDb();

    // 查询所有用户
    const allUsers = await db.select().from(users);
    console.log("Total users:", allUsers.length);

    // 查询管理员
    const admin = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@gochinamed.com"))
      .limit(1);

    if (admin.length > 0) {
      console.log("\n✅ Admin found:");
      console.log("   Email:", admin[0].email);
      console.log("   Password:", admin[0].password);
      console.log("   Name:", admin[0].name);
      console.log("   Role:", admin[0].role);
      console.log("   IsBlocked:", admin[0].isBlocked);
    } else {
      console.log("\n❌ Admin not found!");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

checkAdmin();
