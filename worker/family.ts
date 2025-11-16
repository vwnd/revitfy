import { Hono } from "hono";
import { Context } from "./index";
import {
  getFamilyById,
  createFamily,
  listFamilies,
  deleteFamily,
} from "./db/families";
import { families } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const app = new Hono<Context>();

// List families
app.get("/", async (c) => {
  const db = c.get("db");

  try {
    const limit = c.req.query("limit")
      ? parseInt(c.req.query("limit")!)
      : undefined;
    const offset = c.req.query("offset")
      ? parseInt(c.req.query("offset")!)
      : undefined;
    const category = c.req.query("category");
    const search = c.req.query("search");

    const result = await listFamilies(db, {
      limit,
      offset,
      category,
      search,
    });

    return c.json({
      data: result.families,
      total: result.total,
      limit: limit || 50,
      offset: offset || 0,
    });
  } catch (error) {
    console.error("Error listing families:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Create a family
app.post("/", async (c) => {
  const db = c.get("db");

  try {
    const body = await c.req.json();

    // Validate required fields
    if (!body.id || !body.name || !body.category || !body.userId) {
      return c.json(
        { error: "Missing required fields: id, name, category, userId" },
        400
      );
    }

    // Check if family with this ID already exists
    const existing = await db.query.families.findFirst({
      where: eq(families.id, body.id),
    });

    if (existing) {
      return c.json({ error: "Family with this ID already exists" }, 409);
    }

    const family = await createFamily(db, {
      id: body.id,
      name: body.name,
      category: body.category,
      userId: body.userId,
      previewImageStorageKey: body.previewImageStorageKey,
      rfaFileStorageKey: body.rfaFileStorageKey,
    });

    return c.json(
      {
        data: family,
      },
      201
    );
  } catch (error) {
    console.error("Error creating family:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update family preview image (must come before /:id route)
app.put("/:id/preview-image", async (c) => {
  const { id } = c.req.param();
  const db = c.get("db");

  try {
    const body = await c.req.json();

    if (!body.storageKey) {
      return c.json({ error: "Missing required field: storageKey" }, 400);
    }

    await updateFamilyPreviewImage(db, id, body.storageKey);

    const family = await db.query.families.findFirst({
      where: eq(families.id, id),
    });

    return c.json({
      data: family,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Family not found") {
      return c.json({ error: "Family not found" }, 404);
    }
    console.error("Error updating family preview image:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update family (for updating storage keys)
app.put("/:id", async (c) => {
  const { id } = c.req.param();
  const db = c.get("db");

  try {
    const body = await c.req.json();

    // Check if family exists
    const existing = await db.query.families.findFirst({
      where: eq(families.id, id),
    });

    if (!existing) {
      return c.json({ error: "Family not found" }, 404);
    }

    // Update only provided fields
    const updateData: Partial<typeof families.$inferInsert> = {};
    if (body.previewImageStorageKey !== undefined) {
      updateData.previewImageStorageKey = body.previewImageStorageKey;
    }
    if (body.rfaFileStorageKey !== undefined) {
      updateData.rfaFileStorageKey = body.rfaFileStorageKey;
    }

    await db
      .update(families)
      .set(updateData)
      .where(eq(families.id, id));

    const family = await db.query.families.findFirst({
      where: eq(families.id, id),
    });

    return c.json({
      data: family,
    });
  } catch (error) {
    console.error("Error updating family:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

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

// Delete a family
app.delete("/:id", async (c) => {
  const { id } = c.req.param();
  const db = c.get("db");

  try {
    const deleted = await deleteFamily(db, id);

    if (!deleted) {
      return c.json({ error: "Family not found" }, 404);
    }

    return c.json({ message: "Family deleted successfully" }, 200);
  } catch (error) {
    console.error("Error deleting family:", error);
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
