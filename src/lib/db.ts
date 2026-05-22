/**
 * 数据库连接模块 - 摆脱 Coze SDK，使用标准 drizzle-orm + pg
 */

import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/storage/database/shared/schema';

// 从环境变量读取数据库 URL
const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.PGDATABASE_URL ||
  'postgresql://medai_user:medai_password@localhost:5432/medai_platform';

// 创建连接池（单例）
let pool: Pool | null = null;
let dbInstance: NodePgDatabase<typeof schema> | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // 连接错误处理
    pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });
  }
  return pool;
}

/**
 * 获取 drizzle ORM 实例（推荐）
 */
export function getDb() {
  if (!dbInstance) {
    const p = getPool();
    dbInstance = drizzle(p, { schema });
  }
  return dbInstance;
}

/**
 * 获取原生 pg Pool（用于需要直接执行 SQL 的场景）
 */
export function getPoolInstance(): Pool {
  return getPool();
}

/**
 * 关闭数据库连接（用于优雅退出）
 */
export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
    dbInstance = null;
  }
}

// 导出 schema 和类型
export * from '@/storage/database/shared/schema';
export type { schema };
