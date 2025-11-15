// path to a file with schema you want to reset
import * as schema from "../src/db/schema";
import { reset } from "drizzle-seed";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import "dotenv/config";
async function main() {
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql, { schema });
  await reset(db, schema);  
}
main();