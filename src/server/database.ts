import { neon } from "@neondatabase/serverless";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/neon-http";

export const createDatabase = async () => {
	const sql = await neon(env.DATABASE_URL);
	return drizzle(sql);
};
