import { AwsClient } from 'aws4fetch'
import { Hono } from 'hono'
import { getDb } from './db'
import familyRoutes from './family'
import playlistRoutes from './playlist'
import { auth } from './auth'

export interface Context {
  Bindings: {
    R2_ACCESS_KEY_ID: string
    R2_SECRET_ACCESS_KEY: string
    CLOUDFLARE_ACCOUNT_ID: string
    DATABASE_URL?: string
    HYPERDRIVE?: { connectionString: string }
  }
  Variables: {
    db: ReturnType<typeof getDb>
  }
}

const app = new Hono<Context>()

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Database helper middleware
app.use('*', async (c, next) => {
  c.set('db', getDb(c.env))
  await next()
})

app.get('/api/', (c) => c.json({ name: 'Hono!' }))

app.get('/api/made-for-you', async (c) => {
  const db = c.get("db");
  
  try {
    const { getAllPlaylistsWithDetails } = await import("./db/playlists");
    const playlists = await getAllPlaylistsWithDetails(db);
    
    // Sort by likes count (most liked first) and take top 5
    const sortedPlaylists = playlists
      .sort((a, b) => b.likesCount - a.likesCount)
      .slice(0, 5);

    return c.json({
      data: sortedPlaylists
    });
  } catch (error) {
    console.error("Error fetching made-for-you playlists:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
})

app.get('/api/recently-used', async (c) => {
  const db = c.get("db");
  
  try {
    const { getAllPlaylistsWithDetails } = await import("./db/playlists");
    const playlists = await getAllPlaylistsWithDetails(db);
    
    // Sort by creation date (most recent first) and take top 5
    const sortedPlaylists = playlists
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return c.json({
      data: sortedPlaylists
    });
  } catch (error) {
    console.error("Error fetching recently-used playlists:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
})

// Mount family routes
app.route('/api/family', familyRoutes)

// Mount playlist routes
app.route('/api/playlist', playlistRoutes)

app.post('/api/create-upload-url', async (c) => {
  const { familyId, fileName } = await c.req.json()
  
  const client = new AwsClient({
    accessKeyId: c.env.R2_ACCESS_KEY_ID,
    secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
  })

  // Replace with your bucket name and account ID
  const bucketName = "revitfy-storage";
  const accountId = c.env.CLOUDFLARE_ACCOUNT_ID;

  const url = new URL(
    `https://${bucketName}.${accountId}.r2.cloudflarestorage.com`,
  );

  // Include filename with extension if provided, otherwise just use familyId
  const filePath = fileName ? `${familyId}/${fileName}` : `${familyId}/preview`;
  url.pathname = `/${filePath}`;
  url.searchParams.set('X-Amz-Expires', '3600');

  const signed = await client.sign(new Request(url, {method: 'PUT'}), { aws: { signQuery: true }})

  return c.json({
    uploadUrl: signed.url,
    storageKey: filePath,
  })
})

export default app