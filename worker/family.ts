import { Hono } from "hono";
import { Context } from "./index";
import { getFamilyById } from "./db/families";
import { families } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const app = new Hono<Context>();

// Get family by ID
app.get("/:id", async (c) => {
  const { id } = c.req.param();
  const db = c.get("db");

  try {
    const family = await getFamilyById(db, id);

    if (!family) {
      return c.json({ error: "Family not found" }, 404);
    }

    return c.json({
      data: family,
    });
  } catch (error) {
    console.error("Error fetching family:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Helper function to update family preview image
export async function updateFamilyPreviewImage(
  db: ReturnType<typeof import("./db").getDb>,
  familyId: string,
  storageKey: string
) {
  const family = await db.query.families.findFirst({
    where: eq(families.id, familyId),
  });

  if (!family) {
    throw new Error("Family not found");
  }

  await db
    .update(families)
    .set({
      previewImageStorageKey: storageKey,
    })
    .where(eq(families.id, familyId));
}

export default app;
