import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';

interface Env {
  DATABASE_URL?: string;
  HYPERDRIVE?: { connectionString: string };
}

export function getDb(env: Env) {
  // Use Hyperdrive if available, otherwise fall back to DATABASE_URL
  const connectionString = env.HYPERDRIVE?.connectionString || env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL or HYPERDRIVE connection string is required');
  }

  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

