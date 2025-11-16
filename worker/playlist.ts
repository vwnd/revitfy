import { Hono } from "hono";
import { Context } from "./index";
import {
  createPlaylist,
  getPlaylistById,
  addFamilyToPlaylist,
  updatePlaylistPreviewImage,
  likePlaylist,
  reactToPlaylist,
  getPlaylistFamilies,
  getAllPlaylistsWithDetails,
} from "./db/playlists";
import { playlists, user } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const app = new Hono<Context>();

// Create a playlist
app.post("/", async (c) => {
  const db = c.get("db");

  try {
    const body = await c.req.json();

    // Validate required fields
    if (!body.id || !body.name || !body.userId) {
      return c.json(
        { error: "Missing required fields: id, name, userId" },
        400
      );
    }

    // Check if playlist with this ID already exists
    const existing = await db.query.playlists.findFirst({
      where: eq(playlists.id, body.id),
    });

    if (existing) {
      return c.json({ error: "Playlist with this ID already exists" }, 409);
    }

    // Check if user exists, if not create a default user
    let dbUser = await db.query.user.findFirst({
      where: eq(user.id, body.userId),
    });

    if (!dbUser) {
      try {
        // Create a default user if it doesn't exist
        const [newUser] = await db
          .insert(user)
          .values({
            id: body.userId,
            name: "Default User",
            email: `${body.userId}@example.com`,
            emailVerified: false,
          })
          .returning();
        dbUser = newUser;
      } catch (error) {
        // If user creation fails (e.g., email already exists), try to find by email
        dbUser = await db.query.user.findFirst({
          where: eq(user.email, `${body.userId}@example.com`),
        });
        
        // If still not found, return error
        if (!dbUser) {
          console.error("Error creating user:", error);
          return c.json(
            { error: "Failed to create or find user" },
            500
          );
        }
      }
    }

    const playlist = await createPlaylist(db, {
      id: body.id,
      name: body.name,
      userId: body.userId,
      description: body.description,
      previewImageStorageKey: body.previewImageStorageKey,
    });

    return c.json(
      {
        data: playlist,
      },
      201
    );
  } catch (error) {
    console.error("Error creating playlist:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get all playlists (must come before /:id route)
app.get("/", async (c) => {
  const db = c.get("db");

  try {
    const playlists = await getAllPlaylistsWithDetails(db);

    return c.json({
      data: playlists,
    });
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Add family to playlist
app.post("/:id/families", async (c) => {
  const { id: playlistId } = c.req.param();
  const db = c.get("db");

  try {
    const body = await c.req.json();

    if (!body.familyId) {
      return c.json({ error: "Missing required field: familyId" }, 400);
    }

    await addFamilyToPlaylist(
      db,
      playlistId,
      body.familyId,
      body.order
    );

    // Get updated playlist with details
    const playlist = await getPlaylistById(db, playlistId);

    return c.json(
      {
        data: playlist,
        message: "Family added to playlist successfully",
      },
      200
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Playlist not found" ||
        error.message === "Family not found" ||
        error.message === "Family already in playlist")
    ) {
      return c.json({ error: error.message }, 404);
    }
    console.error("Error adding family to playlist:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update playlist preview image
app.put("/:id/preview-image", async (c) => {
  const { id } = c.req.param();
  const db = c.get("db");

  try {
    const body = await c.req.json();

    if (!body.storageKey) {
      return c.json({ error: "Missing required field: storageKey" }, 400);
    }

    await updatePlaylistPreviewImage(db, id, body.storageKey);

    const playlist = await getPlaylistById(db, id);

    return c.json({
      data: playlist,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Playlist not found") {
      return c.json({ error: "Playlist not found" }, 404);
    }
    console.error("Error updating playlist preview image:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Like a playlist (must come before /:id route)
app.post("/:id/like", async (c) => {
  const { id: playlistId } = c.req.param();
  const db = c.get("db");
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const reaction = await reactToPlaylist(db, playlistId, userId, "like");

    const playlist = await getPlaylistById(db, playlistId);

    return c.json({
      data: playlist,
      reaction,
      message: reaction === "like" ? "Playlist liked" : reaction === "dislike" ? "Reaction changed to dislike" : "Like removed",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Playlist not found") {
      return c.json({ error: "Playlist not found" }, 404);
    }
    console.error("Error liking playlist:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Dislike a playlist (must come before /:id route)
app.post("/:id/dislike", async (c) => {
  const { id: playlistId } = c.req.param();
  const db = c.get("db");
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const reaction = await reactToPlaylist(db, playlistId, userId, "dislike");

    const playlist = await getPlaylistById(db, playlistId);

    return c.json({
      data: playlist,
      reaction,
      message: reaction === "dislike" ? "Playlist disliked" : reaction === "like" ? "Reaction changed to like" : "Dislike removed",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Playlist not found") {
      return c.json({ error: "Playlist not found" }, 404);
    }
    console.error("Error disliking playlist:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get playlist by ID
app.get("/:id", async (c) => {
  const { id } = c.req.param();
  const db = c.get("db");

  try {
    const playlist = await getPlaylistById(db, id);

    if (!playlist) {
      return c.json({ error: "Playlist not found" }, 404);
    }

    // Get families in the playlist
    const families = await getPlaylistFamilies(db, id);

    return c.json({
      data: {
        ...playlist,
        families: families.map((item) => ({
          ...item.family,
          order: item.order,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching playlist:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;

