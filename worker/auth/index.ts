import { betterAuth } from "better-auth";
import { getDb } from "../db";
import * as schema from "../../drizzle/schema";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

interface Env {
  DATABASE_URL?: string;
  HYPERDRIVE?: { connectionString: string };
}

// Cache auth instance per worker instance (lazy initialization)
let authInstance: ReturnType<typeof betterAuth> | null = null;

// Lazy initialization function - only called at runtime
export function getAuth(env: Env) {
  if (!authInstance) {
    const db = getDb(env);
    
    authInstance = betterAuth({
      database: drizzleAdapter(db, {
          schema: schema,
          provider: "pg",
      }),
      emailAndPassword: {
          enabled: true,
      },
    });
  }
  
  return authInstance;
}