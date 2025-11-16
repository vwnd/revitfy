import { eq, sql, desc, and, count } from 'drizzle-orm';
import {
  playlists,
  playlistFamilies,
  playlistReactions,
  families,
} from '../../drizzle/schema';
import type { InferSelectModel } from 'drizzle-orm';

type Playlist = InferSelectModel<typeof playlists>;
type Db = ReturnType<typeof import('../db').getDb>;

export interface PlaylistWithDetails extends Playlist {
  likesCount: number;
  familiesCount: number;
}

/**
 * Create a new playlist
 */
export async function createPlaylist(
  db: Db,
  data: {
    id: string;
    name: string;
    userId: string;
    description?: string;
    previewImageStorageKey?: string;
  }
): Promise<Playlist> {
  const [playlist] = await db
    .insert(playlists)
    .values({
      id: data.id,
      name: data.name,
      userId: data.userId,
      description: data.description || null,
      previewImageStorageKey: data.previewImageStorageKey || null,
    })
    .returning();

  return playlist;
}

/**
 * Get playlist by ID with details
 */
export async function getPlaylistById(
  db: Db,
  playlistId: string
): Promise<PlaylistWithDetails | null> {
  const playlist = await db.query.playlists.findFirst({
    where: eq(playlists.id, playlistId),
  });

  if (!playlist) {
    return null;
  }

  // Get likes count
  const [likesResult] = await db
    .select({
      count: count(),
    })
    .from(playlistReactions)
    .where(
      and(
        eq(playlistReactions.playlistId, playlistId),
        eq(playlistReactions.reactionType, 'like')
      )
    );

  const likesCount = Number(likesResult?.count || 0);

  // Get families count
  const [familiesResult] = await db
    .select({
      count: count(),
    })
    .from(playlistFamilies)
    .where(eq(playlistFamilies.playlistId, playlistId));

  const familiesCount = Number(familiesResult?.count || 0);

  return {
    ...playlist,
    likesCount,
    familiesCount,
  };
}

/**
 * Add a family to a playlist
 */
export async function addFamilyToPlaylist(
  db: Db,
  playlistId: string,
  familyId: string,
  order?: number
): Promise<void> {
  // Check if playlist exists
  const playlist = await db.query.playlists.findFirst({
    where: eq(playlists.id, playlistId),
  });

  if (!playlist) {
    throw new Error('Playlist not found');
  }

  // Check if family exists
  const family = await db.query.families.findFirst({
    where: eq(families.id, familyId),
  });

  if (!family) {
    throw new Error('Family not found');
  }

  // Check if already in playlist
  const existing = await db.query.playlistFamilies.findFirst({
    where: and(
      eq(playlistFamilies.playlistId, playlistId),
      eq(playlistFamilies.familyId, familyId)
    ),
  });

  if (existing) {
    throw new Error('Family already in playlist');
  }

  // Get max order if not provided
  let finalOrder = order;
  if (finalOrder === undefined) {
    const [maxOrderResult] = await db
      .select({
        maxOrder: sql<number>`COALESCE(MAX(${playlistFamilies.order}), -1)`.as(
          'max_order'
        ),
      })
      .from(playlistFamilies)
      .where(eq(playlistFamilies.playlistId, playlistId));

    finalOrder = Number(maxOrderResult?.maxOrder || -1) + 1;
  }

  // Generate ID for the junction record
  const id = `${playlistId}-${familyId}`;

  await db.insert(playlistFamilies).values({
    id,
    playlistId,
    familyId,
    order: finalOrder,
  });
}

/**
 * Update playlist preview image
 */
export async function updatePlaylistPreviewImage(
  db: Db,
  playlistId: string,
  storageKey: string
): Promise<void> {
  const playlist = await db.query.playlists.findFirst({
    where: eq(playlists.id, playlistId),
  });

  if (!playlist) {
    throw new Error('Playlist not found');
  }

  await db
    .update(playlists)
    .set({
      previewImageStorageKey: storageKey,
    })
    .where(eq(playlists.id, playlistId));
}

/**
 * Like a playlist (kept for backward compatibility)
 */
export async function likePlaylist(
  db: Db,
  playlistId: string,
  userId: string
): Promise<boolean> {
  const reaction = await reactToPlaylist(db, playlistId, userId, 'like');
  return reaction === 'like';
}

/**
 * React to a playlist (like or dislike)
 * Returns the current reaction state: 'like', 'dislike', or null (no reaction)
 */
export async function reactToPlaylist(
  db: Db,
  playlistId: string,
  userId: string,
  reactionType: 'like' | 'dislike'
): Promise<'like' | 'dislike' | null> {
  // Check if playlist exists
  const playlist = await db.query.playlists.findFirst({
    where: eq(playlists.id, playlistId),
  });

  if (!playlist) {
    throw new Error('Playlist not found');
  }

  // Check if user already has a reaction
  const existing = await db.query.playlistReactions.findFirst({
    where: and(
      eq(playlistReactions.playlistId, playlistId),
      eq(playlistReactions.userId, userId)
    ),
  });

  if (existing) {
    if (existing.reactionType === reactionType) {
      // Same reaction - remove it (toggle off)
      await db
        .delete(playlistReactions)
        .where(
          and(
            eq(playlistReactions.playlistId, playlistId),
            eq(playlistReactions.userId, userId)
          )
        );
      return null;
    } else {
      // Different reaction - update it
      await db
        .update(playlistReactions)
        .set({
          reactionType,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(playlistReactions.playlistId, playlistId),
            eq(playlistReactions.userId, userId)
          )
        );
      return reactionType;
    }
  } else {
    // No existing reaction - add new one
    const id = `${playlistId}-${userId}`;
    await db.insert(playlistReactions).values({
      id,
      playlistId,
      userId,
      reactionType,
    });
    return reactionType;
  }
}

/**
 * Get families in a playlist
 */
export async function getPlaylistFamilies(
  db: Db,
  playlistId: string
): Promise<Array<{ family: InferSelectModel<typeof families>; order: number }>> {
  const playlistFamilyRecords = await db
    .select({
      family: families,
      order: playlistFamilies.order,
    })
    .from(playlistFamilies)
    .innerJoin(families, eq(playlistFamilies.familyId, families.id))
    .where(eq(playlistFamilies.playlistId, playlistId))
    .orderBy(playlistFamilies.order);

  return playlistFamilyRecords;
}

/**
 * Get all playlists with details (for made-for-you and recently-used)
 */
export async function getAllPlaylistsWithDetails(
  db: Db
): Promise<PlaylistWithDetails[]> {
  const allPlaylists = await db.query.playlists.findMany({
    orderBy: desc(playlists.createdAt),
  });

  const playlistsWithDetails = await Promise.all(
    allPlaylists.map(async (playlist) => {
      // Get likes count
      const [likesResult] = await db
        .select({
          count: count(),
        })
        .from(playlistReactions)
        .where(
          and(
            eq(playlistReactions.playlistId, playlist.id),
            eq(playlistReactions.reactionType, 'like')
          )
        );

      const likesCount = Number(likesResult?.count || 0);

      // Get families count
      const [familiesResult] = await db
        .select({
          count: count(),
        })
        .from(playlistFamilies)
        .where(eq(playlistFamilies.playlistId, playlist.id));

      const familiesCount = Number(familiesResult?.count || 0);

      return {
        ...playlist,
        likesCount,
        familiesCount,
      };
    })
  );

  return playlistsWithDetails;
}

