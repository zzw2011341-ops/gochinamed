import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
config({ path: '.env.production' });

const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql);

const orders = await db`select id, metadata, doctor_appointment_date, total_amount, currency from orders where id like '44ae310f%' limit 1`;
if (orders.length > 0) {
  console.log('订单ID:', orders[0].id);
  console.log('metadata JSON:', JSON.stringify(orders[0].metadata, null, 2));
}
await sql.end();
