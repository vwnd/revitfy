import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "@/db/schema"

export const createDatabase = async () => {
    const sql = neon(process.env.DATABASE_URL!)
    const db = await drizzle(sql, { schema })
    return db
}