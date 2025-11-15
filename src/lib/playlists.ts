import { createServerFn } from "@tanstack/react-start";
import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";

export const getPlaylits = createServerFn().handler(async () => {
    const db = await drizzle(env.REVITFY_DATABASE)
    console.log(db)
});