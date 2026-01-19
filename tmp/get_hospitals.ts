import { getDb } from "coze-coding-dev-sdk";
import { hospitals } from "/workspace/projects/src/storage/database/shared/schema";

async function main() {
  const db = await getDb();
  const allHospitals = await db.select().from(hospitals);
  
  console.log(JSON.stringify(allHospitals.map(h => ({
    id: h.id,
    nameEn: h.nameEn,
    nameZh: h.nameZh,
    specialties: h.specialties,
    cityId: h.cityId
  })), null, 2));
}

main().catch(console.error);
