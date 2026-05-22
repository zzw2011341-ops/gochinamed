import { getDb } from '@/lib/db';
import { doctors } from "./shared/schema";

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
  const ranges: Record<string, number> = {
    "0-200": 0,
    "200-300": 0,
    "300-500": 0,
    "500-800": 0,
    "800+": 0,
  };
  
  fees.forEach(f => {
    if (f < 200) ranges["0-200"]++;
    else if (f < 300) ranges["200-300"]++;
    else if (f < 500) ranges["300-500"]++;
    else if (f < 800) ranges["500-800"]++;
    else ranges["800+"]++;
  });
  
  console.log(`\n📊 Fee Ranges:`);
  Object.entries(ranges).forEach(([range, count]) => {
    console.log(`   ${range}: ${count} doctors (${(count/allDoctors.length*100).toFixed(1)}%)`);
  });
  
  // 显示费用最高的和最低的医生
  console.log(`\n💸 Highest Fee Doctors (Top 5):`);
  allDoctors
    .sort((a, b) => parseFloat(b.consultationFee || "0") - parseFloat(a.consultationFee || "0"))
    .slice(0, 5)
    .forEach((d, i) => {
      console.log(`   ${i+1}. ${d.nameEn} - ¥${d.consultationFee} (${d.experienceYears} years)`);
    });
  
  console.log(`\n💰 Lowest Fee Doctors (Top 5):`);
  allDoctors
    .sort((a, b) => parseFloat(a.consultationFee || "0") - parseFloat(b.consultationFee || "0"))
    .slice(0, 5)
    .forEach((d, i) => {
      console.log(`   ${i+1}. ${d.nameEn} - ¥${d.consultationFee} (${d.experienceYears} years)`);
    });
}

main().catch(console.error);
