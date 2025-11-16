import { betterAuth } from "better-auth";
import { getDb } from "../db";
import { env } from "cloudflare:workers";
import * as schema from "../../drizzle/schema";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

const db = getDb(env);

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        schema: schema,
        provider: "pg",
    }),
    emailAndPassword: {
        enabled: true,
    },
});