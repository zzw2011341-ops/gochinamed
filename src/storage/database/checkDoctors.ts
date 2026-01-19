import { getDb } from "coze-coding-dev-sdk";
import { doctors } from "./shared/schema";

async function main() {
  const db = await getDb();
  const allDoctors = await db.select().from(doctors);
  
  console.log(`Total doctors: ${allDoctors.length}`);
  
  // 检查重复名称
  const nameCount: Record<string, number> = {};
  allDoctors.forEach(d => {
    nameCount[d.nameEn] = (nameCount[d.nameEn] || 0) + 1;
  });
  
  const duplicates = Object.entries(nameCount)
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);
  
  if (duplicates.length > 0) {
    console.log(`\n⚠️  Found ${duplicates.length} duplicate names:`);
    duplicates.forEach(([name, count]) => {
      console.log(`   ${name}: ${count} times`);
    });
  } else {
    console.log("\n✅ No duplicate names found!");
  }
  
  // 显示前20个医生
  console.log(`\n👨‍⚕️ First 20 doctors:`);
  allDoctors.slice(0, 20).forEach((d, i) => {
    console.log(`   ${i + 1}. ${d.nameEn} (${d.nameZh}) - ${d.title}`);
  });
}

main().catch(console.error);
