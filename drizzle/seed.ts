import { user, families, familyDefinitions, familyDefinitionUserLikes, familyDefinitionUserShares, projects } from "@/db/schema";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { seed } from "drizzle-seed";
import "dotenv/config";

async function main() {
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);

    await seed(db, { user, familyDefinitions, families, familyDefinitionUserLikes, familyDefinitionUserShares, projects })
}

main().catch(console.error);