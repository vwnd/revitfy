import { AwsClient } from 'aws4fetch'
import { Hono } from 'hono'
import { getDb } from './db'
import familyRoutes from './family'
import playlistRoutes from './playlist'

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
    userId?: string
  }
}

const app = new Hono<Context>()

app.on(["POST", "GET"], "/api/auth/*", async (c) => {
  const { getAuth } = await import('./auth');
  const auth = getAuth(c.env);
  return auth.handler(c.req.raw);
});

// Database helper middleware
app.use('*', async (c, next) => {
  c.set('db', getDb(c.env))
  await next()
})

// Auth middleware to extract user from session
app.use('*', async (c, next) => {
  // Skip auth for auth routes
  if (c.req.path.startsWith('/api/auth/')) {
    await next()
    return
  }

  try {
    const { getAuth } = await import('./auth')
    const auth = getAuth(c.env)
    
    // Get session from request headers (cookies are included in headers)
    const session = await auth.api.getSession({ 
      headers: c.req.raw.headers
    })
    
    if (session?.user?.id) {
      c.set('userId', session.user.id)
    }
  } catch (error) {
    // If auth fails, continue without userId (for public endpoints)
    // Don't log errors for unauthenticated requests as they're expected
    if (error instanceof Error && !error.message.includes('session')) {
      console.error('Auth middleware error:', error)
    }
  }
  
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

// Serve images from R2 storage
app.get('/api/storage/*', async (c) => {
  try {
    // Get the full path after /api/storage/
    // Try multiple methods to get the path
    let storageKey: string | undefined;
    
    // Method 1: Try using req.param with wildcard
    const wildcardParam = c.req.param('*');
    if (wildcardParam) {
      storageKey = decodeURIComponent(wildcardParam);
    } else {
      // Method 2: Extract from path
      const url = new URL(c.req.url);
      const pathMatch = url.pathname.match(/^\/api\/storage\/(.+)$/);
      if (pathMatch && pathMatch[1]) {
        storageKey = decodeURIComponent(pathMatch[1]);
      }
    }
    
    if (!storageKey || storageKey === '') {
      console.error('Storage key missing. Path:', c.req.path, 'URL:', c.req.url);
      return c.json({ error: 'Storage key is required' }, 400);
    }

    const client = new AwsClient({
      accessKeyId: c.env.R2_ACCESS_KEY_ID,
      secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
    });

    const bucketName = "revitfy-storage";
    const accountId = c.env.CLOUDFLARE_ACCOUNT_ID;

    const r2Url = new URL(
      `https://${bucketName}.${accountId}.r2.cloudflarestorage.com`,
    );
    
    r2Url.pathname = `/${storageKey}`;
    r2Url.searchParams.set('X-Amz-Expires', '3600');

    // Generate signed GET URL
    const signed = await client.sign(new Request(r2Url, {method: 'GET'}), { aws: { signQuery: true }});

    // Fetch the image from R2 and proxy it
    const imageResponse = await fetch(signed.url);
    
    if (!imageResponse.ok) {
      console.error('R2 fetch failed:', imageResponse.status, imageResponse.statusText, 'for key:', storageKey);
      return c.json({ error: 'Image not found' }, 404);
    }

    // Get the image data and content type
    const imageData = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper headers
    return new Response(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error in storage endpoint:', error);
    return c.json({ error: 'Failed to fetch image', details: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

export default app