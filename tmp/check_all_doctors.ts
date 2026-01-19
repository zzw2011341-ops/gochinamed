import { getDb } from "coze-coding-dev-sdk";
import { doctors } from "/workspace/projects/src/storage/database/shared/schema";

async function main() {
  const db = await getDb();
  const allDoctors = await db.select().from(doctors);
  
  console.log(`Total doctors: ${allDoctors.length}`);
  
  // 统计费用分布
  const fees = allDoctors.map(d => parseFloat(d.consultationFee || "0"));
  fees.sort((a, b) => a - b);
  
  console.log(`\n💰 Consultation Fee Distribution:`);
  console.log(`   Min: ${fees[0]}`);
  console.log(`   Max: ${fees[fees.length - 1]}`);
  console.log(`   Median: ${fees[Math.floor(fees.length / 2)]}`);
  console.log(`   Average: ${(fees.reduce((a, b) => a + b, 0) / fees.length).toFixed(2)}`);
  
  // 费用区间统计
  const ranges = {
    "0-100": 0,
    "100-200": 0,
    "200-300": 0,
    "300-500": 0,
    "500-800": 0,
    "800+": 0,
  };
  
  fees.forEach(f => {
    if (f < 100) ranges["0-100"]++;
    else if (f < 200) ranges["100-200"]++;
    else if (f < 300) ranges["200-300"]++;
    else if (f < 500) ranges["300-500"]++;
    else if (f < 800) ranges["500-800"]++;
    else ranges["800+"]++;
  });
  
  console.log(`\n📊 Fee Ranges:`);
  Object.entries(ranges).forEach(([range, count]) => {
    console.log(`   ${range}: ${count} doctors (${(count/allDoctors.length*100).toFixed(1)}%)`);
  });
  
  // 检查城市筛选
  console.log(`\n🏙️  City Distribution of first 50 doctors:`);
  const cityCount: Record<string, number> = {};
  allDoctors.slice(0, 50).forEach(d => {
    cityCount[d.cityId || "null"] = (cityCount[d.cityId || "null"] || 0) + 1;
  });
  
  Object.entries(cityCount).forEach(([city, count]) => {
    console.log(`   ${city}: ${count}`);
  });
}

main().catch(console.error);
